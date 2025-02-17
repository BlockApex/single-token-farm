import React from "react";

export const RoundCross = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="16"
      viewBox="0 0 15 16"
      fill="none"
      {...props}
    >
      <path
        d="M7.5 0C3.35625 0 0 3.58 0 8C0 12.42 3.35625 16 7.5 16C11.6438 16 15 12.42 15 8C15 3.58 11.6438 0 7.5 0ZM4.6875 3.56L7.5 6.56L10.3125 3.56L11.6625 5L8.85 8L11.6625 11L10.3125 12.44L7.5 9.44L4.6875 12.44L3.3375 11L6.15 8L3.3375 5L4.6875 3.56Z"
        fill="white"
        fillOpacity="0.5"
      />
    </svg>
  );
};
