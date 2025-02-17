import { useWalletSelector } from "@/context/wallet-selector";
import { Vault } from "@/hooks/modules/vault";
import { calculateAPR } from "@/hooks/modules/vault/utils";
import type { ITokenPrice } from "@/stores/token-price-store";
import { formatBigNumberWithDecimals, getDecimals } from "@/tools";
import { Box, Progress } from "@chakra-ui/react";
import { utils } from "near-api-js";
import React from "react";
import Countdown from "react-countdown";
import toast from "react-hot-toast";
import { parseUnits } from "viem";
import { Button } from "../shared";

export const VaultCard = ({
  vault,
  index,
  stakeBalance,
  needStorage,
  tokenPrices,
}: {
  vault: Vault,
  index: number,
  stakeBalance: any,
  needStorage: any,
  tokenPrices: ITokenPrice[],
}) => {
  const contractId = vault.vaultConfig.contract_id;
  const config = vault.vaultConfig;
  const { callMethodMulti, accountId } = useWalletSelector();
  const [stakeAmount, setStakeAmount] = React.useState(0);
  const staked = Number(
    formatBigNumberWithDecimals(vault.filled_amount, getDecimals(config.stake_token.decimal))
  );
  const maxStake = Number(
    formatBigNumberWithDecimals(vault.max_fill_amount, getDecimals(config.stake_token.decimal))
  );
  const progress = ((Number(staked) / Number(maxStake)) * 100)
    .toFixed(6)
    .replace(/\.?0+$/, "");

  async function stakeJar(id) {
    if (!accountId) {
      return toast.error("Please connect your wallet");
    }

    if (stakeAmount <= 0) {
      return toast.error("Please enter a valid amount");
    }

    if (Number(stakeAmount) > Number(stakeBalance)) {
      return toast.error("Not enough Stake token");
    }

    let actions: any[] = [];
    if (needStorage) {
      actions.push({
        contractId: contractId,
        methodName: "storage_deposit",
        args: {},
        amount: utils.format.parseNearAmount("0.0075"),
      });
    }
    actions.push({
      contractId: config.stake_token.id,
      methodName: "ft_transfer_call",
      args: {
        receiver_id: contractId,
        amount: parseUnits(`${stakeAmount}`, config.stake_token.decimal).toString(),
        msg: JSON.stringify({
          vault_id: id,
        }),
      },
      amount: "1",
    });

    await toast.promise(callMethodMulti(actions, null, null), {
      loading: "Staking ...",
      success: "Staked",
      error: "Error Stake"
    });

    await new Promise((r) => setTimeout(r, 1000));

    window.location.reload();
  }
  return (
    <Box
      id={index === 0 ? "vaults-card" : "vault" + index}
      key={vault.id}
      style={{
        backgroundColor: "#FFFFFF1A",
      }}
      className="py-5 px-6 rounded-lg flex flex-col justify-between"
    >
      <div>
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
              <img className="ml-1 w-[24px]" src={vault.vaultConfig.stake_token.icon} alt="stake_token-icon" />
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

          <span className="font-bold">{calculateAPR({ tokenPrices, vault })}</span>
        </div>
      </div>

      <div>
        <div className="py-2 mb-6">
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
            onChange={(e) => setStakeAmount(Number(e.target.value))}
          />
        </div>
        {accountId && <div className="flex items-center gap-1 mb-1">Balance: {Intl.NumberFormat("en-US").format(Number(stakeBalance))}
          <img className="ml-1 w-[24px]" src={vault?.vaultConfig?.stake_token?.icon} alt="reward-icon" />
        </div>}
        <Button
          onClick={() => stakeJar(vault.id)}
          // variant="contained"
          color="primary"
          full
          disabled={vault.vault_start_time != null}
        >
          Stake
        </Button>
      </div>
    </Box>
  );
}