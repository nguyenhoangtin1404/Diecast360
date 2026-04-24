import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adjustMemberPoints,
  createMember,
  createMemberTier,
  deleteMember,
  deleteMemberTier,
  fetchMemberLedger,
  fetchMembers,
  fetchMemberTiers,
  updateMember,
} from '../../api/members';
import type { AdjustPointsResult, Member, MemberPointsMutationType } from '../../types/member';
import { LedgerPanel } from './members/LedgerPanel';
import { MemberCreateModal } from './members/MemberCreateModal';
import { MemberEditModal } from './members/MemberEditModal';
import { MemberListPanel } from './members/MemberListPanel';
import { PointsAdjustmentForm } from './members/PointsAdjustmentForm';
import { TierManagementPanel } from './members/TierManagementPanel';
import {
  validateAdjustPointsInput,
  validateCreateMemberInput,
} from './members/memberFormValidation';

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteMemberCandidate, setDeleteMemberCandidate] = useState<Member | null>(null);
  const [membersPage, setMembersPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', phone: '' });
  const [adjustForm, setAdjustForm] = useState({
    type: 'adjust' as MemberPointsMutationType,
    points: '1',
    reason: '',
    note: '',
  });
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [createMemberErrorInline, setCreateMemberErrorInline] = useState<string | null>(null);
  const [editMemberErrorInline, setEditMemberErrorInline] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', phone: '' });
  const [tierForm, setTierForm] = useState({ name: '', rank: '1', min_points: '0' });

  const membersQuery = useQuery({
    queryKey: ['members', keyword, membersPage],
    queryFn: async () => fetchMembers({ keyword, page: membersPage, pageSize: 20 }),
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
      setCreateMemberErrorInline(null);
      setIsCreateModalOpen(false);
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
    onSuccess: async (result: AdjustPointsResult | null) => {
      setAdjustForm((prev) => ({ ...prev, reason: '', note: '' }));
      setAdjustError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['members'] }),
        queryClient.invalidateQueries({ queryKey: ['member-ledger', selectedMemberId] }),
      ]);
      if (result?.tier_transition.upgraded) {
        // TODO: surface tier upgrade notification to user
      }
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
  const updateMemberMutation = useMutation({
    mutationFn: async () => {
      if (!editMember) return null;
      return updateMember(editMember.id, {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim() || null,
        phone: editForm.phone.trim() || null,
      });
    },
    onSuccess: async () => {
      setEditMember(null);
      setEditMemberErrorInline(null);
      await queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => deleteMember(memberId),
    onSuccess: async () => {
      const deletedId = deleteMemberCandidate?.id ?? null;
      setDeleteMemberCandidate(null);
      if (deletedId && selectedMemberId === deletedId) {
        setSelectedMemberId(null);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['members'] }),
        queryClient.invalidateQueries({ queryKey: ['member-ledger'] }),
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
  const memberPagination = useMemo(() => membersQuery.data?.pagination ?? null, [membersQuery.data?.pagination]);
  const tiers = useMemo(() => tiersQuery.data ?? [], [tiersQuery.data]);
  const ledgerEntries = useMemo(() => ledgerQuery.data?.entries ?? [], [ledgerQuery.data?.entries]);
  const ledgerPagination = useMemo(() => ledgerQuery.data?.pagination ?? null, [ledgerQuery.data?.pagination]);
  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) ?? null,
    [members, selectedMemberId],
  );
  const createMemberError = createMutation.isError
    ? getErrorMessage(createMutation.error, 'Không thể tạo hội viên. Vui lòng thử lại.')
    : createMemberErrorInline;
  const updateMemberError = updateMemberMutation.isError
    ? getErrorMessage(updateMemberMutation.error, 'Không thể cập nhật hội viên. Vui lòng thử lại.')
    : editMemberErrorInline;
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
    const validationError = validateCreateMemberInput(createForm);
    if (validationError) {
      setCreateMemberErrorInline(validationError);
      return;
    }
    setCreateMemberErrorInline(null);
    createMutation.mutate({
      full_name: createForm.full_name.trim(),
      email: createForm.email.trim() || undefined,
      phone: createForm.phone.trim() || undefined,
    });
  };

  const onAdjustSubmit = () => {
    if (!selectedMemberId) return;
    const parsed = Number(adjustForm.points);
    const validationError = validateAdjustPointsInput({
      type: adjustForm.type,
      points: parsed,
    });
    if (validationError) {
      setAdjustError(validationError);
      return;
    }
    setAdjustError(null);
    adjustMutation.mutate();
  };
  const onEditSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!editMember) return;
    const validationError = validateCreateMemberInput(editForm);
    if (validationError) {
      setEditMemberErrorInline(validationError);
      return;
    }
    setEditMemberErrorInline(null);
    updateMemberMutation.mutate();
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setKeyword(keywordInput.trim());
      setMembersPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [keywordInput]);

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 py-5 md:py-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">Hội viên và điểm thưởng</h1>
        <p className="mt-1 text-sm text-slate-600">Quản lý thành viên, hạng và lịch sử biến động điểm.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <MemberListPanel
          keywordInput={keywordInput}
          summaryText={
            membersQuery.isLoading ? 'Đang tải hội viên...' : `${members.length} hội viên trong shop hiện tại`
          }
          members={members}
          selectedMemberId={selectedMemberId}
          isLoading={membersQuery.isLoading}
          errorMessage={membersLoadError}
          pagination={memberPagination}
          onKeywordChange={setKeywordInput}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onEditMember={(member) => {
            setEditMember(member);
            setEditMemberErrorInline(null);
            setEditForm({
              full_name: member.full_name ?? '',
              email: member.email ?? '',
              phone: member.phone ?? '',
            });
          }}
          onDeleteMember={(member) => setDeleteMemberCandidate(member)}
          isDeletingMember={deleteMemberMutation.isPending}
          onPrevPage={() => setMembersPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() =>
            setMembersPage((prev) =>
              memberPagination ? Math.min(memberPagination.total_pages, prev + 1) : prev + 1,
            )
          }
          onSelectMember={(memberId) => {
            setSelectedMemberId(memberId);
            setLedgerPage(1);
          }}
        />

        <div className="space-y-4">
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

      <MemberCreateModal
        open={isCreateModalOpen}
        form={createForm}
        isSubmitting={createMutation.isPending}
        errorMessage={createMemberError}
        onClose={() => setIsCreateModalOpen(false)}
        onFormChange={setCreateForm}
        onSubmit={onCreateSubmit}
      />

      <MemberEditModal
        open={Boolean(editMember)}
        form={editForm}
        isSubmitting={updateMemberMutation.isPending}
        errorMessage={updateMemberError}
        onClose={() => setEditMember(null)}
        onFormChange={setEditForm}
        onSubmit={onEditSubmit}
      />

      {deleteMemberCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Xác nhận xoá hội viên</h3>
            <p className="mt-2 text-sm text-slate-600">
              Bạn có chắc muốn xoá hội viên{' '}
              <span className="font-semibold text-slate-900">"{deleteMemberCandidate.full_name}"</span>? Thao tác này
              sẽ xoá cả lịch sử điểm liên quan.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setDeleteMemberCandidate(null)}
                disabled={deleteMemberMutation.isPending}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                onClick={() => deleteMemberMutation.mutate(deleteMemberCandidate.id)}
                disabled={deleteMemberMutation.isPending}
              >
                {deleteMemberMutation.isPending ? 'Đang xoá...' : 'Xoá hội viên'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
