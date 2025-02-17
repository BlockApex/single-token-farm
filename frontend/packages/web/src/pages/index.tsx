import { useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom
import { SwapCard } from "@/components/modules/Swap/SwapCard";
import PageContainer from "@/components/PageContainer";
import { useChainSelector } from "@/context/chain-selector";

export default function SwapPage() {
  const { chain } = useChainSelector();
  const navigate = useNavigate(); // Initialize navigate function

  // Automatically navigate to /swap when the component loads
  useEffect(() => {
    navigate("/swap");
  }, [navigate]);

  // Render the page content based on the selected chain
  if (chain === "near") {
    return (
      <PageContainer>
        <SwapCard />
      </PageContainer>
    );
  }

  return <PageContainer>Select Near Chain</PageContainer>;
}