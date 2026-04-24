import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adjustMemberPoints,
  createMember,
  createMemberTier,
  deleteMemberTier,
  fetchMemberLedger,
  fetchMembers,
  fetchMemberTiers,
} from '../../api/members';

export const MembersPage = () => {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', phone: '' });
  const [adjustForm, setAdjustForm] = useState({
    type: 'adjust' as 'earn' | 'redeem' | 'adjust',
    points: '1',
    reason: '',
    note: '',
  });
  const [tierForm, setTierForm] = useState({ name: '', rank: '1', min_points: '0' });

  const membersQuery = useQuery({
    queryKey: ['members', keyword],
    queryFn: async () => fetchMembers(keyword),
  });
  const tiersQuery = useQuery({
    queryKey: ['member-tiers'],
    queryFn: fetchMemberTiers,
  });
  const ledgerQuery = useQuery({
    queryKey: ['member-ledger', selectedMemberId],
    queryFn: async () => fetchMemberLedger(selectedMemberId!),
    enabled: Boolean(selectedMemberId),
  });

  const createMutation = useMutation({
    mutationFn: createMember,
    onSuccess: async () => {
      setCreateForm({ full_name: '', email: '', phone: '' });
      await queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMemberId) return null;
      return adjustMemberPoints(selectedMemberId, {
        type: adjustForm.type,
        points: Number(adjustForm.points),
        reason: adjustForm.reason,
        note: adjustForm.note || undefined,
      });
    },
    onSuccess: async () => {
      setAdjustForm((prev) => ({ ...prev, reason: '', note: '' }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['members'] }),
        queryClient.invalidateQueries({ queryKey: ['member-ledger', selectedMemberId] }),
      ]);
    },
  });
  const createTierMutation = useMutation({
    mutationFn: async () =>
      createMemberTier({
        name: tierForm.name.trim(),
        rank: Number(tierForm.rank),
        min_points: Number(tierForm.min_points),
      }),
    onSuccess: async () => {
      setTierForm({ name: '', rank: '1', min_points: '0' });
      await queryClient.invalidateQueries({ queryKey: ['member-tiers'] });
    },
  });
  const deleteTierMutation = useMutation({
    mutationFn: async (tierId: string) => deleteMemberTier(tierId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['member-tiers'] });
    },
  });

  const members = useMemo(() => membersQuery.data?.members ?? [], [membersQuery.data?.members]);
  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) ?? null,
    [members, selectedMemberId],
  );

  const onCreateSubmit = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate({
      full_name: createForm.full_name.trim(),
      email: createForm.email.trim() || undefined,
      phone: createForm.phone.trim() || undefined,
    });
  };

  const onAdjustSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedMemberId) return;
    adjustMutation.mutate();
  };

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 py-5 md:py-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">Hội viên và điểm thưởng</h1>
        <p className="mt-1 text-sm text-slate-600">Quản lý thành viên, hạng và lịch sử biến động điểm.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên/email/sđt"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="md:col-span-2 text-sm text-slate-500">
            {membersQuery.isLoading
              ? 'Đang tải hội viên...'
              : `${members.length} hội viên trong shop hiện tại`}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Quản lý hạng hội viên</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createTierMutation.mutate();
          }}
          className="grid gap-2 md:grid-cols-4"
        >
          <input
            required
            value={tierForm.name}
            onChange={(event) => setTierForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Tên hạng (ví dụ: Silver)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={1}
            value={tierForm.rank}
            onChange={(event) => setTierForm((prev) => ({ ...prev, rank: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={0}
            value={tierForm.min_points}
            onChange={(event) => setTierForm((prev) => ({ ...prev, min_points: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            disabled={createTierMutation.isPending}
          >
            {createTierMutation.isPending ? 'Đang thêm...' : 'Thêm hạng'}
          </button>
        </form>
        <div className="mt-3 space-y-2" data-testid="member-tier-list">
          {(tiersQuery.data ?? []).map((tier) => (
            <div key={tier.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
              <div>
                <div className="font-semibold text-slate-900">{tier.name}</div>
                <div className="text-xs text-slate-500">
                  Rank {tier.rank} · Từ {tier.min_points.toLocaleString('vi-VN')} điểm
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                onClick={() => deleteTierMutation.mutate(tier.id)}
                disabled={deleteTierMutation.isPending}
              >
                Xoá
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Danh sách hội viên</h2>
          <div className="space-y-2" data-testid="members-list">
            {members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMemberId(member.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selectedMemberId === member.id
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-slate-900">{member.full_name}</div>
                <div className="text-xs text-slate-500">{member.email || member.phone || 'Không có liên hệ'}</div>
                <div className="mt-1 text-sm text-slate-700">
                  {member.points_balance.toLocaleString('vi-VN')} điểm · {member.tier?.name || 'Chưa xếp hạng'}
                </div>
              </button>
            ))}
            {!membersQuery.isLoading && members.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                Chưa có hội viên.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <form onSubmit={onCreateSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Tạo hội viên mới</h2>
            <div className="grid gap-2">
              <input
                required
                value={createForm.full_name}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, full_name: event.target.value }))}
                placeholder="Họ tên"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={createForm.email}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Email (tuỳ chọn)"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={createForm.phone}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Số điện thoại (tuỳ chọn)"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo hội viên'}
              </button>
            </div>
          </form>

          <form onSubmit={onAdjustSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Điều chỉnh điểm</h2>
            {!selectedMember && <p className="text-sm text-slate-500">Chọn hội viên để điều chỉnh điểm.</p>}
            {selectedMember && (
              <div className="grid gap-2">
                <div className="text-sm text-slate-700">
                  <strong>{selectedMember.full_name}</strong> — {selectedMember.points_balance.toLocaleString('vi-VN')} điểm
                </div>
                <select
                  value={adjustForm.type}
                  onChange={(event) =>
                    setAdjustForm((prev) => ({ ...prev, type: event.target.value as 'earn' | 'redeem' | 'adjust' }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="earn">Cộng điểm</option>
                  <option value="redeem">Trừ điểm</option>
                  <option value="adjust">Điều chỉnh</option>
                </select>
                <input
                  type="number"
                  min={adjustForm.type === 'adjust' ? -999999 : 1}
                  value={adjustForm.points}
                  onChange={(event) => setAdjustForm((prev) => ({ ...prev, points: event.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  required
                  value={adjustForm.reason}
                  onChange={(event) => setAdjustForm((prev) => ({ ...prev, reason: event.target.value }))}
                  placeholder="Lý do"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={adjustForm.note}
                  onChange={(event) => setAdjustForm((prev) => ({ ...prev, note: event.target.value }))}
                  placeholder="Ghi chú"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                  disabled={adjustMutation.isPending}
                >
                  {adjustMutation.isPending ? 'Đang cập nhật...' : 'Lưu biến động điểm'}
                </button>
              </div>
            )}
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Lịch sử điểm</h2>
            {ledgerQuery.isLoading && selectedMember && <p className="text-sm text-slate-500">Đang tải ledger...</p>}
            {!selectedMember && <p className="text-sm text-slate-500">Chọn hội viên để xem lịch sử.</p>}
            {selectedMember && (ledgerQuery.data?.entries ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Chưa có biến động điểm.</p>
            )}
            <ul className="space-y-2" data-testid="members-ledger-list">
              {(ledgerQuery.data?.entries ?? []).map((entry) => (
                <li key={entry.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="font-semibold text-slate-800">
                    {entry.type.toUpperCase()} · {entry.delta > 0 ? '+' : ''}
                    {entry.delta} điểm
                  </div>
                  <div className="text-xs text-slate-500">{new Date(entry.created_at).toLocaleString('vi-VN')}</div>
                  <div className="mt-1 text-slate-700">{entry.reason}</div>
                  <div className="text-xs text-slate-500">
                    Số dư sau giao dịch: {entry.balance_after.toLocaleString('vi-VN')} điểm
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
