import { Injectable } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { QueryShopMembersDto } from './dto/query-shop-members.dto';
import { QueryShopItemsDto } from './dto/query-shop-items.dto';
import { QueryShopAuditLogsDto } from './dto/query-shop-audit-logs.dto';
import { UpdateShopDto, ShopContactPatchDto } from './dto/update-shop.dto';
import { ShopAppearancePatchDto, ShopLoyaltyPatchDto } from './dto/update-shop-appearance.dto';
import { AddShopAdminDto } from './dto/add-shop-admin.dto';
import { ShopsCrudService } from './services/shops-crud.service';
import { ShopsAppearanceService } from './services/shops-appearance.service';
import { ShopsMembersService } from './services/shops-members.service';
import { ShopsAuditService } from './services/shops-audit.service';

@Injectable()
export class ShopsService {
  constructor(
    private readonly crud: ShopsCrudService,
    private readonly appearance: ShopsAppearanceService,
    private readonly members: ShopsMembersService,
    private readonly audit: ShopsAuditService,
  ) {}

  findAll() {
    return this.crud.findAll();
  }

  findOne(id: string) {
    return this.crud.findOne(id);
  }

  create(dto: CreateShopDto) {
    return this.crud.create(dto);
  }

  update(id: string, dto: UpdateShopDto, actorUserId?: string | null) {
    return this.crud.update(id, dto, actorUserId);
  }

  deactivate(id: string, actorUserId?: string | null) {
    return this.crud.deactivate(id, actorUserId);
  }

  getTenantShopSettings(tenantId: string) {
    return this.crud.getTenantShopSettings(tenantId);
  }

  updateContactAndAppearanceForTenant(
    tenantId: string,
    contact?: ShopContactPatchDto,
    appearance?: ShopAppearancePatchDto,
    actorUserId?: string | null,
    loyalty?: ShopLoyaltyPatchDto,
  ) {
    return this.crud.updateContactAndAppearanceForTenant(tenantId, contact, appearance, actorUserId, loyalty);
  }

  uploadAppearanceAsset(
    tenantId: string,
    kind: 'logo' | 'favicon',
    file: Express.Multer.File,
    actorUserId?: string | null,
  ) {
    return this.appearance.uploadAppearanceAsset(tenantId, kind, file, actorUserId);
  }

  findMembers(shopId: string, query: QueryShopMembersDto) {
    return this.members.findMembers(shopId, query);
  }

  findItems(shopId: string, query: QueryShopItemsDto) {
    return this.crud.findItems(shopId, query);
  }

  addShopAdmin(shopId: string, dto: AddShopAdminDto, actorUserId?: string | null) {
    return this.members.addShopAdmin(shopId, dto, actorUserId);
  }

  resetMemberPassword(
    shopId: string,
    memberUserId: string,
    plainPassword: string,
    actorUserId?: string | null,
  ) {
    return this.members.resetMemberPassword(shopId, memberUserId, plainPassword, actorUserId);
  }

  setMemberAccountActive(
    shopId: string,
    memberUserId: string,
    is_active: boolean,
    actorUserId?: string | null,
  ) {
    return this.members.setMemberAccountActive(shopId, memberUserId, is_active, actorUserId);
  }

  findAuditLogs(shopId: string, query: QueryShopAuditLogsDto) {
    return this.audit.getAuditLogs(shopId, query);
  }
}
