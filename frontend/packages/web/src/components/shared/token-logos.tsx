import React from "react";
import { Token } from "@/assets/svg/token";

export const TokenLogos = ({size=50}) => {
  return (
    <div className="flex items-center justify-start" >
      <Token width={size} height={size} />
      <Token width={size} height={size} className="-ml-2"  />
    </div>
  );
};

