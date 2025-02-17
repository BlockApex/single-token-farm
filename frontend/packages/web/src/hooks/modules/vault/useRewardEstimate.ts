import { useWalletSelector } from "@/context/wallet-selector";
import { utils } from "near-api-js";
import React from "react";
import toast from "react-hot-toast";

export default function useRewardEstimate(stakeId, contractId, rewardId) {
	const { accountId, viewMethod, callMethodMulti } = useWalletSelector();
	const [rewardEstimate, setRewardEstimate] = React.useState(null);
	React.useEffect(() => {
		getRewardEstimate().then((rewardEstimate) => {
			setRewardEstimate(rewardEstimate);
		});
	}, [accountId]);

	async function getRewardEstimate() {
		if (!accountId) return;
		if (!stakeId) return;
		const rewardEstimate = await viewMethod(
			contractId,
			"calculate_unstake_unchecked",
			{
				account_id: accountId,
				stake_id: stakeId,
			}
		);

		return rewardEstimate;
	}

	async function unstake() {
		const actions: any = [];

		const rewardTokenStorage = await viewMethod(
			rewardId,
			"storage_balance_of",
			{
				account_id: accountId,
			}
		);

		if (!rewardTokenStorage) {
			actions.push({
				contractId: rewardId,
				methodName: "storage_deposit",
				args: {},
				amount: utils.format.parseNearAmount("0.00125"),
			});
		}

		actions.push({
			contractId: contractId,
			methodName: "unstake",
			args: {
				stake_id: stakeId,
			},
			gas: "200000000000000",
		});

		actions.push({
			contractId: contractId,
			methodName: "recover_reward",
			args: {},
			gas: "200000000000000",
		});

		await toast.promise(callMethodMulti(actions), {
			loading: "Unstaking...",
			success: "Unstaked!",
			error: "Error unstaking",
		});
		await new Promise((res) => setTimeout(res, 1000));
		window.location.reload();
	}

	return {
		rewardEstimate,
		unstake,
	};
}
