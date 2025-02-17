import React from "react";
import { Tooltip } from "@chakra-ui/react";

interface InfoTooltipProps {
  label: React.ReactNode;
  children: React.ReactNode;
}
export const InfoTooltip = ({ label, children }: InfoTooltipProps) => {
  return (
    <Tooltip
      hasArrow
      placement="right"
      label={label}
      color="rgba(255, 255, 255, 0.60)"
      fontSize="sm"
      borderRadius="lg"
      bg="#5B394D"
      border="1px solid #CD7FF0"
      arrowShadowColor="#CD7FF0"
    >
      {children}
    </Tooltip>
  );
};
