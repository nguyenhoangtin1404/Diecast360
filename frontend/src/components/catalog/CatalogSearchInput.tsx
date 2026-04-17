interface CatalogSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const CatalogSearchInput = ({ value, onChange }: CatalogSearchInputProps) => {
  return (
    <input
      type="text"
      placeholder="Tìm kiếm theo tên…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 md:max-w-md"
    />
  );
};
