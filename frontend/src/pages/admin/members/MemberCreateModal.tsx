import type { FormEvent } from 'react';
import { CreateMemberForm } from './CreateMemberForm';

type MemberCreateModalProps = {
  open: boolean;
  form: {
    full_name: string;
    email: string;
    phone: string;
  };
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onFormChange: (next: { full_name: string; email: string; phone: string }) => void;
  onSubmit: (event: FormEvent) => void;
};

export function MemberCreateModal(props: MemberCreateModalProps) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="relative w-full max-w-xl">
        <div className="absolute -top-3 -right-3 z-10">
          <button
            type="button"
            onClick={props.onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow"
            aria-label="Đóng modal tạo hội viên"
          >
            ×
          </button>
        </div>
        <CreateMemberForm
          form={props.form}
          isSubmitting={props.isSubmitting}
          errorMessage={props.errorMessage}
          onFormChange={props.onFormChange}
          onSubmit={props.onSubmit}
        />
      </div>
    </div>
  );
}
