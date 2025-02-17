import { Contract, utils } from "near-api-js";

export const oneYoctoNear = utils.format.formatNearAmount(
  "1000000000000000000000000"
);

export const completeTransferOfTokens = async ({
  contract,
  receiverId,
  amount,
  message,
}: {
  contract: Contract;
  receiverId: string;
  amount: string;
  message: string;
}) => {
  try {
    // @ts-ignore
    await contract.ft_transfer_call(
      {
        receiver_id: receiverId,
        amount: amount,
        msg: message,
      }, // Arguments
      "300000000000000", // Gas, equivalent to 300 TeraGas
      oneYoctoNear // Attached deposit, 1 yoctoNEAR
    );
    return {
      success: true,
    };
  } catch (error: any) {
    console.log("Error: ", error);
    return error;
  }
};
