interface CatalogSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const CatalogSearchInput = ({ value, onChange }: CatalogSearchInputProps) => {
  return (
    <input
      type="text"
      placeholder="Tìm kiếm theo tên..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-trust py-3 px-4 md:max-w-md"
    />
  );
};
