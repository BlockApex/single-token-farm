import React, { ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  white?: boolean;
  inline?: boolean;
  outline?: boolean;
  full?: boolean;
  onClick?: (event) => void;
  disabled?: boolean;
  big?: boolean;
  type?: string;
};

export function Button(props: ButtonProps) {
  let style =
    "disabled:opacity-50 rounded-sm flex h-min gap-x-2 text-3.5 leading-4 items-center justify-center font-semibold";
  if (props.white) style += " text-purple bg-white";
  else if (props.inline) style += " text-white";
  else if (props.outline) style += " text-white border-white-300 border-[1px]";
  else style += " bg-purple-100 text-white hover:bg-[#BD76D8]";

  style += props.full ? " w-full flex justify-center" : "";
  style += props.big
    ? " min-w-[170px] px-6 py-3 tracking-tight"
    : " px-3 py-2.5 tracking-tighter";

  return (
    <button
      type={props.type ? props.type : "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={twMerge(style, props.className)}
    >
      {props.children}
    </button>
  );
}
