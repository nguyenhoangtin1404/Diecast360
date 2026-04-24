import { UserPlus } from 'lucide-react';
import type { Member } from '../../../types/member';

type MemberListPanelProps = {
  keywordInput: string;
  summaryText: string;
  members: Member[];
  selectedMemberId: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  onKeywordChange: (value: string) => void;
  onSelectMember: (memberId: string) => void;
  onOpenCreateModal: () => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (member: Member) => void;
  isDeletingMember?: boolean;
};

export function MemberListPanel(props: MemberListPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Danh sách hội viên</h2>
        <button
          type="button"
          onClick={props.onOpenCreateModal}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700"
          aria-label="Tạo hội viên mới"
          title="Tạo hội viên mới"
        >
          <UserPlus size={18} strokeWidth={2.25} />
        </button>
      </div>
      <div className="mb-3 grid gap-2">
        <input
          value={props.keywordInput}
          onChange={(event) => props.onKeywordChange(event.target.value)}
          placeholder="Tìm theo tên/email/sđt"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="text-sm text-slate-500">{props.summaryText}</p>
      </div>
      {props.isLoading && (
        <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">Đang tải hội viên...</p>
      )}
      {props.errorMessage && (
        <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {props.errorMessage}
        </p>
      )}
      <div className="space-y-2" data-testid="members-list">
        {props.members.map((member) => (
          <div
            key={member.id}
            className={`w-full rounded-lg border p-3 text-left transition ${
              props.selectedMemberId === member.id
                ? 'border-indigo-300 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <button type="button" onClick={() => props.onSelectMember(member.id)} className="w-full text-left">
              <div className="font-semibold text-slate-900">{member.full_name}</div>
              <div className="text-xs text-slate-500">{member.email || member.phone || 'Không có liên hệ'}</div>
              <div className="mt-1 text-sm text-slate-700">
                {member.points_balance.toLocaleString('vi-VN')} điểm · {member.tier?.name || 'Chưa xếp hạng'}
              </div>
            </button>
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => props.onEditMember(member)}
                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-white"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => props.onDeleteMember(member)}
                className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={props.isDeletingMember}
              >
                Xoá
              </button>
            </div>
          </div>
        ))}
        {!props.isLoading && props.members.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
            Chưa có hội viên.
          </div>
        )}
      </div>
    </div>
  );
}
