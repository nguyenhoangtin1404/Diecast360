import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { QueryMembersDto } from './dto/query-members.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { AdjustMemberPointsDto } from './dto/adjust-member-points.dto';
import { CreateMembershipTierDto } from './dto/create-membership-tier.dto';
import { UpdateMembershipTierDto } from './dto/update-membership-tier.dto';
import { resolvePointsAdjustment } from './rules/points-adjustment.resolver';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);
  private readonly tierCache = new Map<string, { tiers: Awaited<ReturnType<PrismaService['membershipTier']['findMany']>>; expiresAt: number }>();
  private readonly tierCacheTtlMs = 300_000;
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
    try {
      return await this.prisma.$transaction(async (tx) => {
        const normalizedEmail = dto.email?.trim().toLowerCase() || null;
        const normalizedPhone = dto.phone?.trim() || null;

        if (normalizedEmail || normalizedPhone) {
          const candidates = await tx.member.findMany({
            where: {
              shop_id: tenantId,
              OR: [
                ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
                ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
              ],
            },
            select: { id: true, email: true, phone: true },
          });
          const emailConflict = normalizedEmail
            ? candidates.some((candidate) => candidate.email === normalizedEmail)
            : false;
          const phoneConflict = normalizedPhone
            ? candidates.some((candidate) => candidate.phone === normalizedPhone)
            : false;

          if (emailConflict && phoneConflict) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, 'Both email and phone already exist in this shop.');
          }
          if (emailConflict) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, 'Email already exists in this shop.');
          }
          if (phoneConflict) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, 'Phone already exists in this shop.');
          }
        }

        const baseTier = await tx.membershipTier.findFirst({
          where: { shop_id: tenantId },
          orderBy: [{ min_points: 'asc' }, { rank: 'asc' }],
          select: { id: true },
        });

        const member = await tx.member.create({
          data: {
            shop_id: tenantId,
            full_name: dto.full_name.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            tier_id: baseTier?.id ?? null,
          },
          include: { tier: true },
        });

        this.logger.log(`member.created tenant=${tenantId} member=${member.id} tier=${member.tier_id ?? 'none'}`);
        return { member };
      });
    } catch (error) {
      this.logger.error(`createMember failed for tenant=${tenantId}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async updateMember(memberId: string, dto: UpdateMemberDto, tenantId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingMember = await tx.member.findFirst({
          where: { id: memberId, shop_id: tenantId },
          select: { id: true, email: true, phone: true },
        });
        if (!existingMember) {
          throw new AppException(ErrorCode.NOT_FOUND, 'Member not found');
        }
        if (dto.email !== undefined && dto.email !== null && dto.email.trim() === '') {
          throw new AppException(
            ErrorCode.VALIDATION_ERROR,
            'Email must be a valid value or null. Empty string is not allowed.',
          );
        }
        if (dto.phone !== undefined && dto.phone !== null && dto.phone.trim() === '') {
          throw new AppException(
            ErrorCode.VALIDATION_ERROR,
            'Phone must be a valid value or null. Empty string is not allowed.',
          );
        }

        const nextEmail = dto.email === undefined ? undefined : dto.email?.trim().toLowerCase() || null;
        const nextPhone = dto.phone === undefined ? undefined : dto.phone?.trim() || null;
        if (nextEmail || nextPhone) {
          const candidates = await tx.member.findMany({
            where: {
              shop_id: tenantId,
              id: { not: memberId },
              OR: [
                ...(nextEmail ? [{ email: nextEmail }] : []),
                ...(nextPhone ? [{ phone: nextPhone }] : []),
              ],
            },
            select: { email: true, phone: true },
          });
          if (nextEmail && candidates.some((candidate) => candidate.email === nextEmail)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, 'Email already exists in this shop.');
          }
          if (nextPhone && candidates.some((candidate) => candidate.phone === nextPhone)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, 'Phone already exists in this shop.');
          }
        }

        const member = await tx.member.update({
          where: { id: memberId },
          data: {
            full_name: dto.full_name?.trim(),
            email: nextEmail,
            phone: nextPhone,
          },
          include: { tier: true },
        });
        this.logger.log(`member.updated tenant=${tenantId} member=${member.id}`);
        return { member };
      });
    } catch (error) {
      this.logger.error(
        `updateMember failed for member=${memberId} tenant=${tenantId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async deleteMember(memberId: string, tenantId: string) {
    await this.ensureMemberExists(memberId, tenantId);
    await this.prisma.member.delete({ where: { id: memberId } });
    this.logger.log(`member.deleted tenant=${tenantId} member=${memberId}`);
    return { ok: true };
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
    try {
      return await this.prisma.$transaction(async (tx) => {
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
        const pointsResolution = resolvePointsAdjustment({
          type: dto.type,
          points: dto.points,
          currentBalance: member.points_balance,
          currentTierId: member.tier_id,
          tiers,
        });

        const updated = await tx.member.update({
          where: { id: member.id },
          data: {
            points_balance: pointsResolution.nextBalance,
            tier_id: pointsResolution.nextTierId,
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
            delta: pointsResolution.delta,
            balance_after: pointsResolution.nextBalance,
            reason: dto.reason.trim(),
            note: dto.note?.trim() || null,
          },
        });

        this.logger.log(
          `points.adjusted tenant=${tenantId} member=${member.id} actor=${actorUserId ?? 'system'} type=${dto.type} delta=${pointsResolution.delta} balance=${pointsResolution.nextBalance}`,
        );
        return {
          member: updated,
          ledger,
          tier_transition: pointsResolution.tierTransition,
        };
      });
    } catch (error) {
      this.logger.error(
        `adjustPoints failed for member=${memberId} tenant=${tenantId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async listTiers(tenantId: string) {
    const cached = this.tierCache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`tier.cache_hit tenant=${tenantId}`);
      return { tiers: cached.tiers };
    }
    this.logger.debug(`tier.cache_miss tenant=${tenantId}`);

    const tiers = await this.prisma.membershipTier.findMany({
      where: { shop_id: tenantId },
      orderBy: [{ rank: 'asc' }],
    });
    this.tierCache.set(tenantId, {
      tiers,
      expiresAt: Date.now() + this.tierCacheTtlMs,
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
    this.clearTierCache(tenantId);
    this.logger.log(`tier.created tenant=${tenantId} tier=${tier.id} rank=${tier.rank}`);
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
    this.clearTierCache(tenantId);
    this.logger.log(`tier.updated tenant=${tenantId} tier=${tier.id}`);
    return { tier };
  }

  async deleteTier(tenantId: string, tierId: string) {
    await this.ensureTierExists(tenantId, tierId);
    await this.prisma.membershipTier.delete({ where: { id: tierId } });
    this.clearTierCache(tenantId);
    this.logger.log(`tier.deleted tenant=${tenantId} tier=${tierId}`);
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
  private async ensureTierExists(tenantId: string, tierId: string) {
    const tier = await this.prisma.membershipTier.findFirst({
      where: { id: tierId, shop_id: tenantId },
      select: { id: true },
    });
    if (!tier) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Membership tier not found');
    }
  }

  private clearTierCache(tenantId: string) {
    this.tierCache.delete(tenantId);
  }
}
