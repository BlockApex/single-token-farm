import React from "react";

interface TdProps {
  children: React.ReactNode;
  className?: string; // Accept Tailwind classes as a string
}

export const Td: React.FC<TdProps> = ({ children, className = "" }) => {
  return <div className={"flex items-center " + className}>{children}</div>;
};

