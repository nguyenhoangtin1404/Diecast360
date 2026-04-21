import axios from 'axios';

const DEFAULT_TRANSITION_ERROR = 'Chuyển trạng thái thất bại. Vui lòng thử lại.';

/** Lấy message từ payload lỗi API (sau interceptor axios) hoặc AxiosError. */
export function messageFromPreorderTransitionError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    const m = data?.message?.trim();
    if (m) return m;
  }
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === 'string' && m.trim().length > 0) return m.trim();
  }
  return DEFAULT_TRANSITION_ERROR;
}
