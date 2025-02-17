type RadioProps = {
    label: string;
    value: string;
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
};

export const Radio = ({ label, value, checked, onChange, name }: RadioProps) => {
    return (
        <label className="flex items-center space-x-4 cursor-pointer">
            <input
                type="radio"
                value={value}
                checked={checked}
                onChange={onChange}
                name={name}
                className={`form-radio h-4 w-4 text-purple-600 rounded-full bg-[#fcfcfc1f] border-transparent focus:ring-0`}
            />
            <span className="text-white font-semibold text-sm">{label}</span>
        </label>
    );
};
