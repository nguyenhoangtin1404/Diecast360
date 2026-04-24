import { Injectable } from '@nestjs/common';
import {
  MemberPointsMutationType,
  Prisma,
} from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { QueryMembersDto } from './dto/query-members.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { AdjustMemberPointsDto } from './dto/adjust-member-points.dto';
import { CreateMembershipTierDto } from './dto/create-membership-tier.dto';
import { UpdateMembershipTierDto } from './dto/update-membership-tier.dto';
import { applyPointsMutation } from './rules/points-rule.engine';
import { evaluateTierForBalance } from './rules/tier-rule.engine';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async listMembers(tenantId: string, query: QueryMembersDto) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const skip = (page - 1) * pageSize;
    const keyword = query.keyword?.trim();

    const where: Prisma.MemberWhereInput = { shop_id: tenantId };
    if (keyword) {
      where.OR = [
        { full_name: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { phone: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [members, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        include: { tier: true },
        orderBy: [{ points_balance: 'desc' }, { created_at: 'desc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      members,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }

  async getMember(memberId: string, tenantId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shop_id: tenantId },
      include: { tier: true },
    });
    if (!member) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Member not found');
    }
    return { member };
  }

  async createMember(dto: CreateMemberDto, tenantId: string) {
    const normalizedEmail = dto.email?.trim().toLowerCase() || null;
    const normalizedPhone = dto.phone?.trim() || null;

    if (normalizedEmail || normalizedPhone) {
      const existing = await this.prisma.member.findFirst({
        where: {
          shop_id: tenantId,
          OR: [
            ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
            ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
          ],
        },
        select: { id: true },
      });
      if (existing) {
        throw new AppException(
          ErrorCode.VALIDATION_ERROR,
          'Member with email/phone already exists in this shop.',
        );
      }
    }

    const baseTier = await this.prisma.membershipTier.findFirst({
      where: { shop_id: tenantId },
      orderBy: [{ min_points: 'asc' }, { rank: 'asc' }],
      select: { id: true },
    });

    const member = await this.prisma.member.create({
      data: {
        shop_id: tenantId,
        full_name: dto.full_name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        tier_id: baseTier?.id ?? null,
      },
      include: { tier: true },
    });

    return { member };
  }

  async updateMember(memberId: string, dto: UpdateMemberDto, tenantId: string) {
    await this.ensureMemberExists(memberId, tenantId);
    const member = await this.prisma.member.update({
      where: { id: memberId },
      data: {
        full_name: dto.full_name?.trim(),
        email: dto.email === undefined ? undefined : dto.email?.trim().toLowerCase() || null,
        phone: dto.phone === undefined ? undefined : dto.phone?.trim() || null,
      },
      include: { tier: true },
    });
    return { member };
  }

  async listLedger(memberId: string, tenantId: string, query: QueryMembersDto) {
    await this.ensureMemberExists(memberId, tenantId);
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const skip = (page - 1) * pageSize;
    const where = { member_id: memberId, shop_id: tenantId };

    const [entries, total] = await Promise.all([
      this.prisma.memberPointsLedger.findMany({
        where,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.memberPointsLedger.count({ where }),
    ]);

    return {
      entries,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }

  async adjustPoints(
    memberId: string,
    dto: AdjustMemberPointsDto,
    tenantId: string,
    actorUserId: string | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.member.findFirst({
        where: { id: memberId, shop_id: tenantId },
      });
      if (!member) {
        throw new AppException(ErrorCode.NOT_FOUND, 'Member not found');
      }

      const tiers = await tx.membershipTier.findMany({
        where: { shop_id: tenantId },
        select: { id: true, rank: true, min_points: true },
        orderBy: [{ rank: 'asc' }],
      });
      const currentRank = tiers.find((tier) => tier.id === member.tier_id)?.rank ?? 0;

      const { delta, nextBalance } = applyPointsMutation({
        currentBalance: member.points_balance,
        type: this.mapMutation(dto.type),
        points: dto.points,
      });

      const tierEval = evaluateTierForBalance({
        currentTierId: member.tier_id,
        currentRank,
        currentBalance: member.points_balance,
        nextBalance,
        tiers,
      });

      const updated = await tx.member.update({
        where: { id: member.id },
        data: {
          points_balance: nextBalance,
          tier_id: tierEval.nextTierId,
        },
        include: { tier: true },
      });

      const ledger = await tx.memberPointsLedger.create({
        data: {
          member_id: member.id,
          shop_id: tenantId,
          actor_user_id: actorUserId,
          type: dto.type,
          points: Math.abs(dto.points),
          delta,
          balance_after: nextBalance,
          reason: dto.reason.trim(),
          note: dto.note?.trim() || null,
        },
      });

      return {
        member: updated,
        ledger,
        tier_transition: {
          upgraded: tierEval.upgraded,
          downgraded: tierEval.downgraded,
        },
      };
    });
  }

  async listTiers(tenantId: string) {
    const tiers = await this.prisma.membershipTier.findMany({
      where: { shop_id: tenantId },
      orderBy: [{ rank: 'asc' }],
    });
    return { tiers };
  }

  async createTier(tenantId: string, dto: CreateMembershipTierDto) {
    const tier = await this.prisma.membershipTier.create({
      data: {
        shop_id: tenantId,
        name: dto.name.trim(),
        rank: dto.rank,
        min_points: dto.min_points,
      },
    });
    return { tier };
  }

  async updateTier(tenantId: string, tierId: string, dto: UpdateMembershipTierDto) {
    await this.ensureTierExists(tenantId, tierId);
    const tier = await this.prisma.membershipTier.update({
      where: { id: tierId },
      data: {
        name: dto.name?.trim(),
        rank: dto.rank,
        min_points: dto.min_points,
      },
    });
    return { tier };
  }

  async deleteTier(tenantId: string, tierId: string) {
    await this.ensureTierExists(tenantId, tierId);
    await this.prisma.membershipTier.delete({ where: { id: tierId } });
    return { ok: true };
  }

  private async ensureMemberExists(memberId: string, tenantId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shop_id: tenantId },
      select: { id: true },
    });
    if (!member) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Member not found');
    }
  }

  private mapMutation(type: MemberPointsMutationType): 'earn' | 'redeem' | 'adjust' {
    if (type === MemberPointsMutationType.redeem) return 'redeem';
    if (type === MemberPointsMutationType.earn) return 'earn';
    return 'adjust';
  }

  private async ensureTierExists(tenantId: string, tierId: string) {
    const tier = await this.prisma.membershipTier.findFirst({
      where: { id: tierId, shop_id: tenantId },
      select: { id: true },
    });
    if (!tier) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Membership tier not found');
    }
  }
}
