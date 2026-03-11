import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryPublicItemsDto } from './query-public-items.dto';

describe('QueryPublicItemsDto', () => {
  const validateDto = async (input: Record<string, unknown>) => {
    const dto = plainToInstance(QueryPublicItemsDto, input);
    return validate(dto);
  };

  it('should reject page less than 1', async () => {
    const zeroPageErrors = await validateDto({ page: 0 });
    const negativePageErrors = await validateDto({ page: -1 });

    expect(zeroPageErrors.length).toBeGreaterThan(0);
    expect(negativePageErrors.length).toBeGreaterThan(0);
  });

  it('should reject page_size greater than 100', async () => {
    const errors = await validateDto({ page_size: 101 });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject page_size less than 1', async () => {
    const zeroErrors = await validateDto({ page_size: 0 });
    const negativeErrors = await validateDto({ page_size: -1 });

    expect(zeroErrors.length).toBeGreaterThan(0);
    expect(negativeErrors.length).toBeGreaterThan(0);
  });

  it('should reject invalid sort_by and sort_order values', async () => {
    const invalidSortByErrors = await validateDto({ sort_by: 'invalid' });
    const invalidSortOrderErrors = await validateDto({ sort_order: 'invalid' });

    expect(invalidSortByErrors.length).toBeGreaterThan(0);
    expect(invalidSortOrderErrors.length).toBeGreaterThan(0);
  });

  it('should reject car_brand/model_brand longer than 100 chars', async () => {
    const tooLong = 'a'.repeat(101);
    const carBrandErrors = await validateDto({ car_brand: tooLong });
    const modelBrandErrors = await validateDto({ model_brand: tooLong });

    expect(carBrandErrors.length).toBeGreaterThan(0);
    expect(modelBrandErrors.length).toBeGreaterThan(0);
  });

  it('should reject q longer than 200 chars', async () => {
    const tooLongQuery = 'q'.repeat(201);
    const errors = await validateDto({ q: tooLongQuery });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should accept valid paging values', async () => {
    const errors = await validateDto({ page: 2, page_size: 50 });

    expect(errors).toHaveLength(0);
  });
});
