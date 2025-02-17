import {
  Flex,
  Stack,
  Text,
  Modal,
  Button,
  ModalContent,
  useColorModeValue,
} from "@chakra-ui/react";
import { CloseIcon } from "@/assets/svg";
import { useTheme } from "@/hooks/theme";
import { useNavigate } from "react-router";
import { BackButton } from "./back-button";
import { navRoutes } from "../../routes";

const enabledRoutes = ["/staking", "/", "nft-staking", "vesting"];

export const MobileNav = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const { darkPurple } = useTheme();

  return (
    <Modal
      isOpen={isOpen}
      size="full"
      onClose={() => onClose()}
      motionPreset="slideInRight"
    >
      <ModalContent
        margin="0"
        height="100%"
        overflow="auto"
        width="60%"
        right="0"
        marginLeft="auto"
        position="relative"
      >
        <Flex
          zIndex="1"
          bg={useColorModeValue("white", darkPurple)}
          flexDirection="column"
          gap="25px"
          padding="12px 24px"
          minHeight="100%"
        >
          <Flex>
            <BackButton onClick={() => onClose()} />
          </Flex>

          <Stack display="flex" flex={1} gap="10px">
            {navRoutes.map((e) => (
              <Flex
                maxWidth="170px"
                minH="42px"
                cursor={e.enabled ? "pointer" : "not-allowed"}
                transition="0.3s"
                onClick={() => {
                  e.enabled ? navigate(e.route) : null;
                  onClose();
                }}
                userSelect="none"
                justifyContent="center"
                key={e.route}
                direction="column"
              >
                <Text
                  overflowWrap="break-word"
                  userSelect="none"
                  textAlign="center"
                  display="flex"
                  alignItems="center"
                  flexDirection="row"
                  fontSize="12px"
                  color={useColorModeValue("black", "white")}
                  pt={2}
                  gap={4}
                  opacity={
                    window.location.pathname.includes(e.subroutePrefix)
                      ? 1
                      : 0.3
                  }
                >
                  {e.icon}
                  {e.title}
                </Text>
              </Flex>
            ))}
          </Stack>
        </Flex>
      </ModalContent>
    </Modal>
  );
};
