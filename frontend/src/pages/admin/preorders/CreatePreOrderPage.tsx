import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPreorder } from '../../../api/preorders';
import { isOptionalHttpOrHttpsUrl } from '../../../utils/safeHttpUrl';
import styles from './preordersAdmin.module.css';

type FormState = {
  cover_image_url: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  deposit_amount: number;
  paid_amount: number;
  expected_arrival_at: string;
  expected_delivery_at: string;
  note: string;
};

const emptyForm = (itemId: string): FormState => ({
  cover_image_url: '',
  item_id: itemId,
  quantity: 1,
  unit_price: 0,
  deposit_amount: 0,
  paid_amount: 0,
  expected_arrival_at: '',
  expected_delivery_at: '',
  note: '',
});

/** `datetime-local` value → ISO string for API, or undefined if empty. */
const toIsoOrUndefined = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
};

const parseOptionalLocalDateTime = (value: string): Date | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

type CreatePreOrderFormProps = {
  initialItemId: string;
};

const CreatePreOrderForm = ({ initialItemId }: CreatePreOrderFormProps) => {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => emptyForm(initialItemId));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const postSuccessNavigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (postSuccessNavigateTimeoutRef.current !== undefined) {
        clearTimeout(postSuccessNavigateTimeoutRef.current);
      }
    };
  }, []);

  const createMutation = useMutation({
    mutationFn: createPreorder,
    onSuccess: () => {
      setSuccess('Đã tạo pre-order thành công.');
      setError(null);
      if (postSuccessNavigateTimeoutRef.current !== undefined) {
        clearTimeout(postSuccessNavigateTimeoutRef.current);
      }
      postSuccessNavigateTimeoutRef.current = setTimeout(() => {
        postSuccessNavigateTimeoutRef.current = undefined;
        navigate('/admin/preorders');
      }, 1200);
    },
    onError: () => {
      setError('Tạo pre-order thất bại. Vui lòng kiểm tra lại.');
      setSuccess(null);
    },
  });

  const validationError = (() => {
    if (!Number.isFinite(form.quantity) || !Number.isInteger(form.quantity) || form.quantity < 1) {
      return 'Số lượng phải là số nguyên dương.';
    }
    if (!Number.isFinite(form.unit_price) || form.unit_price < 0) {
      return 'Giá dự kiến không được âm.';
    }
    if (!Number.isFinite(form.deposit_amount) || form.deposit_amount < 0) {
      return 'Tiền đặt cọc không được âm.';
    }
    if (!Number.isFinite(form.paid_amount) || form.paid_amount < 0) {
      return 'Tiền đã thanh toán không được âm.';
    }
    const hasUnitPriceCap = Number.isFinite(form.unit_price) && form.unit_price > 0;
    const totalAmount = hasUnitPriceCap ? form.unit_price * form.quantity : null;
    if (totalAmount != null) {
      if (form.deposit_amount > totalAmount) {
        return 'Tiền đặt cọc không được vượt tổng giá trị đơn.';
      }
      if (form.paid_amount > totalAmount) {
        return 'Tiền đã thanh toán không được vượt tổng giá trị đơn.';
      }
    }
    if (form.paid_amount < form.deposit_amount) {
      return 'Tiền đã thanh toán không được nhỏ hơn tiền đặt cọc.';
    }
    if (form.cover_image_url.trim().length > 2048) {
      return 'URL ảnh cover không được vượt 2048 ký tự.';
    }
    if (!isOptionalHttpOrHttpsUrl(form.cover_image_url)) {
      return 'URL ảnh cover phải là địa chỉ http:// hoặc https:// hợp lệ.';
    }

    const arrival = parseOptionalLocalDateTime(form.expected_arrival_at);
    const delivery = parseOptionalLocalDateTime(form.expected_delivery_at);
    if (form.expected_arrival_at.trim() && !arrival) {
      return 'Ngày dự kiến về hàng không hợp lệ.';
    }
    if (form.expected_delivery_at.trim() && !delivery) {
      return 'Ngày dự kiến giao hàng không hợp lệ.';
    }
    if (arrival && delivery && delivery.getTime() < arrival.getTime()) {
      return 'Ngày giao hàng không được trước ngày về hàng.';
    }

    return null;
  })();

  const canSubmit = form.item_id.trim().length > 0 && !validationError;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Tạo Pre-Order Mới</h1>
        <p>Nhập thông tin campaign pre-order theo mẫu MVP mobile.</p>
      </div>

      <form
        className={`${styles.card} ${styles.row}`}
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canSubmit) {
            setError(validationError ?? 'Vui lòng nhập item_id và thông tin hợp lệ.');
            return;
          }
          await createMutation.mutateAsync({
            item_id: form.item_id.trim(),
            quantity: form.quantity,
            unit_price:
              Number.isFinite(form.unit_price) && form.unit_price > 0 ? form.unit_price : undefined,
            deposit_amount: form.deposit_amount,
            paid_amount: form.paid_amount,
            expected_arrival_at: toIsoOrUndefined(form.expected_arrival_at),
            expected_delivery_at: toIsoOrUndefined(form.expected_delivery_at),
            note: form.note.trim() || undefined,
            cover_image_url: form.cover_image_url.trim() || undefined,
          });
        }}
      >
        <label>
          Khu vực upload ảnh sản phẩm (MVP placeholder)
          <input
            className={styles.input}
            placeholder="URL ảnh cover (tùy chọn)"
            maxLength={2048}
            value={form.cover_image_url}
            onChange={(event) =>
              setForm((current) => ({ ...current, cover_image_url: event.target.value }))
            }
          />
        </label>

        <div className={styles.gridTwo}>
          <label>
            Item ID
            <input
              className={styles.input}
              data-testid="admin-preorder-item-id"
              value={form.item_id}
              onChange={(event) => setForm((current) => ({ ...current, item_id: event.target.value }))}
            />
          </label>
          <label>
            Số lượng
            <input
              className={styles.input}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              data-testid="admin-preorder-quantity"
              value={form.quantity}
              onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
            />
          </label>
        </div>

        <div className={styles.gridTwo}>
          <label>
            Giá dự kiến
            <input
              className={styles.input}
              type="number"
              min={0}
              data-testid="admin-preorder-unit-price"
              value={form.unit_price}
              onChange={(event) => setForm((current) => ({ ...current, unit_price: Number(event.target.value) }))}
            />
          </label>
          <label>
            Đặt cọc
            <input
              className={styles.input}
              type="number"
              min={0}
              data-testid="admin-preorder-deposit-amount"
              value={form.deposit_amount}
              onChange={(event) => setForm((current) => ({ ...current, deposit_amount: Number(event.target.value) }))}
            />
          </label>
        </div>

        <div className={styles.gridTwo}>
          <label>
            Đã thanh toán
            <input
              className={styles.input}
              type="number"
              min={0}
              data-testid="admin-preorder-paid-amount"
              value={form.paid_amount}
              onChange={(event) => setForm((current) => ({ ...current, paid_amount: Number(event.target.value) }))}
            />
          </label>
        </div>

        <div className={styles.gridTwo}>
          <label>
            Dự kiến về hàng
            <input
              className={styles.input}
              type="datetime-local"
              value={form.expected_arrival_at}
              onChange={(event) => setForm((current) => ({ ...current, expected_arrival_at: event.target.value }))}
            />
          </label>
          <label>
            Dự kiến giao hàng
            <input
              className={styles.input}
              type="datetime-local"
              value={form.expected_delivery_at}
              onChange={(event) => setForm((current) => ({ ...current, expected_delivery_at: event.target.value }))}
            />
          </label>
        </div>

        <label>
          Ghi chú admin
          <textarea
            className={styles.textarea}
            data-testid="admin-preorder-note"
            value={form.note}
            onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
          />
        </label>
        {validationError && <p className={styles.error}>{validationError}</p>}

        <button
          className={styles.buttonPrimary}
          type="submit"
          data-testid="admin-preorder-submit"
          disabled={!canSubmit || createMutation.isPending}
        >
          {createMutation.isPending ? 'Đang tạo...' : 'Lưu campaign pre-order'}
        </button>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
      </form>
    </div>
  );
};

export const CreatePreOrderPage = () => {
  const [searchParams] = useSearchParams();
  const itemIdFromQuery = searchParams.get('item_id')?.trim() ?? '';

  return <CreatePreOrderForm key={itemIdFromQuery} initialItemId={itemIdFromQuery} />;
};
