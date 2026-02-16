import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';

/**
 * Maps category type to the corresponding field on the Item model.
 * When adding a new category type, add its mapping here.
 */
const CATEGORY_TYPE_TO_ITEM_FIELD: Record<string, string> = {
  car_brand: 'car_brand',
  model_brand: 'model_brand',
};

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(queryDto: QueryCategoriesDto) {
    const where: Record<string, unknown> = {};

    if (queryDto.type) {
      where.type = queryDto.type;
    }

    if (queryDto.is_active !== undefined) {
      where.is_active = queryDto.is_active;
    }

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
    });

    return { categories };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    return { category };
  }

  async create(dto: CreateCategoryDto) {
    // Check for duplicate name+type
    const existing = await this.prisma.category.findUnique({
      where: { type_name: { type: dto.type, name: dto.name } },
    });

    if (existing) {
      throw new ConflictException(
        `Danh mục "${dto.name}" đã tồn tại trong loại "${dto.type}"`,
      );
    }

    // If no display_order provided, set to max + 1
    let displayOrder = dto.display_order;
    if (displayOrder === undefined) {
      const maxOrder = await this.prisma.category.aggregate({
        where: { type: dto.type },
        _max: { display_order: true },
      });
      displayOrder = (maxOrder._max.display_order ?? -1) + 1;
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        type: dto.type,
        display_order: displayOrder,
      },
    });

    this.logger.log(`Category created: ${category.name} (${category.type})`);

    return { category };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    const isRenaming = dto.name && dto.name !== existing.name;

    // If renaming, check for duplicates
    if (isRenaming) {
      const duplicate = await this.prisma.category.findUnique({
        where: { type_name: { type: existing.type, name: dto.name! } },
      });

      if (duplicate) {
        throw new ConflictException(
          `Danh mục "${dto.name}" đã tồn tại trong loại "${existing.type}"`,
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.display_order !== undefined) data.display_order = dto.display_order;

    // Use transaction to cascade rename to items
    if (isRenaming) {
      const itemField = CATEGORY_TYPE_TO_ITEM_FIELD[existing.type];

      const [category] = await this.prisma.$transaction([
        this.prisma.category.update({ where: { id }, data }),
        this.prisma.item.updateMany({
          where: { [itemField]: existing.name, deleted_at: null },
          data: { [itemField]: dto.name },
        }),
      ]);

      const updatedCount = await this.prisma.item.count({
        where: { [itemField]: dto.name, deleted_at: null },
      });

      this.logger.log(
        `Category renamed: "${existing.name}" → "${dto.name}" (${existing.type}), ${updatedCount} items updated`,
      );

      return { category };
    }

    const category = await this.prisma.category.update({
      where: { id },
      data,
    });

    return { category };
  }

  async toggleActive(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: { is_active: !existing.is_active },
    });

    this.logger.log(
      `Category toggled: ${category.name} → ${category.is_active ? 'active' : 'inactive'}`,
    );

    return { category };
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    // Check if any items are using this category
    const itemField = CATEGORY_TYPE_TO_ITEM_FIELD[existing.type];
    if (!itemField) {
      throw new ConflictException(
        `Loại danh mục "${existing.type}" không có ánh xạ trường hợp lệ`,
      );
    }

    const usageCount = await this.prisma.item.count({
      where: {
        [itemField]: existing.name,
        deleted_at: null,
      },
    });

    if (usageCount > 0) {
      throw new ConflictException(
        `Không thể xoá danh mục "${existing.name}" vì đang được sử dụng bởi ${usageCount} sản phẩm`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    this.logger.log(`Category deleted: ${existing.name} (${existing.type})`);

    return { message: 'Đã xoá danh mục thành công' };
  }
}
