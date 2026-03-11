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
      className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  );
};
