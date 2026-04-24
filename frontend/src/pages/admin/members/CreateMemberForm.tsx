import type { FormEvent } from 'react';

type CreateMemberFormState = {
  full_name: string;
  email: string;
  phone: string;
};

type CreateMemberFormProps = {
  form: CreateMemberFormState;
  isSubmitting: boolean;
  errorMessage: string | null;
  onFormChange: (next: CreateMemberFormState) => void;
  onSubmit: (event: FormEvent) => void;
};

export function CreateMemberForm(props: CreateMemberFormProps) {
  return (
    <form onSubmit={props.onSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Tạo hội viên mới</h2>
      <div className="grid gap-2">
        <input
          required
          value={props.form.full_name}
          onChange={(event) => props.onFormChange({ ...props.form, full_name: event.target.value })}
          placeholder="Họ tên"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={props.form.email}
          onChange={(event) => props.onFormChange({ ...props.form, email: event.target.value })}
          placeholder="Email (tuỳ chọn)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={props.form.phone}
          onChange={(event) => props.onFormChange({ ...props.form, phone: event.target.value })}
          placeholder="Số điện thoại (tuỳ chọn)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
          disabled={props.isSubmitting}
        >
          {props.isSubmitting ? 'Đang tạo...' : 'Tạo hội viên'}
        </button>
        {props.errorMessage && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {props.errorMessage}
          </p>
        )}
      </div>
    </form>
  );
}
