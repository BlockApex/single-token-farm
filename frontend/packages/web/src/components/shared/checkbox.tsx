

type CheckboxProps = {
    label: string;
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  };

  


export const Checkbox = ({ label, checked, onChange }:CheckboxProps) => {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={`form-checkbox h-4 w-4 text-purple-600 rounded-md bg-[#fcfcfc1f]  border-transparent focus:ring-0`}
      />
      <span className="text-white font-semibold text-sm">{label}</span>
    </label>
  );
};
