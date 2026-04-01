import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export type ItemAttributeValue = string | number | boolean | null;
export type ItemAttributesInput = Record<string, ItemAttributeValue>;

const RESERVED_ATTRIBUTE_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const MAX_ATTRIBUTE_COUNT = 50;
const MAX_ATTRIBUTE_KEY_LENGTH = 50;
const MAX_ATTRIBUTE_STRING_LENGTH = 500;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isValidAttributeValue(value: unknown): value is ItemAttributeValue {
  if (value === null) {
    return true;
  }

  if (typeof value === 'string') {
    return value.length <= MAX_ATTRIBUTE_STRING_LENGTH;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  return typeof value === 'boolean';
}

function isValidAttributeKey(key: string): boolean {
  if (RESERVED_ATTRIBUTE_KEYS.has(key)) {
    return false;
  }

  return key.trim() === key && key.length > 0 && key.length <= MAX_ATTRIBUTE_KEY_LENGTH;
}

export function isValidItemAttributes(value: unknown): value is ItemAttributesInput {
  if (!isPlainObject(value)) {
    return false;
  }

  const entries = Object.entries(value);
  if (entries.length > MAX_ATTRIBUTE_COUNT) {
    return false;
  }

  return entries.every(([key, entryValue]) => (
    isValidAttributeKey(key) && isValidAttributeValue(entryValue)
  ));
}

export function IsItemAttributes(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isItemAttributes',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined) {
            return true;
          }
          return isValidItemAttributes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a plain object with up to ${MAX_ATTRIBUTE_COUNT} trimmed keys; values must be string, number, boolean, or null`;
        },
      },
    });
  };
}
