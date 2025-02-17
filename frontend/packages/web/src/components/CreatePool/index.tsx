import { useState } from "react";
import TokenSelector from "@/components/TokenSelector";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Text,
} from "@chakra-ui/react";
import { RoundCross } from "@/assets/svg";
import { FeeTier , InfoTooltip} from "@/components/shared";
import { getDefaultTokens } from "@/utils/defaultTokens";
import { useCreatePool } from "@/hooks/modules/pools";
import { TokenMetadataType } from "@/utils/types";
import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";

const gradientStyle = {
  background:
    "radial-gradient(circle, rgba(174,108,198,1) 65%, rgba(112,112,238,1) 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  color: "transparent",
  display: "inline",
};

const CreatePool = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const defaultTokens = getDefaultTokens();
  const { createPool, error, loading } = useCreatePool();
  const [feeTier, setFeeTier] = useState(0.1);
  const [token0, setToken0] = useState<null | TokenMetadataType>(null);
  const [token1, setToken1] = useState<null | TokenMetadataType>(null);
 
  // Calculate LP fee and Protocol fee
  const lpFee =
    feeTier > 0 && feeTier < 20 ? (feeTier * 0.8).toFixed(2) + "%" : "-";
  const protocolFee =
    feeTier > 0 && feeTier < 20 ? (feeTier * 0.2).toFixed(2) + "%" : "-";

  // Determine message based on feeTier value
  let feeTierMessage = "";
  if (feeTier <= 0 || !feeTier) {
    feeTierMessage = "Please input a valid number";
  } else if (feeTier >= 20) {
    feeTierMessage = "Please input a number that is less than 20";
  }

  const handleCreatePool = async () => {
    let tokens: string[] = [token0?.address!, token1?.address!];
    let fee = feeTier * 100;
    let response = await createPool(tokens, fee);
  };

  const TooltipContent = () => {
    return (
      <div className="p-2">
        <p className="text-white-400" >
          <b>Tutorial tips:</b> Select token pair and fees below to create custom liquidity pool.
         </p>
      </div>
    );
  };


  const FeeTooltipContent = () => {
    return (
      <div className="p-2">
        <p className="text-white-400" >
          LP fee 80%
         </p>
         <p className="text-white-400 mt-2" >
          Protocol fee and Referral fee 20%
         </p>
      </div>
    );
  };

  return (
    <>
      <Modal isCentered isOpen={open} onClose={() => {
        setToken0(null);
        setToken1(null);
        setFeeTier(0.1)
        setOpen(false)
      }}>
        <ModalOverlay />
        <ModalContent
          backgroundColor="#5F456A"
          maxW="600px"
          minW="400px"
          width="90%"
        >
          <ModalHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl text-white tracking-tighter font-bolder leading-6 flex items-center">
                Create New Pool

                <InfoTooltip label={<TooltipContent/>} >
                <span className="ml-2 mt-1">
                <QuestionMarkOutlinedIcon className="w-4 h-4" />
                </span>
                </InfoTooltip>
              </h2>
              <button onClick={() => setOpen(false)}>
                <RoundCross />
              </button>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="w-full h-auto relative">
              <p className="text-[#9CA3AF] font-semibold text-sm">
                Select token pair & fees to create new liquidity pool
              </p>
              {/* Token Selection Section */}
              <div className="w-full rounded-lg bg-[#ffffff1a] mt-4 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 p-4 md:mt-6">
                <TokenSelector
                  token={token0}
                  setToken={setToken0}
                  tokenToFilter={token1}
                  key="token0"
                />
                <TokenSelector
                  token={token1}
                  setToken={setToken1}
                  tokenToFilter={token0}
                  key="token1"
                />
              </div>
              {/* Fee Section */}
              <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between mt-4 md:mt-6">
                <p className="text-white font-semibold text-sm mb-2 md:mb-0 flex items-center">
                  Total Fee
                  <InfoTooltip label={<FeeTooltipContent/>} >
                  <span className="ml-2 mt-1 cursor-pointer">
                  <QuestionMarkOutlinedIcon className="w-3 h-3 mb-1" />
                </span>
                </InfoTooltip>
                </p>
                <FeeTier feeTier={feeTier} setFeeTier={setFeeTier} />
              </div>

              {/* Conditional Message for FeeTier */}
              {feeTierMessage && (
                <p className="text-yellow-600 text-sm text-right mt-2">
                  {feeTierMessage}
                </p>
              )}

              {/* LP FEE SECTION */}
              <div className="w-full rounded-md bg-[#594661] border border-white border-opacity-20 mt-4 md:mt-6">
                <section className="flex items-center justify-between py-2 px-4">
                  <p className="text-white-400 text-sm font-bold">LP fee</p>
                  <p className="text-white-400 text-sm font-bold">{lpFee}</p>
                </section>
                <section className="flex items-center justify-between py-2 px-4">
                  <p className="text-white-400 text-sm font-bold">
                    Protocol Fee
                  </p>
                  <p className="text-white-400 text-sm font-bold">
                    {protocolFee}
                  </p>
                </section>
              </div>

              {/* Button section */}
              <Button
                bg="#2b011a"
                size="lg"
                width="full"
                height="54px"
                my={6}
                rounded="lg"
                fontWeight="bold"
                variant="outline"
                onClick={handleCreatePool}
                disabled={feeTierMessage || !token0 || !token1 ? true : false}
              >
                <Text sx={{ ...gradientStyle, fontSize: "24px" }}>
                  Create Pool
                </Text>
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreatePool;
