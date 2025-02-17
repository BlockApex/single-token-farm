import { useTheme } from "../../hooks/theme";
import {
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/solid";
import { Flex, useColorModeValue } from "@chakra-ui/react";

export function ReportButton() {
  const { jumpGradient, glassyWhiteOpaque } = useTheme();

  const cardBg = useColorModeValue(jumpGradient, jumpGradient);
  const cardOpacity = useColorModeValue(glassyWhiteOpaque, glassyWhiteOpaque);

  return (
    <Flex className="fixed bottom-[24px] right-[24px] z-40 cursor-pointer hover:opacity-[0.95] space-x-[12px]">
      <Flex
        bg={cardBg}
        onClick={() => {
          window.open("https://forms.gle/HKeEJdYBDs22zeyj7", "_blank");
        }}
        borderRadius="24px"
      >
        <Flex
          borderRadius="24px"
          bg={cardOpacity}
          className="
          w-[180px] 
          flex items-center
          space-x-[12px]
          px-[16px]
          py-[9px]
          text-white
        "
        >
          <ClipboardDocumentListIcon className="w-8" />

          <span className="text-[18px]">Feedback</span>
        </Flex>
      </Flex>

      <Flex
        bg={cardBg}
        onClick={() => {
          window.open("https://forms.gle/UVsMPce2GeWYELtx7", "_blank");
        }}
        borderRadius="24px"
      >
        <Flex
          borderRadius="24px"
          bg={cardOpacity}
          className="
          w-[180px] 
          flex items-center
          space-x-[12px]
          px-[16px]
          py-[9px]
          text-white
        "
        >
          <ExclamationTriangleIcon className="w-8" />

          <span className="text-[18px]">Report Bug</span>
        </Flex>
      </Flex>
    </Flex>
  );
}
