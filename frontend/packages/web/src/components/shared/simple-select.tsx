import React, { useState } from "react";
import { RxTriangleDown } from "react-icons/rx";


interface Option {
  value: string;
  label: string;
}

interface SimpleSelectProps {
  text: string;
  options: Option[];
  selectedValue: string;
  onChange: (value: string) => void;
  placeholder?: string
}

export const SimpleSelect: React.FC<SimpleSelectProps> = ({
  text = "",
  options,
  selectedValue,
  onChange,
  placeholder = "Select"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = (value: string) => {
    console.log(value)
    onChange(value);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left z-40 ">
      <div className="flex items-center">
        {text ? <label className="text-white font-semibold  text-sm mr-2">{text}</label> : ""}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#00000033] rounded-sm min-w-full  md:min-w-[185px] min-h-[36px] flex items-center justify-between p-2"
        >
          {options.find((opt) => opt.value === selectedValue)?.label ||
            placeholder}
          <RxTriangleDown />
        </button>
      </div>
      {isOpen && (
        <div className="absolute mt-1 w-full rounded-md shadow-lg bg-[#260020] z-10">
          <ul className="py-1">
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className="cursor-pointer block px-4 py-2 text-sm text-white hover:bg-white-600"
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
