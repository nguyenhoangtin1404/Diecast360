import { Injectable } from '@nestjs/common';
import { PlatformRole, PreOrderStatus } from '../generated/prisma/client';
import { CreatePreorderDto } from './dto/create-preorder.dto';
import { UpdatePreorderDto } from './dto/update-preorder.dto';
import { QueryPreordersDto } from './dto/query-preorders.dto';
import { PreordersCrudService } from './services/preorders-crud.service';
import { PreordersStatusService } from './services/preorders-status.service';
import { PreordersFinancialService } from './services/preorders-financial.service';

@Injectable()
export class PreordersService {
  constructor(
    private readonly crud: PreordersCrudService,
    private readonly status: PreordersStatusService,
    private readonly financial: PreordersFinancialService,
  ) {}

  create(
    dto: CreatePreorderDto,
    tenantId: string,
    actor: { userId: string | null; platformRole: PlatformRole | null },
  ) {
    return this.crud.create(dto, tenantId, actor);
  }

  update(
    id: string,
    dto: UpdatePreorderDto,
    tenantId: string,
    actor: { userId: string | null; platformRole: PlatformRole | null },
  ) {
    return this.crud.update(id, dto, tenantId, actor);
  }

  transitionStatus(
    id: string,
    nextStatus: PreOrderStatus,
    tenantId: string,
    actorUserId: string | null,
  ) {
    return this.status.transitionStatus(id, nextStatus, tenantId, actorUserId);
  }

  findAdminList(query: QueryPreordersDto, tenantId: string) {
    return this.crud.findAdminList(query, tenantId);
  }

  findPublicCards(shopId: string, query: QueryPreordersDto) {
    return this.crud.findPublicCards(shopId, query);
  }

  findMyOrders(userId: string, tenantId: string, query: QueryPreordersDto) {
    return this.crud.findMyOrders(userId, tenantId, query);
  }

  getAdminSummary(tenantId: string) {
    return this.crud.getAdminSummary(tenantId);
  }

  getCampaignParticipants(itemId: string, tenantId: string, query: QueryPreordersDto = {}) {
    return this.crud.getCampaignParticipants(itemId, tenantId, query);
  }

  getCampaignItemSummary(itemId: string, tenantId: string) {
    return this.crud.getCampaignItemSummary(itemId, tenantId);
  }

  getReceipt(
    id: string,
    tenantId: string,
    actor: { userId: string | null; platformRole: PlatformRole | null },
  ) {
    return this.financial.getReceipt(id, tenantId, actor);
  }
}
