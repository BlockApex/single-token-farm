import React from "react";
import { utils } from "near-api-js";
import { useWalletSelector } from "@/context/wallet-selector";
import useCookieJar, { Vault } from "@/hooks/modules/vault/hooks";
import toast from "react-hot-toast";
import { Button } from "@/components";
import { Box, Progress, Select, SimpleGrid } from "@chakra-ui/react";
import { XJumpKangarooIcon } from "@/assets/svg/kangaroo";
import Countdown from "react-countdown";
import ModalVault from "./Modal.component";
import { NoAvatarIcon } from "@/assets/svg/noAvatarIcon";
import { SubmitHandler, useForm } from "react-hook-form";
import { createResizedImage, formatBigNumberWithDecimals, getDecimals, parseBigNumberWithDecimals } from "@/tools";
import { VaultConfig, vaultConfigs } from "@/hooks/modules/vault/config";
import { formatUnits, parseUnits } from "viem";


const imageDimensions = (file: File): Promise<{ width: number, height: number }> =>
	new Promise((resolve, reject) => {
		const img = new Image()

		// the following handler will fire after a successful loading of the image
		img.onload = () => {
			const { naturalWidth: width, naturalHeight: height } = img
			resolve({ width, height } as { width: number, height: number })
		}

		// and this handler will fire if there was an error with the image (like if it's not really an image or a corrupted one)
		img.onerror = () => {
			reject('There was some problem with the image.')
		}

		img.src = URL.createObjectURL(file)
	})
const resizeFile = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
	const filename = file.name;
	const type = filename.substring(filename.lastIndexOf('.') + 1, filename.length) || filename;
	return new Promise((resolve) => {
		createResizedImage(
			file,
			maxWidth,
			maxHeight,
			type,
			100,
			0,
			(uri) => {
				resolve(uri as any);
			},
			"base64"
		);
	});
}


export const VaultAdmin = () => {
	const { vaults, needStorage } = useCookieJar();
	const { callMethodMulti, accountId } = useWalletSelector();
	const [stakeAmount, setStakeAmount] = React.useState(0);
	const [openCreateVault, setOpenCreateVault] = React.useState(false);

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
			<div className="w-full flex justify-end">
				<Button color="primary" onClick={() => setOpenCreateVault(true)}>
					+<span className="mr-[2px]">Create vault</span>
				</Button>
			</div>
			{openCreateVault &&
				<ModalVault
					title="Create Vault"
					onClose={() => setOpenCreateVault(false)}
					open={true}
				>
					<CreateVaultDisplay
						onClose={() => setOpenCreateVault(false)} />
				</ModalVault>
			}

			<SimpleGrid
				spacing={"24px"}
				columns={[1, 2, 3, 4]}
			>
				{vaults.map((vault) => {
					return (
						<VaultModifyDisplay
							key={vault.id}
							vault={vault}
						/>
					);
				})}
			</SimpleGrid>
		</div>
	);
}

