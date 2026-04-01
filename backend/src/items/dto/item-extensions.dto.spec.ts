import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateItemDto } from './create-item.dto';
import { UpdateItemDto } from './update-item.dto';

describe('Item extension DTO validation', () => {
  const validateCreateDto = async (input: Record<string, unknown>) => {
    const dto = plainToInstance(CreateItemDto, input);
    return validate(dto);
  };

  const validateUpdateDto = async (input: Record<string, unknown>) => {
    const dto = plainToInstance(UpdateItemDto, input);
    return validate(dto);
  };

  const validAttributes = {
    color: 'red',
    release_year: 2024,
    limited: true,
    note: null,
  };

  it('should accept valid quantity and flat attributes on create', async () => {
    const errors = await validateCreateDto({
      name: 'Test Item',
      quantity: 3,
      attributes: validAttributes,
    });

    expect(errors).toHaveLength(0);
  });

  it('should accept valid quantity and flat attributes on update', async () => {
    const errors = await validateUpdateDto({
      quantity: 2,
      attributes: validAttributes,
    });

    expect(errors).toHaveLength(0);
  });

  it('should reject negative or non-integer quantity', async () => {
    const negativeErrors = await validateCreateDto({
      name: 'Test Item',
      quantity: -1,
    });
    const decimalErrors = await validateUpdateDto({
      quantity: 1.5,
    });
    const nullErrors = await validateUpdateDto({
      quantity: null,
    });

    expect(negativeErrors.length).toBeGreaterThan(0);
    expect(decimalErrors.length).toBeGreaterThan(0);
    expect(nullErrors.length).toBeGreaterThan(0);
  });

  it('should reject malformed attributes payloads', async () => {
    const nestedObjectErrors = await validateCreateDto({
      name: 'Test Item',
      attributes: { specs: { material: 'metal' } },
    });
    const arrayErrors = await validateUpdateDto({
      attributes: ['red', 'blue'],
    });

    expect(nestedObjectErrors.length).toBeGreaterThan(0);
    expect(arrayErrors.length).toBeGreaterThan(0);
  });

  it('should reject attributes keys with surrounding whitespace', async () => {
    const errors = await validateCreateDto({
      name: 'Test Item',
      attributes: {
        ' color ': 'red',
      },
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject null attributes payloads', async () => {
    const errors = await validateCreateDto({
      name: 'Test Item',
      attributes: null,
    });

    expect(errors.length).toBeGreaterThan(0);
  });
});
