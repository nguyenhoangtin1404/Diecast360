import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useShop } from '../../../hooks/useShop';
import { isShopStaffReadOnly } from '../../../utils/shopStaffReadOnly';
import { createPreorder } from '../../../api/preorders';
import { PreorderReceiptActions } from '../../../components/preorders/PreorderReceiptActions';
import { fetchMembers } from '../../../api/members';
import { isOptionalHttpOrHttpsUrl } from '../../../utils/safeHttpUrl';
import styles from './preordersAdmin.module.css';

type FormState = {
  member_id: string;
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
  member_id: '',
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
  const [createdPreorderId, setCreatedPreorderId] = useState<string | null>(null);

  const [memberSearch, setMemberSearch] = useState('');

  const membersQuery = useQuery({
    queryKey: ['admin-preorder-members-picker', memberSearch.trim()],
    queryFn: async () =>
      fetchMembers({
        page: 1,
        pageSize: 100,
        keyword: memberSearch.trim() || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: createPreorder,
    onSuccess: (preorder) => {
      setCreatedPreorderId(preorder.id);
      setSuccess('Đã tạo pre-order thành công. Bạn có thể in phiếu hoặc tạo ảnh chia sẻ bên dưới.');
      setError(null);
    },
    onError: () => {
      setError('Tạo pre-order thất bại. Vui lòng kiểm tra lại.');
      setSuccess(null);
    },
  });

  const validationError = (() => {
    if (!form.member_id.trim()) {
      return 'Vui lòng chọn hội viên.';
    }
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
            member_id: form.member_id.trim(),
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
            Hội viên (bắt buộc)
            <input
              className={styles.input}
              type="search"
              placeholder="Tìm theo tên, SĐT, email…"
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              data-testid="admin-preorder-member-search"
            />
            <select
              className={styles.input}
              data-testid="admin-preorder-member-id"
              value={form.member_id}
              onChange={(event) => setForm((current) => ({ ...current, member_id: event.target.value }))}
            >
              <option value="">— Chọn hội viên —</option>
              {(membersQuery.data?.members ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                  {m.phone ? ` · ${m.phone}` : ''}
                  {m.email ? ` · ${m.email}` : ''}
                </option>
              ))}
            </select>
          </label>
          {membersQuery.isError && (
            <p className={styles.error}>Không tải được danh sách hội viên. Thử tải lại trang.</p>
          )}
          {membersQuery.data?.pagination && membersQuery.data.pagination.total > 100 && (
            <p role="note">
              Có {membersQuery.data.pagination.total} hội viên — hiển thị tối đa 100. Dùng ô tìm kiếm để
              thu hẹp.
            </p>
          )}
        </div>

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
        {createdPreorderId && (
          <div className={styles.card}>
            <PreorderReceiptActions
              preorderId={createdPreorderId}
              buttonClassName={styles.button}
            />
            <button
              type="button"
              className={styles.button}
              style={{ marginTop: '12px' }}
              onClick={() => navigate('/admin/preorders')}
            >
              Về danh sách pre-order
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export const CreatePreOrderPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeShop } = useShop();
  const readOnly = isShopStaffReadOnly(activeShop?.role);
  const itemIdFromQuery = searchParams.get('item_id')?.trim() ?? '';

  useEffect(() => {
    if (readOnly) {
      navigate('/admin/preorders', { replace: true });
    }
  }, [readOnly, navigate]);

  if (readOnly) {
    return null;
  }

  return <CreatePreOrderForm key={itemIdFromQuery} initialItemId={itemIdFromQuery} />;
};
