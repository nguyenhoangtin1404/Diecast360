import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { IStorageService } from '../storage/storage.interface';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { QueryItemsDto } from './dto/query-items.dto';

@Injectable()
export class ItemsService {
  constructor(
    private prisma: PrismaService,
    @Inject('IStorageService') private storage: IStorageService,
  ) {}

  async findAll(queryDto: QueryItemsDto) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.page_size || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
      deleted_at: null,
    };

    if (queryDto.status) {
      where.status = queryDto.status;
    }

    if (queryDto.is_public !== undefined) {
      where.is_public = queryDto.is_public;
    }

    if (queryDto.q) {
      where.name = {
        contains: queryDto.q,
        mode: 'insensitive',
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
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

    const itemsWithCover = items.map((item: any) => ({
      ...item,
      price: item.price != null ? (typeof item.price.toNumber === 'function' ? item.price.toNumber() : Number(item.price)) : null,
      original_price: item.original_price != null ? (typeof item.original_price.toNumber === 'function' ? item.original_price.toNumber() : Number(item.original_price)) : null,
      cover_image_url: item.item_images[0]
        ? this.getImageUrl(item.item_images[0].file_path)
        : null,
      has_default_spin_set: item.spin_sets.length > 0,
      item_images: undefined,
      spin_sets: undefined,
    }));

    return {
      items: itemsWithCover,
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
      },
      include: {
        item_images: {
          orderBy: { display_order: 'asc' },
        },
        spin_sets: {
          include: {
            frames: {
              orderBy: { frame_index: 'asc' },
            },
          },
        },
      },
    });

    if (!item) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    }

    const { item_images, spin_sets, ...itemData } = item;

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
        url: this.getImageUrl(img.file_path),
        thumbnail_url: img.thumbnail_path ? this.getImageUrl(img.thumbnail_path) : null,
        is_cover: img.is_cover,
        display_order: img.display_order,
        created_at: img.created_at,
      })),
      spin_sets: spin_sets.map((set) => ({
        id: set.id,
        item_id: set.item_id,
        label: set.label,
        is_default: set.is_default,
        frames: set.frames.map((frame) => ({
          id: frame.id,
          spin_set_id: frame.spin_set_id,
          frame_index: frame.frame_index,
          image_url: this.getImageUrl(frame.file_path),
          thumbnail_url: frame.thumbnail_path ? this.getImageUrl(frame.thumbnail_path) : null,
          created_at: frame.created_at,
        })),
        created_at: set.created_at,
        updated_at: set.updated_at,
      })),
    };
  }

  async create(createDto: CreateItemDto) {
    const item = await this.prisma.item.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        scale: createDto.scale || '1:64',
        brand: createDto.brand,
        car_brand: createDto.car_brand || null,
        model_brand: createDto.model_brand || null,
        condition: (createDto.condition as 'new' | 'old' | undefined) || null,
        price: createDto.price !== undefined && createDto.price !== null ? createDto.price : null,
        original_price: createDto.original_price !== undefined && createDto.original_price !== null ? createDto.original_price : null,
        status: (createDto.status as any) || 'con_hang',
        is_public: createDto.is_public || false,
      },
    });

    return { item };
  }

  async update(id: string, updateDto: UpdateItemDto) {
    const existingItem = await this.prisma.item.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!existingItem) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    }

    const updateData: any = {};
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.scale !== undefined) updateData.scale = updateDto.scale;
    if (updateDto.brand !== undefined) updateData.brand = updateDto.brand;
    if (updateDto.car_brand !== undefined) updateData.car_brand = updateDto.car_brand;
    if (updateDto.model_brand !== undefined) updateData.model_brand = updateDto.model_brand;
    if (updateDto.condition !== undefined) updateData.condition = updateDto.condition as 'new' | 'old' | null;
    if (updateDto.price !== undefined) {
      updateData.price = updateDto.price !== null ? updateDto.price : null;
    }
    if (updateDto.original_price !== undefined) {
      updateData.original_price = updateDto.original_price !== null ? updateDto.original_price : null;
    }
    if (updateDto.status !== undefined) updateData.status = updateDto.status as any;
    if (updateDto.is_public !== undefined) updateData.is_public = updateDto.is_public;

    const item = await this.prisma.item.update({
      where: { id },
      data: updateData,
    });

    return { item };
  }

  async remove(id: string) {
    const existingItem = await this.prisma.item.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!existingItem) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    }

    await this.prisma.item.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return {};
  }

  private getImageUrl(filePath: string): string {
    // Use storage service to get consistent URL format
    return this.storage.getFileUrl(filePath);
  }
}

