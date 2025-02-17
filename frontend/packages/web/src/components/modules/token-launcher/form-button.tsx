import { Button as ChakraButton, ButtonProps } from "@chakra-ui/react";

export function FormButton({
  leftIcon,
  title,
  bg,
  color,
  ...props
}: ButtonProps) {
  const { isDisabled } = props;
  return (
    <ChakraButton
      width={{ base: "180px", md: "254px" }}
      height="60px"
      color={color}
      backgroundColor={bg}
      fontWeight="600"
      padding="10px 24px"
      borderRadius="16px"
      leftIcon={leftIcon}
      _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
      _hover={{ backgroundColor: `${isDisabled ? bg : bg}` }}
      {...props}
    >
      {title}
    </ChakraButton>
  );
}
