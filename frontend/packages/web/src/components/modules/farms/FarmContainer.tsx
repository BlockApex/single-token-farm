import React from "react";

const FarmContainer = ({ children }) => {
  return (
    <div className="w-full h-auto relative overflow-hidden mt-4">
      <div className="w-full h-auto rounded-lg bg-white-600">
        {children}
      </div>
    </div>
  );
};

export default FarmContainer;
