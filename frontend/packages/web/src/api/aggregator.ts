import axios from "axios";

const baseUrl = import.meta.env.VITE_AGGREGATOR_URL; 

export const getPathFromAggregator = async (
  inputToken: string,
  inputAmount: string | number,
  outputToken: string,
  slippage:number,
  providers?:string[]
) => {
  const url = `${baseUrl}/route`;
  const amount = inputAmount;
  if (Number.isNaN(parseFloat(amount.toString()))) {
    throw new Error("Invalid inputAmount: cannot parse to float");
  }
  const payload:any = {
    token_in: inputToken,
    token_out: outputToken,
    amount: amount.toString(),
    slippage:slippage.toString(),
  };
  if(providers && providers?.length){
    payload.providers = providers
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error making POST request:", error);
  }
};

export const getContinuousPathFromAggregator = async (
  inputToken: string,
  inputAmount: string | number,
  outputToken: string,
  slippage:number,
  providers?:string[]
) => {
  console.log(inputAmount)
  const url = `${baseUrl}/route/continuous`;
  const amount = inputAmount;
  if (Number.isNaN(parseFloat(amount.toString()))) {
    throw new Error("Invalid inputAmount: cannot parse to float");
  }
  let payload:any = {
    token_in: inputToken,
    token_out: outputToken,
    amount: amount.toString(),
    slippage:slippage.toString(),
  };
//   let payload:any = {
//     token_in: "usdc.spin-fi.testnet",
//     token_out: "aurora.fakes.testnet",
//     amount: 1000,
//     slippage: "0.5"
// }
  if(providers && providers?.length){
    payload.providers = providers
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error making POST request:", error);
  }
};
