import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createPreorder } from '../../../api/preorders';
import styles from './preordersAdmin.module.css';

export const CreatePreOrderPage = () => {
  const [form, setForm] = useState({
    item_id: '',
    quantity: 1,
    unit_price: 0,
    deposit_amount: 0,
    paid_amount: 0,
    expected_arrival_at: '',
    expected_delivery_at: '',
    note: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createPreorder,
    onSuccess: () => {
      setSuccess('Da tao pre-order thanh cong.');
      setError(null);
    },
    onError: () => {
      setError('Tao pre-order that bai. Vui long kiem tra lai.');
      setSuccess(null);
    },
  });

  const canSubmit = form.item_id.trim().length > 0 && form.quantity > 0;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Tao Pre-Order Moi</h1>
        <p>Nhap thong tin campaign pre-order theo mau MVP mobile.</p>
      </div>

      <form
        className={`${styles.card} ${styles.row}`}
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canSubmit) {
            setError('Vui long nhap item_id va so luong hop le.');
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
            note: form.note || undefined,
          });
        }}
      >
        <label>
          Khu vuc upload anh san pham (MVP placeholder)
          <input className={styles.input} placeholder="URL anh cover (tuy chon)" />
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
            So luong
            <input
              className={styles.input}
              type="number"
              min={1}
              value={form.quantity}
              onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
            />
          </label>
        </div>

        <div className={styles.gridTwo}>
          <label>
            Gia du kien
            <input
              className={styles.input}
              type="number"
              min={0}
              value={form.unit_price}
              onChange={(event) => setForm((current) => ({ ...current, unit_price: Number(event.target.value) }))}
            />
          </label>
          <label>
            Dat coc
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
            Du kien ve hang
            <input
              className={styles.input}
              type="datetime-local"
              value={form.expected_arrival_at}
              onChange={(event) => setForm((current) => ({ ...current, expected_arrival_at: event.target.value }))}
            />
          </label>
          <label>
            Du kien giao hang
            <input
              className={styles.input}
              type="datetime-local"
              value={form.expected_delivery_at}
              onChange={(event) => setForm((current) => ({ ...current, expected_delivery_at: event.target.value }))}
            />
          </label>
        </div>

        <label>
          Ghi chu admin
          <textarea
            className={styles.textarea}
            data-testid="admin-preorder-note"
            value={form.note}
            onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
          />
        </label>

        <button
          className={styles.button}
          type="submit"
          data-testid="admin-preorder-submit"
          disabled={!canSubmit || createMutation.isPending}
        >
          {createMutation.isPending ? 'Dang tao...' : 'Luu campaign pre-order'}
        </button>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
      </form>
    </div>
  );
};

