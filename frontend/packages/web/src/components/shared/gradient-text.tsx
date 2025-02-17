import { Text, TextProps } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export function GradientText(props: PropsWithChildren<TextProps & { as?: "p" | "span" | "div" | undefined }>) {
  return <Text {...props} />;
}
