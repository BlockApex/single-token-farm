import { Button } from "@/components";
import { SwapTopCard } from "@/components/modules/Swap/SwapTopCard";
import PageContainer from "@/components/PageContainer";
import React from "react";

export default function swap() {
  return (
    <PageContainer>
      <SwapTopCard />
      <Button
        big
        onClick={() => {
          window.open("https://swap.jumpdefi.xyz", "_blank");
        }}
        className="mx-auto"
      >
        Open App
      </Button>
      <div className="flex flex-col justify-start h-[500px]"></div>
    </PageContainer>
  );
}
