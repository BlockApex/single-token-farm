import { CheckIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

type CheckBoxProps = {
  checked: boolean;
  small?: boolean;
};

function CheckBox({ checked, small }: CheckBoxProps) {
  const [isChecked, setChecked] = useState<boolean>(checked);

  useEffect(() => setChecked(checked), [checked]);

  function renderBorder() {
    const size = small ? 20 : 40;
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="1"
          y="1"
          width={size - 2}
          height={size - 2}
          rx={size / 4}
          stroke="url(#paint)"
          strokeWidth={small ? "2" : "3"}
        />
        <defs>
          <linearGradient
            id="paint"
            x1="0"
            y1={size / 2}
            x2={size}
            y2={size / 2}
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#AE00FF" />
            <stop offset="1" stopColor="#FF1100" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  function renderCheck() {
    return (
      <div
        className={`bg-gradient-to-r from-[#AE00FF] to-[#FF1100] ${
          small ? "h-5 w-5 rounded-[5px]" : "h-10 w-10 rounded-sm"
        } flex items-center justify-center`}
      >
        <CheckIcon className={`${small ? "h-4" : "h-8"} stroke-1 text-white`} />
      </div>
    );
  }

  return (
    <div
      className={`absolute ${
        small
          ? "top-2 right-2 h-5 w-5 rounded-[5px]"
          : "top-4 right-4 h-10 w-10 rounded-sm"
      } bg-white/60`}
    >
      {isChecked ? renderCheck() : renderBorder()}
    </div>
  );
}

export default CheckBox;
