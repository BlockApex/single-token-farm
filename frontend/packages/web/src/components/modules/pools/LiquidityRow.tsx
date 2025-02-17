import React from "react";

const LiquidityRow = ({ children , onClick}) => {
  return (
    <div role="button" onClick={onClick} className="bg-white-600 rounded-md px-2 py-4 mt-3 grid lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr_1fr] grid-cols-[1.5fr_1fr] gap-4">
      {children}
    </div>
  );
};

export default LiquidityRow;
