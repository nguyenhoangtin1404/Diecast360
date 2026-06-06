import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';

export const CUSTOM_INSTRUCTIONS_MAX = 2000;

export function clampCustomInstructions(raw?: string): string | undefined {
  if (raw == null || typeof raw !== 'string') return undefined;
  const t = raw.trim();
  if (!t) return undefined;
  return t.length <= CUSTOM_INSTRUCTIONS_MAX ? t : t.slice(0, CUSTOM_INSTRUCTIONS_MAX);
}

export function parseJsonObject(
  content: string | null | undefined,
  malformedMessage: string,
): Record<string, unknown> {
  if (!content || !content.trim()) {
    throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, 'AI did not return content');
  }
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```/i);
  const normalized = (fencedMatch?.[1] ?? trimmed).trim();
  try {
    const parsed = JSON.parse(normalized) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, malformedMessage);
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof AppException) throw error;
    throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, malformedMessage);
  }
}

export function getProviderError(error: unknown): { status?: number; message?: string } {
  if (!error || typeof error !== 'object') return {};
  const candidate = error as Record<string, unknown>;
  return {
    status: typeof candidate.status === 'number' ? candidate.status : undefined,
    message: typeof candidate.message === 'string' ? candidate.message : undefined,
  };
}

export function mapProviderError(error: unknown, fallbackMessage: string): AppException {
  const providerError = getProviderError(error);
  if (providerError?.status === 429) {
    return new AppException(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'AI rate limit exceeded. Please try again later.',
    );
  }
  if (providerError?.status && providerError.status >= 400 && providerError.status < 500) {
    return new AppException(
      ErrorCode.VALIDATION_ERROR,
      'Invalid AI request. Please review the input and try again.',
    );
  }
  return new AppException(ErrorCode.INTERNAL_SERVER_ERROR, fallbackMessage);
}
