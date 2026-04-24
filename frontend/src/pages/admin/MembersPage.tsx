import { useEffect, useMemo, useState } from 'react';
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
import type { MemberPointsMutationType } from '../../types/member';
import { CreateMemberForm } from './members/CreateMemberForm';
import { LedgerPanel } from './members/LedgerPanel';
import { MemberListPanel } from './members/MemberListPanel';
import { PointsAdjustmentForm } from './members/PointsAdjustmentForm';
import { TierManagementPanel } from './members/TierManagementPanel';

function getErrorMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (error as { message?: string })?.message ||
    fallback
  );
}

export const MembersPage = () => {
  const queryClient = useQueryClient();
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', phone: '' });
  const [adjustForm, setAdjustForm] = useState({
    type: 'adjust' as MemberPointsMutationType,
    points: '1',
    reason: '',
    note: '',
  });
  const [adjustError, setAdjustError] = useState<string | null>(null);
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
    queryKey: ['member-ledger', selectedMemberId, ledgerPage],
    queryFn: async () => fetchMemberLedger(selectedMemberId!, { page: ledgerPage, pageSize: 10 }),
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
      setAdjustError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['members'] }),
        queryClient.invalidateQueries({ queryKey: ['member-ledger', selectedMemberId] }),
      ]);
    },
    onError: (error) => {
      const message =
        (error as { message?: string; response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (error as { message?: string })?.message ||
        'Không thể cập nhật điểm. Vui lòng thử lại.';
      setAdjustError(message);
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
  const tiers = useMemo(() => tiersQuery.data ?? [], [tiersQuery.data]);
  const ledgerEntries = useMemo(() => ledgerQuery.data?.entries ?? [], [ledgerQuery.data?.entries]);
  const ledgerPagination = useMemo(() => ledgerQuery.data?.pagination ?? null, [ledgerQuery.data?.pagination]);
  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) ?? null,
    [members, selectedMemberId],
  );
  const createMemberError = createMutation.isError
    ? getErrorMessage(createMutation.error, 'Không thể tạo hội viên. Vui lòng thử lại.')
    : null;
  const membersLoadError = membersQuery.isError
    ? getErrorMessage(membersQuery.error, 'Không thể tải danh sách hội viên.')
    : null;
  const tiersLoadError = tiersQuery.isError
    ? getErrorMessage(tiersQuery.error, 'Không thể tải danh sách hạng.')
    : null;
  const tierMutationError =
    (createTierMutation.isError && getErrorMessage(createTierMutation.error, 'Không thể tạo hạng mới.')) ||
    (deleteTierMutation.isError && getErrorMessage(deleteTierMutation.error, 'Không thể xoá hạng.')) ||
    null;
  const ledgerLoadError = ledgerQuery.isError
    ? getErrorMessage(ledgerQuery.error, 'Không thể tải lịch sử điểm.')
    : null;

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
    const parsed = Number(adjustForm.points);
    const isAdjust = adjustForm.type === 'adjust';
    const isValidPositive = Number.isInteger(parsed) && parsed > 0;
    const isValidSignedAdjust = Number.isInteger(parsed) && parsed !== 0 && parsed >= -1000000 && parsed <= 1000000;
    if ((!isAdjust && !isValidPositive) || (isAdjust && !isValidSignedAdjust)) {
      setAdjustError(
        isAdjust
          ? 'Điểm điều chỉnh phải là số nguyên khác 0 và trong khoảng -1,000,000 đến 1,000,000.'
          : 'Điểm cộng/trừ phải là số nguyên dương.',
      );
      return;
    }
    setAdjustError(null);
    adjustMutation.mutate();
  };

  useEffect(() => {
    const timeout = setTimeout(() => setKeyword(keywordInput.trim()), 350);
    return () => clearTimeout(timeout);
  }, [keywordInput]);

  useEffect(() => {
    setLedgerPage(1);
  }, [selectedMemberId]);

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 py-5 md:py-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">Hội viên và điểm thưởng</h1>
        <p className="mt-1 text-sm text-slate-600">Quản lý thành viên, hạng và lịch sử biến động điểm.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
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

      <TierManagementPanel
        form={tierForm}
        tiers={tiers}
        isLoading={tiersQuery.isLoading}
        loadError={tiersLoadError}
        mutationError={tierMutationError}
        isSubmitting={createTierMutation.isPending}
        isDeleting={deleteTierMutation.isPending}
        onFormChange={setTierForm}
        onSubmit={(event) => {
          event.preventDefault();
          createTierMutation.mutate();
        }}
        onDelete={(tierId) => deleteTierMutation.mutate(tierId)}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <MemberListPanel
          members={members}
          selectedMemberId={selectedMemberId}
          isLoading={membersQuery.isLoading}
          errorMessage={membersLoadError}
          onSelectMember={(memberId) => {
            setSelectedMemberId(memberId);
            setLedgerPage(1);
          }}
        />

        <div className="space-y-4">
          <CreateMemberForm
            form={createForm}
            isSubmitting={createMutation.isPending}
            errorMessage={createMemberError}
            onFormChange={setCreateForm}
            onSubmit={onCreateSubmit}
          />
          <PointsAdjustmentForm
            selectedMember={selectedMember}
            form={adjustForm}
            isSubmitting={adjustMutation.isPending}
            errorMessage={adjustError}
            onFormChange={setAdjustForm}
            onSubmit={onAdjustSubmit}
          />
          <LedgerPanel
            entries={ledgerEntries}
            selectedMemberId={selectedMemberId}
            isLoading={ledgerQuery.isLoading}
            errorMessage={ledgerLoadError}
            pagination={ledgerPagination}
            onPrevPage={() => setLedgerPage((prev) => Math.max(1, prev - 1))}
            onNextPage={() =>
              setLedgerPage((prev) =>
                ledgerPagination ? Math.min(ledgerPagination.total_pages, prev + 1) : prev + 1,
              )
            }
          />
        </div>
      </section>
    </div>
  );
};
