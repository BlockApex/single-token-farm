import { SwapCard } from "@/components/modules/Swap/SwapCard";
import PageContainer from "@/components/PageContainer";
import { useChainSelector } from "@/context/chain-selector";
import RegisterAccountModal from "../../components/RegisterAccountModal";

// Old Implementation Component
{
  /* <SwapTopCard />
      <Button
        onClick={() => {
          window.open("https://swap.jumpdefi.xyz", "_blank");
        }}
        className="mx-auto"
      >
        Trade now 
      </Button>
      <div className="flex flex-col justify-start h-[500px]"></div> */
}

export default function swap() {
  const { chain } = useChainSelector();
  if (chain === "near")
    return (
      <PageContainer>
        <SwapCard />
      </PageContainer>
    );

  return <PageContainer>Select Near Chain</PageContainer>;
}