type InputCreateVault = {
	name: string;
	max_fill_amount: number;
	min_stake_amount: number;
	arb_amount: number;
	locked_days: number;
	stake_token: string;
	reward_token: string;
}
function CreateVaultDisplay({ onClose }: { onClose: any }) {
	const { callMethodMulti, accountId } = useWalletSelector();
	const [contractId, setContractId] = React.useState(vaultConfigs[0].contract_id)
	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<InputCreateVault>({
		defaultValues: {
			name: "",
			max_fill_amount: 0,
			min_stake_amount: 0,
			arb_amount: 0,
			locked_days: 0,
			stake_token: vaultConfigs[0].stake_token.id,
			reward_token: vaultConfigs[0].reward_token.id
		}
	})

	const [avatar, setAvatar] = React.useState("");
	const onSubmit: SubmitHandler<InputCreateVault> = async (data) => {
		if (!avatar) {
			toast.error("Avatar is not set.");
			return;
		}

		const config = vaultConfigs.find(item => item.reward_token.id === data.reward_token && item.stake_token.id === data.stake_token);
		if (!config) {
			toast.error("Contract vault is not found!");
			return;
		}
		const max_fill_amount = parseUnits(`${data.max_fill_amount}` as any, config.stake_token.decimal).toString();
		const min_stake_amount = parseUnits(`${data.min_stake_amount}`, config.stake_token.decimal).toString();
		const apr_amount = Number(data.arb_amount);
		if (isNaN(apr_amount)) return toast.error("APR must be a number");
		if (Number(data.locked_days) < 1)
			return toast.error("Lock days must be greater than 0");
		const locked_time_ms = Number(data.locked_days) * 1000 * 60 * 60 * 24;
		const url = avatar;
		const actions = [
			{
				contractId: config.contract_id,
				methodName: "create_vault",
				args: {
					max_fill_amount,
					min_stake_amount,
					apr: Number(parseUnits(`${apr_amount}`, 2).toString()),
					locked_time_ms,
					url,
					name: data.name
				},
				gas: "200000000000000",
			},
		];

		await toast.promise(callMethodMulti(actions), {
			loading: "Creating vault",
			success: "Vault created",
			error: "Error creating vault",
		});
		// onClose()
		await new Promise((r) => setTimeout(r, 1000));
		window.location.reload();
	}

	const handleFile = async (e) => {
		const file = e.currentTarget.files[0];
		if (file?.size > 800000) {
			toast.error("File's size > 800kb.")
			return;
		}

		const { width, height } = await imageDimensions(file);

		const base64 = await resizeFile(file, 48, (height / width) * 48);
		setAvatar(base64);
	}

	return (
		<Box sx={{
			display: "flex",
			flexDirection: "column",
			gap: 4,
			color: "#000",
		}}>
			<form onSubmit={handleSubmit(onSubmit)}>
				<div>
					<div className="text-[14px] font-[500] mb-2">Logo</div>
					<div className="flex gap-4 items-center">
						{!avatar ? <div className="bg-[#0000000D] p-4 rounded-[50%] w-[64px]">
							<NoAvatarIcon />
						</div> : <img className="w-[48px]" src={avatar} alt="avatar" />}
						<div>
							<div className="flex gap-4 items-center mb-1">
								<input
									type="file"
									name="file"
									accept=".jpg, .jpeg, .gif, .svg, .png"
									id="avatar"
									className="hidden"
									onChange={handleFile}
								/>
								{!avatar ? <label className={"py-2 px-3 text-[14px] font-[600] cursor-pointer"}
									style={{
										borderRadius: "8px",
										border: "1px solid rgba(0, 0, 0, 0.20)"
									}}
									htmlFor="avatar"
								>
									Choose file
								</label>
									:
									<label className={"py-2 px-3 text-[14px] font-[600] cursor-pointer bg-[#6E3A85] text-white"}
										style={{
											borderRadius: "8px",
										}}
										htmlFor="avatar"
									>
										Update new picture
									</label>}
								{!avatar ? <div>
									No file chosen
								</div> :
									<div className="py-2 px-3 text-[14px] font-[600] cursor-pointer"
										style={{
											borderRadius: "8px",
											border: "1px solid rgba(0, 0, 0, 0.20)"
										}}
										onClick={() => setAvatar("")}
									>
										Delete
									</div>}
							</div>
							{!avatar && <div className="text-[#00000099] text-[12px]">JPG, GIF, SVG or PNG. Max size of 800kb</div>}
						</div>
					</div>

				</div>
				<div className="py-2">
					<div className="text-[14px] font-[500] mb-2">Vault Name</div>
					<input
						style={{
							background: "transparent",
							border: "1px solid rgba(0, 0, 0, 0.20)",
							borderRadius: "8px",
							padding: "12px",
							width: "100%",
						}}
						placeholder="Enter name"
						{...register("name", { required: true })}
					/>
					{errors.name && <div className="text-red">This field is required</div>}
				</div>

				<div className="py-2">
					<div className="text-[14px] font-[500] mb-2">Stake token address</div>
					<input
						{...register("stake_token", { required: true })}
						style={{
							background: "transparent",
							border: "1px solid rgba(0, 0, 0, 0.20)",
							borderRadius: "8px",
							padding: "12px",
							width: "100%",
						}}
						placeholder="Enter amount"
					/>
					{errors.stake_token && <div className="text-red">This field is required</div>}
				</div>

				<div className="py-2">
					<div className="text-[14px] font-[500] mb-2">Reward token address</div>
					<input
						{...register("reward_token", { required: true })}
						style={{
							background: "transparent",
							border: "1px solid rgba(0, 0, 0, 0.20)",
							borderRadius: "8px",
							padding: "12px",
							width: "100%",
						}}
						placeholder="Enter amount"
					/>
					{errors.reward_token && <div className="text-red">This field is required</div>}
				</div>
				<div className="py-2">
					<div className="text-[14px] font-[500] mb-2">Max Fill Amount</div>
					<input
						{...register("max_fill_amount", { required: true })}
						style={{
							background: "transparent",
							border: "1px solid rgba(0, 0, 0, 0.20)",
							borderRadius: "8px",
							padding: "12px",
							width: "100%",
						}}
						placeholder="Enter amount"
					/>
					{errors.max_fill_amount && <div className="text-red">This field is required</div>}
				</div>
				{/* <div className="py-2">
					<div className="text-[14px] font-[500] mb-2">Contract</div>
					<Select style={{
						border: "1px solid rgba(0, 0, 0, 0.20)",
						borderRadius: "8px",
					}} defaultValue={contractId} variant={"outline"} onChange={e => setContractId(e.currentTarget.value)}>
						{vaultConfigs.map(item => (<option value={item.contract_id} key={item.contract_id}>{item.contract_id}</option>))}
					</Select>
					{errors.max_fill_amount && <div className="text-red">This field is required</div>}
				</div> */}
				<div className="py-2">
					<div className="text-[14px] font-[500] mb-2">Minimum Stake Amount</div>
					<input
						{...register("min_stake_amount", { required: true })}
						style={{
							background: "transparent",
							border: "1px solid rgba(0, 0, 0, 0.20)",
							borderRadius: "8px",
							padding: "12px",
							width: "100%",
						}}
						placeholder="Enter amount"
					/>
					{errors.min_stake_amount && <div className="text-red">This field is required</div>}
				</div>
				<div className="py-2">
					<div className="text-[14px] font-[500] mb-2">APR %</div>
					<input
						{...register("arb_amount", { required: true })}
						style={{
							background: "transparent",
							border: "1px solid rgba(0, 0, 0, 0.20)",
							borderRadius: "8px",
							padding: "12px",
							width: "100%",
						}}
						placeholder="Enter amount"
					/>
					{errors.arb_amount && <div className="text-red">This field is required</div>}
				</div>
				<div className="py-2">
					<div className="text-[14px] font-[500] mb-2">Lock Days</div>
					<input
						{...register("locked_days", { required: true })}
						style={{
							background: "transparent",
							border: "1px solid rgba(0, 0, 0, 0.20)",
							borderRadius: "8px",
							padding: "12px",
							width: "100%",
						}}
						placeholder="Enter amount"
					/>
					{errors.locked_days && <div className="text-red">This field is required</div>}
				</div>
				<Button
					className="mt-2"
					full
					// variant="contained"
					color="primary"
					type="submit"
				>
					Create Vault
				</Button>
			</form>
		</Box>
	);
}

