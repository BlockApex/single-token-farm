import React from "react";

const PoolContainer = ({ children }) => {
  return (
    <div className="w-full h-auto relative overflow-hidden">
      <div className="w-full h-auto rounded-lg bg-white-600">
        {children}
      </div>
    </div>
  );
};

export default PoolContainer;
