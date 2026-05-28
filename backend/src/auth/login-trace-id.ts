import { v7 as uuidv7 } from 'uuid';

/** UUIDv7 for login request correlation (48-bit ms timestamp prefix). */
export function createLoginTraceId(): string {
  return uuidv7();
}
