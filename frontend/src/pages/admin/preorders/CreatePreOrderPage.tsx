import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPreorder } from '../../../api/preorders';
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

type CreatePreOrderFormProps = {
  initialItemId: string;
};

const CreatePreOrderForm = ({ initialItemId }: CreatePreOrderFormProps) => {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => emptyForm(initialItemId));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createPreorder,
    onSuccess: () => {
      setSuccess('Đã tạo pre-order thành công.');
      setError(null);
      window.setTimeout(() => {
        navigate('/admin/preorders');
      }, 1200);
    },
    onError: () => {
      setError('Tạo pre-order thất bại. Vui lòng kiểm tra lại.');
      setSuccess(null);
    },
  });

  const numericValidationError = (() => {
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
    const totalAmount = form.unit_price * form.quantity;
    if (form.deposit_amount > totalAmount) {
      return 'Tiền đặt cọc không được vượt tổng giá trị đơn.';
    }
    if (form.paid_amount < form.deposit_amount) {
      return 'Tiền đã thanh toán không được nhỏ hơn tiền đặt cọc.';
    }
    return null;
  })();

  const canSubmit = form.item_id.trim().length > 0 && !numericValidationError;

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
            setError(numericValidationError ?? 'Vui lòng nhập item_id và thông tin số hợp lệ.');
            return;
          }
          await createMutation.mutateAsync({
            item_id: form.item_id.trim(),
            quantity: form.quantity,
            unit_price: form.unit_price,
            deposit_amount: form.deposit_amount,
            paid_amount: form.paid_amount,
            expected_arrival_at: form.expected_arrival_at || undefined,
            expected_delivery_at: form.expected_delivery_at || undefined,
            note:
              [form.note.trim(), form.cover_image_url.trim() && `Cover image URL: ${form.cover_image_url.trim()}`]
                .filter(Boolean)
                .join('\n') || undefined,
          });
        }}
      >
        <label>
          Khu vực upload ảnh sản phẩm (MVP placeholder)
          <input
            className={styles.input}
            placeholder="URL ảnh cover (tùy chọn)"
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
        {numericValidationError && <p className={styles.error}>{numericValidationError}</p>}

        <button
          className={styles.button}
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
  const formInstanceKey = itemIdFromQuery || '__no_item_query__';

  return <CreatePreOrderForm key={formInstanceKey} initialItemId={itemIdFromQuery} />;
};
