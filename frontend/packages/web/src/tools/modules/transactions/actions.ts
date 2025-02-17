import { TransactionPayload } from ".";

export interface Actionable {
  error: string;
  success: string;
  check: ({ transaction: { actions } }: TransactionPayload) => boolean;
}

export const actions = [
  {
    error: "We had a problem with your request.",
    success: "Successfully redeemed tokens.",
    check: ({ transaction: { actions } }: TransactionPayload) => {
      const [action] = actions;

      return action.FunctionCall.method_name === "ft_faucet";
    },
  },
  {
    error: "We had a problem with your request.",
    success: "Successfully redeemed tokens.",
    check: ({ transaction: { actions } }: TransactionPayload) => {
      const [action] = actions;

      return action.FunctionCall.method_name === "nft_faucet";
    },
  },
  {
    error: "We had a problem withdrawing your allocations.",
    success: "Successfully withdrawn locations.",
    check: ({ transaction: { actions } }: TransactionPayload) => {
      const [action] = actions;

      return action.FunctionCall.method_name === "withdraw_allocations";
    },
  },
  {
    error: "Something happened when buying your tickets.",
    success: "Tickets purchased successfully.",
    check: ({ transaction: { actions } }: TransactionPayload) => {
      const [action] = actions;

      const args = window.atob(action.FunctionCall.args);

      return (
        action.FunctionCall.method_name === "ft_transfer_call" &&
        args.includes("BuyAllocation")
      );
    },
  },
  {
    error: "We were unable to update your membership.",
    success: "Membership updated successfully.",
    check: ({ transaction: { actions } }: TransactionPayload) => {
      const [action] = actions;

      const args = window.atob(action.FunctionCall.args);

      return (
        action.FunctionCall.method_name === "ft_transfer_call" &&
        args.includes("VerifyAccount")
      );
    },
  },
  {
    error: "We were unable to update your membership.",
    success: "Membership updated successfully.",
    check: ({ transaction: { actions } }: TransactionPayload) => {
      const [action] = actions;

      return action.FunctionCall.method_name === "decrease_membership_tier";
    },
  },
  {
    error: "We were unable to stake your tokens.",
    success: "Successfully staked NFTs.",
    check: ({ transaction: { actions } }: TransactionPayload) => {
      const [action] = actions;

      return action.FunctionCall.method_name === "nft_transfer_call";
    },
  },
  {
    error: "We We were unable to remove your NFTs.",
    success: "NFTs successfully withdrawn.",
    check: ({ transaction: { actions } }: TransactionPayload) => {
      const [action] = actions;

      return action.FunctionCall.method_name === "unstake";
    },
  },
  {
    error: "We were unable to redeem your rewards.",
    success: "Successfully redeemed rewards.",
    check: ({ transaction: { actions } }: TransactionPayload) => {
      const [action] = actions;

      return action.FunctionCall.method_name === "withdraw_reward";
    },
  },
  {
    error: "We were unable to stake your Jumps.",
    success: "Jump staked successfully.",
    check: ({ transaction: { actions } }: TransactionPayload) => {
      const [action] = actions;

      const args = window.atob(action.FunctionCall.args);

      return (
        action.FunctionCall.method_name === "ft_transfer_call" &&
        args.includes("mint")
      );
    },
  },
  {
    error: "We had a problem redeeming your tokens.",
    success: "Jump tokens redeemed successfully.",
    check: ({ transaction: { actions } }: TransactionPayload) => {
      const [action] = actions;

      return action.FunctionCall.method_name === "burn_x_token";
    },
  },
  {
    error: "We had a problem deploying your Token.",
    success: "Token successfully deployed.",
    check: ({ transaction: { actions } }: TransactionPayload) => {
      const [action] = actions;

      return action.FunctionCall.method_name === "deploy_new_contract";
    },
  },
  {
    error: "We had a problem redeeming your jump tokens.",
    success: "Successfully redeemed Jump tokens.",
    check: ({ transaction: { actions } }: TransactionPayload) => {
      const [action] = actions;

      return action.FunctionCall.method_name === "withdraw_locked_tokens";
    },
  },
  {
    error: "We had a problem purchasing your fastpass.",
    success: "FastPass successfully purchased.",
    check: ({ transaction: { actions } }: TransactionPayload) => {
      const [action] = actions;

      const args = window.atob(action.FunctionCall.args);

      return (
        action.FunctionCall.method_name === "ft_transfer_call" &&
        args.includes("BuyFastPass")
      );
    },
  },
];

export default actions;
