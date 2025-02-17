import React from "react";

const LiquidityTableHead = ({ children }) => {
  return (
    <div className="bg-white-600 rounded-md py-1 px-3 grid lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr_1fr] grid-cols-[1.5fr_1fr] gap-4">
      {children}
    </div>
  );
};

export default LiquidityTableHead;
