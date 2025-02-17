import { useEffect, useState } from "react";
import { Box } from "@chakra-ui/react";
import { PiArrowsMergeBold } from "react-icons/pi";
import { renderToString } from "react-dom/server";

const GradientArrowsMergeIcon = () => {
  const [svgUrl, setSvgUrl] = useState("");

  useEffect(() => {
    // Generate SVG markup
    const svgMarkup = renderToString(<PiArrowsMergeBold />);
    const encodedSvgMarkup = encodeURIComponent(svgMarkup)
      .replace(/'/g, "%27")
      .replace(/"/g, "%22");
    setSvgUrl(`url("data:image/svg+xml;utf8,${encodedSvgMarkup}")`);
  }, []);

  return (
    <Box
      width="24px"
      height="24px"
      style={{
        background:"white",
        WebkitMask: `${svgUrl} no-repeat center / contain`,
        mask: `${svgUrl} no-repeat center / contain`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        transform: "rotate(-90deg)",
      }}
    />
  );
};

export default GradientArrowsMergeIcon;
