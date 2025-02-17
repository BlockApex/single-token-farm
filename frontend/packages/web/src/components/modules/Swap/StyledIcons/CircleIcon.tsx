import React, { useEffect, useState } from "react";
import { Box } from "@chakra-ui/react";
import { FaCircle } from "react-icons/fa";
import { renderToString } from "react-dom/server"; // Only if server-side rendering is possible

const GradientFaCircle = () => {
  const [svgUrl, setSvgUrl] = useState("");

  useEffect(() => {
    // Generate SVG markup
    const svgMarkup = encodeURIComponent(renderToString(<FaCircle />));
    setSvgUrl(`url("data:image/svg+xml;utf8,${svgMarkup}")`);
  }, []);

  return (
    <Box
      width="8px"
      height="8px"
      style={{
        background:
          "radial-gradient(circle, rgba(174,108,198,1) 50%, rgba(112,112,238,1) 100%)",
        WebkitMask: `${svgUrl} no-repeat center / contain`,
        mask: `${svgUrl} no-repeat center / contain`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
};

export default GradientFaCircle;
