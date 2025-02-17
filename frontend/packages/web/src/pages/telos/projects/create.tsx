import { TopCard } from "@/components";
import PageContainer from "@/components/PageContainer";
import MantleIDOCreationForm from "@/components/modules/mantle/launchpad/MantleIDOCreationForm";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { TELOS_LAUNCHPAD_CONTRACT } from "@/env/contract";
interface MantleLaunchpadForm {
  name: string;
}
export default function CreateMantleProject() {
  const mantleLaunchpadForm = useForm<MantleLaunchpadForm>();

  return (
    <PageContainer>
      <TopCard
        gradientText="Create Telos Testnet IDO Launchpad "
        bigText="Jump Pad"
        bottomDescription="Simple Enter Your Project Details and Create IDO Launchpad "
        jumpLogo
      />
      <FormProvider {...mantleLaunchpadForm}>
        <div
          className="
					flex flex-col items-center justify-center
				"
        >
          <MantleIDOCreationForm LaunchPadAddress={TELOS_LAUNCHPAD_CONTRACT} />
        </div>
      </FormProvider>
    </PageContainer>
  );
}