type InputVaultModify = {
	locked_day: number;
	arb_amount: number;
	max_fill_amount: number;
	min_stake_amount: number;
}

function VaultModifyDisplay({ vault }: { vault: Vault }) {
	const config = vault.vaultConfig;
	const contractId = config.contract_id;
	const { callMethodMulti } = useWalletSelector();
	const staked = Number(
		utils.format
			.formatNearAmount(vault.filled_amount || "0")
			.replace(/,/g, "") || 0
	);
	const maxStake = Number(
		utils.format
			.formatNearAmount(vault.max_fill_amount || "0")
			.replace(/,/g, "") || 0
	);
	const progress = ((Number(staked) / Number(maxStake)) * 100)
		.toFixed(6)
		.replace(/\.?0+$/, "");

	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm<InputVaultModify>({
		defaultValues: {
			arb_amount: undefined,
			max_fill_amount: undefined,
			min_stake_amount: undefined,
			locked_day: undefined,
		}
	})

	const onSubmit: SubmitHandler<InputVaultModify> = async (data) => {

		let args: any = {
			vault_id: vault.id,
		};

		if (data.max_fill_amount) {
			const max_fill_amount = parseUnits(`${data.max_fill_amount}`, config.stake_token.decimal).toString();
			args = { ...args, max_fill_amount };
		}

		if (data.min_stake_amount) {
			const min_stake_amount = parseUnits(`${data.min_stake_amount}`, config.stake_token.decimal).toString()
			args = { ...args, min_stake_amount };
		}

		if (data.arb_amount) {
			const apr_amount = Number(data.arb_amount);
			if (isNaN(apr_amount)) return toast.error("APR must be a number");
			args = { ...args, apr: Number(parseUnits(`${apr_amount}`, 2).toString()) };
		}

		if (data.locked_day) {
			const locked_time_ms = Number(data.locked_day) * 1000 * 60 * 60 * 24;
			args = { ...args, locked_time_ms };
		}



		const actions = [
			{
				contractId,
				methodName: "modify_vault",
				args: args,
				gas: "200000000000000",
			},
		];

		await toast.promise(callMethodMulti(actions), {
			loading: "Modifying vault",
			success: "Vault modified",
			error: "Error modifying vault",
		});
		await new Promise((r) => setTimeout(r, 1000));
		window.location.reload();

	}

	return (
		<Box>
			<div
				key={vault.id}
				style={{
					backgroundColor: "#FFFFFF1A",
				}}
				className="py-5 px-6 rounded-lg"
			>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="text-[24px] font-bold mb-6 flex">
						<img src={vault.url} className="w-[48px] mr-4" />
						<div>{vault.name ?? `#${vault.id}`}</div>
					</div>
					<div style={{ textAlign: "right" }} className="mb-6">
						<span className="text-[16px] font-bold mb-2">{Math.min(Number(progress), 100)}% filled</span>
						<Progress
							value={Number(progress)}
							size='xs'
							bgGradient={"rgba(255, 255, 255, 0.20)"}
							sx={{
								borderRadius: 16,
								'& > div': {
									background: 'linear-gradient(108deg, #AE00FF 12.49%, #F10 87.51%)',
								},
							}}
						/>
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								justifyContent: "space-between",
							}}
							className="font-[500] text-[16px] mt-2"
						>
							<p>
								{Intl.NumberFormat("en-US", {
									notation: "compact",
									compactDisplay: "short",
								}).format(
									Number(formatBigNumberWithDecimals(vault.filled_amount, getDecimals(config.stake_token.decimal))
										.replace(/,/g, ""))
								)}
							</p>
							<p
								style={{
									display: "flex",
									flexDirection: "row",
									alignItems: "center",
								}}
							>
								{Intl.NumberFormat("en-US", {
									notation: "compact",
									compactDisplay: "short",
								}).format(
									Number(formatBigNumberWithDecimals(vault.max_fill_amount, getDecimals(config.stake_token.decimal))
										.replace(/,/g, ""))
								)}
								<img className="ml-1 w-[24px]" src={vault.vaultConfig.stake_token.icon} alt="stake-token-icon" />
							</p>
						</div>
					</div>

					<div className="text-[14px] flex justify-between py-2">
						<span>
							Lock Time
						</span>
						<span style={{ color: "#FFA500" }} className="font-bold">
							{vault.locked_time_ms / 1000 / 60 / 60 / 24} days
						</span>
					</div>
					{
						vault?.vault_start_time &&
						<div className="text-[14px] flex justify-between py-2">
							Lock days left
							<span>
								<Countdown
									date={vault.vault_start_time + vault.locked_time_ms}
									renderer={(p) => {
										if (p.completed) {
											return <span className="font-bold">Unlocked</span>
										}

										return <span className="font-bold">{p.days} days</span>
									}}
								/>
							</span>
						</div>
					}
					<div className="text-[14px] flex justify-between py-2">
						<span>
							Status
						</span>
						<span style={{ color: vault.vault_start_time ? "#FFA500" : "#00FF00" }} className="font-bold">
							{vault.vault_start_time ?
								"Unlocking" : "Open"
							}</span>
					</div>
					<div className="text-[14px] flex justify-between py-2">
						<span>APR</span>
						<span className="font-bold">{formatUnits(BigInt(vault.apr), 2).toString()}% </span>
					</div>
					<div className="text-[14px] py-2">
						<div className="mb-1">Max FIll Amount</div>
						<input
							placeholder="Enter amount"
							style={{
								background: "transparent",
								border: "1px solid rgba(252, 252, 252, 0.20)",
								borderRadius: "8px",
								padding: "12px",
								color: "white",
								width: "100%",
							}}
							{...register("max_fill_amount")}
						// onChange={(e) => setStakeAmount(Number(e.target.value))}
						/>
					</div>
					<div className="text-[14px] py-2">
						<div className="mb-1">Minimum Stake Amount</div>
						<input
							placeholder="Enter amount"
							style={{
								background: "transparent",
								border: "1px solid rgba(252, 252, 252, 0.20)",
								borderRadius: "8px",
								padding: "12px",
								color: "white",
								width: "100%",
							}}
							{...register("min_stake_amount")}
						// onChange={(e) => setStakeAmount(Number(e.target.value))}
						/>
					</div>
					<div className="text-[14px] py-2">
						<div className="mb-1">APR</div>
						<input
							type="number"
							placeholder="Enter amount"
							style={{
								background: "transparent",
								border: "1px solid rgba(252, 252, 252, 0.20)",
								borderRadius: "8px",
								padding: "12px",
								color: "white",
								width: "100%",
							}}
							{...register("arb_amount")}
						// onChange={(e) => setStakeAmount(Number(e.target.value))}
						/>
					</div>
					<div className="text-[14px] py-2">
						<div className="mb-1">Lock Days</div>
						<input
							type="number"
							placeholder="Enter amount"
							style={{
								background: "transparent",
								border: "1px solid rgba(252, 252, 252, 0.20)",
								borderRadius: "8px",
								padding: "12px",
								color: "white",
								width: "100%",
							}}
							{...register("locked_day")}
						// onChange={(e) => setStakeAmount(Number(e.target.value))}
						/>
					</div>
					<Button
						type="submit"
						// variant="contained"
						color="primary"
						full
					>
						Modify
					</Button>
				</form>
			</div>
		</Box>
	);
}
