import type { Member } from '../../../types/member';

type MemberListPanelProps = {
  members: Member[];
  selectedMemberId: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  onSelectMember: (memberId: string) => void;
};

export function MemberListPanel(props: MemberListPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Danh sách hội viên</h2>
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
          <button
            key={member.id}
            type="button"
            onClick={() => props.onSelectMember(member.id)}
            className={`w-full rounded-lg border p-3 text-left transition ${
              props.selectedMemberId === member.id
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
        {!props.isLoading && props.members.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
            Chưa có hội viên.
          </div>
        )}
      </div>
    </div>
  );
}
