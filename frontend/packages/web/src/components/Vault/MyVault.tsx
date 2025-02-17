import useVault from "@/hooks/modules/vault/useVault";
import useRewardEstimate from "@/hooks/modules/vault/useRewardEstimate";
import { calculateAPR } from "@/hooks/modules/vault/utils";
import React from "react";
import { Box } from "@chakra-ui/react";
import { Button } from "../shared";
import ModalVault from "./Modal.component";
import { formatUnits, parseUnits } from "viem";

export function UnstakeDisplay({ id, staked_amount, vault_id, config, tokenPrices }) {
  const { unstake } = useRewardEstimate(id, config.contract_id, config.reward_token.id);
  const { vault } = useVault(vault_id, config.contract_id);
  const [show, setShow] = React.useState(false);

  const stakeAmountNumber = React.useMemo(() => {
    return Number(formatUnits(staked_amount, config.stake_token.decimal));

  }, [staked_amount, config])
  const estimatedReward = React.useMemo(() => {

    if (!vault) return "0";
    if (!staked_amount) return "0";

    const apr = Number(formatUnits(BigInt(vault?.apr ?? 0), 4));
    const rewardPerYear = stakeAmountNumber * apr;

    const lockedTimeMs = vault?.locked_time_ms || 0;
    const lockedTimeDays = lockedTimeMs / 1000 / 60 / 60 / 24;
    const reward = (parseUnits(`${rewardPerYear * (lockedTimeDays / 365)}`, config.stake_token.decimal) * BigInt(vault.stake_reward_rate)) / BigInt("10000000000000000") ;
    return  Number(formatUnits(reward, config.reward_token.decimal)).toFixed(6).replace(/\.?0+$/, "");

  }, [stakeAmountNumber, vault]);

  if (!vault) {
    return null;
  }
  return (
    <>
      <Box
        style={{
          backgroundColor: "#FFFFFF1A",
        }}
        className="py-5 px-6 rounded-lg"
      >
        <div className="text-[24px] font-bold mb-6 flex">
          <img src={vault.url} className="w-[48px] mr-4" />
          <div>{vault.name ?? `#${vault.id}`}</div>
        </div>
        <div className="text-[14px] flex justify-between py-2">
          <span>
            Lock Time
          </span>
          <span style={{ color: "#FFA500" }} className="font-bold">
            {vault.locked_time_ms / 1000 / 60 / 60 / 24} days
          </span>
        </div>
        <div className="text-[14px] flex justify-between py-2">
          <span>APR</span>
          <span className="font-bold">{calculateAPR({ tokenPrices, vault })}</span>
        </div>
        <div className="text-[14px] flex justify-between py-2">
          Amount
          <div className="font-bold">{stakeAmountNumber}</div>
        </div>
        <div className="text-[14px] flex justify-between py-2 items-center">
          Unlocked On
          <div className="font-bold">
            {vault?.vault_start_time ? new Date(vault?.vault_start_time +
              vault?.locked_time_ms
            ).toLocaleString() : "Waiting Vault to be filled"}
          </div>
        </div>
        <div className="text-[14px] flex justify-between py-2">
          EST.Complete Reward
          <div className="font-bold flex gap-1 items-center">{estimatedReward}
            <img className="ml-1 w-[24px]" src={vault?.vaultConfig?.reward_token?.icon} alt="reward-icon" />
          </div>
        </div>
        <Button
          color="primary"
          full
          onClick={() => {
            if (new Date().getTime() < (vault?.vault_start_time ?? 0) + vault?.locked_time_ms) {
              setShow(true);
            } else {
              unstake();
            }
          }}
          disabled={vault.vault_start_time == null}
        >
          Unstake
        </Button>
      </Box>
      <UnstakeConfirmModal show={show} setShow={setShow} unstake={unstake} />
    </>

  );
}

function UnstakeConfirmModal({ show, setShow, unstake }) {
  return (
    <ModalVault
      open={show}
      onClose={() => setShow(false)}
      title="Still Locking"
    >
      <div className="text-black">
        Are you sure you want to unstake?  You will only get your principle back if you unstake now
      </div>
      <div className="flex justify-end gap-2">
        <Button
          color="primary"
          onClick={() => {
            setShow(false);
          }}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          onClick={() => {
            setShow(false);
            unstake();
          }}
        >
          Accept
        </Button>
      </div>
    </ModalVault>
  );
}

