import {
  FormCardStep1,
  TokenLauncherTopCard,
  FormCardStep2,
  FormIntroModal,
} from "@/components";
import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useWalletSelector } from "@/context/wallet-selector";
import { useTokenLauncher } from "@/stores/token-launcher-store";
import {
  EMPTY_TOKEN_OBJ,
  TokenDataProps,
  createArgsForTokenContract,
  DEPLOY_COST,
  getContractType,
  handleOpenModal,
} from "./token-launcher.config";
import PageContainer from "@/components/PageContainer";

export const TokenLauncher = () => {
  const [step, setStep] = useState<string>("step 1");
  const [tokenData, setTokenData] = useState<TokenDataProps>(EMPTY_TOKEN_OBJ);
  const [showModal, setShowModal] = useState<boolean>(false);

  const { accountId, selector } = useWalletSelector();

  const { createToken } = useTokenLauncher();

  const newTokenForm = useForm<TokenDataProps>();

  const { handleSubmit, reset } = newTokenForm;

  function handleFormStepChange() {
    step == "step 1" ? setStep("step 2") : setStep("step 1");
  }

  function handleUpdateTokenType(tokenType: string) {
    if (tokenType == "Mintable Token") {
      setTokenData((prevState) => {
        return {
          ...prevState,
          type: "mintable",
          supply_type: "unlimited",
        };
      });
    }
    if (tokenType == "Simple Token") {
      setTokenData((prevState) => {
        return {
          ...prevState,
          type: "simple",
          supply_type: "fixed",
        };
      });
    }
  }

  const handleStep1FormSubmit = handleSubmit((data) => {
    setTokenData(() => data);
    handleFormStepChange();
  });

  const handleStep2FormSubmit = handleSubmit(async (data) => {
    setTokenData((prevState) => {
      return { ...prevState, ...data };
    });

    const contract_args = createArgsForTokenContract(
      { ...tokenData, ...data },
      accountId
    );

    const contract = getContractType(tokenData?.supply_type);

    createToken(
      DEPLOY_COST,
      accountId!,
      tokenData?.name,
      contract_args,
      selector,
      contract,
      "1"
    );

    reset();
  });

  // First Interaction modal
  useEffect(() => {
    handleOpenModal(setShowModal);
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <PageContainer>
      <FormProvider {...newTokenForm}>
        <FormIntroModal isOpen={showModal} handleClose={handleCloseModal} />
        <TokenLauncherTopCard />
        <div className="relative token-launcher-form">
          {step == "step 1" && (
            <FormCardStep1 onSubmitStepForm={handleStep1FormSubmit} />
          )}

          {step == "step 2" && (
            <FormCardStep2
              onSubmitStep2Form={handleStep2FormSubmit}
              onReturnFunction={handleFormStepChange}
              onUpdateTokenType={handleUpdateTokenType}
            />
          )}
        </div>
      </FormProvider>
    </PageContainer>
  );
};

export default TokenLauncher;
