import { Button } from "@/components";
import { Image, Text } from "@chakra-ui/react";

export function WalletModuleItem({
  name,
  iconUrl,
  onClick,
}: {
  name: string;
  iconUrl: string;
  onClick: () => void;
}) {
  return (
    <Button outline className="justify-start" onClick={onClick}>
      <Image src={iconUrl} width="32px" height="32px" />

      {name}
    </Button>
  );
}
