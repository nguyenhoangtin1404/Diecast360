import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { IStorageService } from '../storage/storage.interface';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { QueryPublicItemsDto } from './dto/query-public-items.dto';

@Injectable()
export class PublicService {
  constructor(
    private prisma: PrismaService,
    @Inject('IStorageService') private storage: IStorageService,
  ) {}

  async findAll(queryDto: QueryPublicItemsDto) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.page_size || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
      deleted_at: null,
      is_public: true,
    };

    if (queryDto.status) {
      where.status = queryDto.status;
    }

    if (queryDto.q) {
      where.name = {
        contains: queryDto.q,
        mode: 'insensitive',
      };
    }

    if (queryDto.car_brand) {
      where.car_brand = {
        contains: queryDto.car_brand,
        mode: 'insensitive',
      };
    }

    if (queryDto.model_brand) {
      where.model_brand = {
        contains: queryDto.model_brand,
        mode: 'insensitive',
      };
    }

    if (queryDto.condition) {
      where.condition = queryDto.condition;
    }

    // Build orderBy
    const sortBy = queryDto.sort_by || 'created_at';
    const sortOrder = queryDto.sort_order || 'desc';
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          item_images: {
            where: { is_cover: true },
            take: 1,
          },
          spin_sets: {
            where: { is_default: true },
            take: 1,
          },
        },
      }),
      this.prisma.item.count({ where }),
    ]);

    const itemsWithMeta = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      scale: item.scale,
      brand: item.brand,
      car_brand: item.car_brand || null,
      model_brand: item.model_brand || null,
      condition: item.condition || null,
      price: item.price != null ? (typeof item.price.toNumber === 'function' ? item.price.toNumber() : Number(item.price)) : null,
      original_price: item.original_price != null ? (typeof item.original_price.toNumber === 'function' ? item.original_price.toNumber() : Number(item.original_price)) : null,
      status: item.status,
      is_public: item.is_public,
      cover_image_url: item.item_images[0]
        ? this.storage.getFileUrl(item.item_images[0].file_path)
        : null,
      has_spinner: item.spin_sets.length > 0,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return {
      items: itemsWithMeta,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.item.findFirst({
      where: {
        id,
        deleted_at: null,
        is_public: true,
      },
      include: {
        item_images: {
          orderBy: { display_order: 'asc' },
        },
        spin_sets: {
          where: { is_default: true },
          take: 1,
          include: {
            frames: {
              orderBy: { frame_index: 'asc' },
            },
          },
        },
      },
    });

    if (!item) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found or not public');
    }

    const { item_images, spin_sets, ...itemData } = item;

    const defaultSpinSet = spin_sets[0] || null;

    const itemDataAny = itemData as any;

    return {
      item: {
        ...itemData,
        price: itemDataAny.price != null ? (typeof itemDataAny.price.toNumber === 'function' ? itemDataAny.price.toNumber() : Number(itemDataAny.price)) : null,
        original_price: itemDataAny.original_price != null ? (typeof itemDataAny.original_price.toNumber === 'function' ? itemDataAny.original_price.toNumber() : Number(itemDataAny.original_price)) : null,
      },
      images: item_images.map((img) => ({
        id: img.id,
        item_id: img.item_id,
        url: this.storage.getFileUrl(img.file_path),
        thumbnail_url: img.thumbnail_path
          ? this.storage.getFileUrl(img.thumbnail_path)
          : null,
        is_cover: img.is_cover,
        display_order: img.display_order,
        created_at: img.created_at,
      })),
      spinner: defaultSpinSet
        ? {
            id: defaultSpinSet.id,
            item_id: defaultSpinSet.item_id,
            label: defaultSpinSet.label,
            is_default: defaultSpinSet.is_default,
            frames: defaultSpinSet.frames.map((frame) => ({
              id: frame.id,
              spin_set_id: frame.spin_set_id,
              frame_index: frame.frame_index,
              image_url: this.storage.getFileUrl(frame.file_path),
              thumbnail_url: frame.thumbnail_path
                ? this.storage.getFileUrl(frame.thumbnail_path)
                : null,
              created_at: frame.created_at,
            })),
            created_at: defaultSpinSet.created_at,
            updated_at: defaultSpinSet.updated_at,
          }
        : null,
    };
  }
}

