import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { CsvFieldValue } from '../../common/types/item.types';
import { ItemsCrudService } from './items-crud.service';

@Injectable()
export class ItemsExportService {
  constructor(
    private prisma: PrismaService,
    private crudService: ItemsCrudService,
  ) {}

  async exportCsv(tenantId: string): Promise<string> {
    const shopId = this.crudService.requireActiveShopId(tenantId);
    const items = await this.prisma.item.findMany({
      where: {
        deleted_at: null,
        shop_id: shopId,
      },
      orderBy: { created_at: 'desc' },
    });

    const headers = [
      'id',
      'name',
      'description',
      'status',
      'is_public',
      'condition',
      'scale',
      'brand',
      'car_brand',
      'model_brand',
      'price',
      'original_price',
      'created_at',
      'updated_at',
    ];

    const escapeCsvField = (value: CsvFieldValue): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = items.map((item) => {
      const itemRecord = item as Record<string, CsvFieldValue>;
      return headers.map((header) => {
        let value = itemRecord[header];
        // Handle Decimal type from Prisma
        if (value !== null && typeof (value as { toNumber?: () => number })?.toNumber === 'function') {
          value = (value as { toNumber: () => number }).toNumber();
        }
        // Format dates
        if (value instanceof Date) {
          value = value.toISOString();
        }
        return escapeCsvField(value);
      }).join(',');
    });

    // Add UTF-8 BOM for Excel Vietnamese compatibility
    return '﻿' + [headers.join(','), ...rows].join('\n');
  }
}
