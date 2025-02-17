import { useWalletSelector } from "@/context/wallet-selector";
import React from "react";
import { vaultConfigs } from "./config";
import { Vault } from "./hooks";

export default function useVault(vauldId, contractId) {
	const { viewMethod } = useWalletSelector();

	const [vault, setVault] = React.useState<Vault | null>(null);
	const [burnt, setBurnt] = React.useState(null);

	React.useEffect(() => {
		getVault().then((vault) => {
			setVault(vault);
		});

		getBurnt().then((burnt) => {
			setBurnt(burnt);
		});
	}, []);

	async function getVault() {
		const vault = await viewMethod(contractId, "get_vault", {
			vault_id: vauldId,
		});

		return {...vault, vaultConfig: vaultConfigs.find(item => item.contract_id === contractId)};
	}

	async function getBurnt() {
		const burnt = await viewMethod(contractId, "get_burning_reward", {});
		return burnt;
	}

	return {
		vault,
		burnt,
	};
}
