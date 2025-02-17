import Big from "big.js";
import { useMemo } from "react";
import { Flex, Input, Text } from "@chakra-ui/react";
import { JUMP_TOKEN } from "@/env/contract";
import { useFormik } from "formik";
import { useNearQuery } from "react-near";
import { WalletIcon } from "../../assets/svg";
import { ModalImageDialog, DialogParams, Button } from "../../components";
import { initialValues, validationSchema } from "./form/formStaking";
import { useWalletSelector } from "@/context/wallet-selector";

interface IStakeModalProps
  extends Omit<DialogParams, "children" | "footer" | "title"> {
  _onSubmit: (values: typeof initialValues) => void | Promise<void>;
}

export const StakeModal = ({ _onSubmit, ...rest }: IStakeModalProps) => {
  const { selector, accountId } = useWalletSelector();

  const { data: balanceJump = 0 } = useNearQuery<
    string,
    { account_id: string }
  >("ft_balance_of", {
    contract: JUMP_TOKEN,
    variables: {
      account_id: accountId as string,
    },
    poolInterval: 1000 * 60,
    skip: !accountId,
    debug: true,
  });

  const { data: jumpMetadata } = useNearQuery<
    {
      decimals: number;
    },
    { account_id: string }
  >("ft_metadata", {
    contract: JUMP_TOKEN,
    poolInterval: 1000 * 60,
    skip: !accountId,
    debug: true,
  });

  const { values, setFieldValue, handleSubmit, isSubmitting } = useFormik({
    onSubmit: async (values) => {
      try {
        await _onSubmit(values);
      } catch (error) {
        console.warn(error);
      } finally {
        rest.onClose();
      }
    },
    initialValues: initialValues,
    validationSchema: validationSchema,
  });

  const decimals = useMemo(() => {
    return new Big(10).pow(jumpMetadata?.decimals ?? 0);
  }, [jumpMetadata]);

  const balance = useMemo(() => {
    return new Big(balanceJump ?? 0).div(decimals).toFixed(2);
  }, [balanceJump, decimals]);

  return (
    <ModalImageDialog
      {...rest}
      title="Stake Jump"
      image="https://images.unsplash.com/photo-1593672715438-d88a70629abe?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1287&q=80"
      footer={
        <Button
          full
          white
          className="justify-between"
          disabled={isSubmitting}
          onClick={() => handleSubmit()}
        >
          Stake
          <WalletIcon />
        </Button>
      }
    >
      <Flex flex={1} flexDirection="column" alignItems="start" h="100%">
        <Text
          letterSpacing="-0.03em"
          fontWeight="semibold"
          fontSize={14}
          lineHeight={1.2}
          color="white"
          mb={30}
        >
          Stake some tokens into our Jump staking pool to earn launchpad
          allocations to invest in launchpad project
        </Text>
        <Text opacity={0.9} mb={1} fontSize={14} color="white">
          Staking Amount
        </Text>
        <Input
          bg="white"
          color="black"
          onChange={(e) => setFieldValue("value", e.target.value)}
          placeholder="Staking Deposit Value"
          type="number"
          variant="filled"
          value={values.value}
          _hover={{ bg: "white" }}
          _focus={{ bg: "white" }}
        />
        <Text opacity={0.8} mt={1} fontSize={14} color="white">
          Balance: {balance} JUMP
        </Text>
      </Flex>
    </ModalImageDialog>
  );
};
