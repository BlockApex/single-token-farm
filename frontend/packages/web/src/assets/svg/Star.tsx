import React from "react";



type ExtendedSVGProps = React.SVGProps<SVGSVGElement> & {
  filled: boolean; // Add the custom 'fill' property as a boolean
};


export const Star = (props: ExtendedSVGProps) => {
  const { filled, ...rest } = props;

  return (
    <svg
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M8.5 1.61804L9.93284 6.02786L10.0451 6.37336H10.4084L15.0451 6.37336L11.2939 9.09878L11 9.31231L11.1123 9.6578L12.5451 14.0676L8.79389 11.3422L8.5 11.1287L8.20611 11.3422L4.45488 14.0676L5.88772 9.6578L5.99998 9.31231L5.70609 9.09878L1.95486 6.37336L6.59163 6.37336H6.9549L7.06716 6.02786L8.5 1.61804Z"
        stroke="white"
        stroke-opacity="0.4"
        fill={filled ? "white" : ""}
        fill-opacity={filled ? "0.36" : ""}
      />
    </svg>
  );
};
