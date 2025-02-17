import React, { useState } from "react";
import { utils } from "near-api-js";
import { useWalletSelector } from "@/context/wallet-selector";
import toast from "react-hot-toast";
import { VaultConfig, vaultConfigs } from "./config";
import { formatBigNumberWithDecimals, getDecimals } from "@/tools";

export type Vault = {
	vaultConfig: VaultConfig;
	apr: number;
	filled_amount: string;
	id: number;
	locked_time_ms: number;
	max_fill_amount: string;
	min_stake_amount: string;
	vault_start_time?: number;
	url: string;
	name: string;
	stake_reward_rate: string;
}
export default function useCookieJar() {
	const { viewMethod, accountId, callMethodMulti } = useWalletSelector();
	const [stakedByUser, setStakedByUser] = useState<any[]>([]);
	/**
	 * @typedef {Object} Vault
	 * @property {number} apr
	 * @property {string} filled_amount
	 * @property {number} id
	 * @property {number} locked_time_ms
	 * @property {string} max_fill_amount
	 * @property {string} min_stake_amount
	 * @property {?number} vault_start_time
	 */
	/**
	 * @returns {[Vault[], React.Dispatch<React.SetStateAction<Vault[]>>]}
	 */
	const useVaultsState = () => React.useState<Vault[]>([]);
	const [vaults, setVaults] = useVaultsState();
	const [needStorage, setNeedStorage] = useState<{ [contract_id: string]: any }>({});
	const [claimableReward, setClaimableReward] = useState<{ [contract_id: string]: any }>({});
	const [stakeBalance, setStakeBalance] = useState<{ [contract_id: string]: any }>({})
	const [burntList, setBurntList] = useState<{ [contract_id: string]: any }>({})
	React.useEffect(() => {
		getVaults().then((vaults) => {
			setVaults(vaults);
		});

		getStakedByUser().then(res => setStakedByUser(res))
		getNeedStorage().then(res => setNeedStorage(res))
		getClaimableReward().then(res => setClaimableReward(res))
		getStakeBalance().then(res => setStakeBalance(res))
		getBurnt().then(res => setBurntList(res))


	}, [accountId]);
	async function getVaults() {
		const res = await Promise.all(
			vaultConfigs.map(item => (
				viewMethod(item.contract_id, "get_vaults", {
					from_index: 0,
					limit: 100,
				})
			))
		)
		let vaults: Vault[] = [];
		res.forEach((item: Vault[], index) => {
			const vs = item.map(x => ({ ...x, vaultConfig: vaultConfigs[index] }))
			vaults = [
				...vaults,
				...vs
			]
		})
		
		// TODO: hotfix to remove "Test Vault 1" and "Test Vault 2" from mainnet
		//  This Array#filter MUST be removed when they are removed from the vault contract
		return vaults.filter(({ id }) => id !== 1713845877248 && id !== 1713980060364);
	}

	async function getStakedByUser() {
		if (!accountId) return [];
		let res: any[] = []
		for (let index = 0; index < vaultConfigs.length; index++) {
			const item = vaultConfigs[index];
			try {
				const d = await viewMethod(item.contract_id, "get_stake_by_id", {
					account_id: accountId,
				})
				const vs = d.map(x => ({ ...x, vaultConfig: item }))
				res = [
					...res,
					...vs
				]
			} catch (error) {

			}
		}

		return res
	}

	async function getNeedStorage() {
		if (!accountId) return;
		const res = await Promise.all(
			vaultConfigs.map(item => (
				viewMethod(item.contract_id, "need_storage_deposit", {
					account_id: accountId,
				})
			))
		)
		return res.reduce((pre, curr, index) => {
			return {
				...pre,
				[vaultConfigs[index].contract_id]: curr
			}
		}, {});
	}

	async function getClaimableReward() {
		if (!accountId) return;
		try {
			const res = await Promise.all(
				vaultConfigs.map(item => (
					viewMethod(
						item.contract_id,
						"get_recovery_reward",
						{
							account_id: accountId,
						}
					)
				))
			)

			return res.reduce((pre, curr, index) => {
				return {
					...pre,
					[vaultConfigs[index].contract_id]: curr
				}
			}, {});
		} catch (error) {
			console.log(error)
		}

	}

	async function getStakeBalance() {
		if (!accountId) return;

		const res = await Promise.all(
			vaultConfigs.map(item => (
				viewMethod(item.stake_token.id, "ft_balance_of", {
					account_id: accountId,
				})
			))
		)
		return res.reduce((pre, curr, index) => {
			return {
				...pre,
				[vaultConfigs[index].contract_id]: formatBigNumberWithDecimals(curr, getDecimals(vaultConfigs[index].stake_token.decimal)).replace(/,/g, "")
			}
		}, {});
	}

	async function recoverReward(config: VaultConfig) {
		if (!accountId) return;
		const actions: any[] = [];
		const rewardTokenStorage = await viewMethod(
			config.reward_token.id,
			"storage_balance_of",
			{
				account_id: accountId,
			}
		);

		if (!rewardTokenStorage) {
			actions.push({
				contractId: config.reward_token.id,
				methodName: "storage_deposit",
				args: {
					account_id: accountId,
				},
				gas: "30000000000000",
				amount: utils.format.parseNearAmount("0.00125"),
			});
		}

		actions.push({
			contractId: config.contract_id,
			methodName: "recover_reward",
			args: {},
			gas: "200000000000000",
		});

		await toast.promise(callMethodMulti(actions), {
			loading: "Recovering reward...",
			success: "Reward recovered!",
			error: "Error recovering reward",
		});

		window.location.reload();
	}

	async function getBurnt() {
		let res = {}
		for (let index = 0; index < vaultConfigs.length; index++) {
			const item = vaultConfigs[index];
			try {
				const burnt = await viewMethod(item.contract_id, "get_burning_reward", {});
				res = {
					...res,
					[item.contract_id]: burnt
				}
			} catch (error) {

			}
		}
		return res;
	}

	return {
		vaults,
		needStorage,
		stakedByUser,
		claimableReward,
		recoverReward,
		burntList,
		stakeBalance
	};
}
