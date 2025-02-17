import NFTStakingProjectComponent from "./NFTStackProject.component";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { useWalletSelector } from "@/context/wallet-selector";
import { useNftStaking } from "@/stores/nft-staking-store";
import { useQuery } from "@apollo/client";
import { getUTCDate, Token } from "@near/ts";
import { StakingProjectDocument } from "@near/apollo";
import { addMilliseconds } from "date-fns";
import { useNearQuery } from "react-near";
import toast from "react-hot-toast";
import { XCircleIcon } from "@heroicons/react/24/solid";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
/* import { getRewards, parseRawFarmDataToReward } from "@/helper/near"; */

function NFTStakingProject() {
  const { id = "" } = useParams();
  const collection = window.atob(id);
  // const [rewardsForCollection, setRewardsForCollection] = useState<any>([]);
  const {
    accountId,
    selector,
    toggleModal: connectWallet,
  } = useWalletSelector();
  const {
    fetchUserTokens,
    tokens: unorderedTokens,
    claimRewards,
    unstake,
    stake,
    loading: actionsLoading,
  } = useNftStaking();
  const { data: { staking } = {}, loading: stakingLoading } = useQuery(
    StakingProjectDocument,
    {
      variables: { collection },
    }
  );

  const tokens = unorderedTokens.sort((a, b) =>
    Number(a.stakedAt) < Number(b.stakedAt) ? 1 : -1
  );

  const { data: stakableTokens, loading: stakableLoading } = useNearQuery(
    "nft_tokens_for_owner",
    {
      contract: collection,
      variables: {
        account_id: accountId,
        from_index: "0",
        limit: 100,
      },
      skip: !accountId,
    }
  );

  useEffect(() => {
    (async () => {
      if (accountId) {
        await fetchUserTokens(selector, accountId, collection);
      }
    })();
  }, [accountId]);

  //TODO: rewired check rewards
  /* useEffect(() => {
    if (!collection) return;
    (async () => {
      const reward = await getRewards(collection);
      const result = await parseRawFarmDataToReward([reward]);
      setRewardsForCollection(result[0]);
    })();
  }, [collection]); */

  const [selectingMode, setSelectingMode] = useState<boolean>(false);
  const [selectedUnstakeTokens, setSelectedUnstakeTokens] = useState<Token[]>(
    []
  );
  const [selectedStakableTokens, setSelectedStakableTokens] = useState<Token[]>(
    []
  );
  const [selectToStakeModal, showSelectToStakeModal] = useState<boolean>(false);
  const [confirmUnstakeModal, showConfirmUnstakeModal] =
    useState<boolean>(false);

  const claimableTokens = useMemo(() => {
    return tokens.filter(({ stakedAt }) => {
      const staked = getUTCDate(Number(stakedAt));
      const curfew = addMilliseconds(
        staked,
        Number(staking?.min_staking_period)
      );
      return true;
      //return curfew.getTime() < new Date().getUTCDate();
    });
  }, [staking?.min_staking_period, tokens]);

  const onSelectChange = (token: Token) => {
    if (selectedUnstakeTokens.includes(token))
      setSelectedUnstakeTokens([
        ...selectedUnstakeTokens.filter((selected) => selected != token),
      ]);
    else setSelectedUnstakeTokens([...selectedUnstakeTokens, token]);
  };

  const onSelectStakableChange = (token: Token) => {
    if (selectedStakableTokens.includes(token))
      setSelectedStakableTokens([
        ...selectedStakableTokens.filter((selected) => selected != token),
      ]);
    else setSelectedStakableTokens([...selectedStakableTokens, token]);
  };

  function selectAllTokens() {
    if (selectedUnstakeTokens.length == tokens.length)
      setSelectedUnstakeTokens([]);
    else setSelectedUnstakeTokens([...tokens]);
  }

  function selectAllStakableTokens() {
    if (selectedStakableTokens.length == stakableTokens.length)
      setSelectedStakableTokens([]);
    else setSelectedStakableTokens([...stakableTokens]);
  }

  function stakeSelectedStakableTokens() {
    const tokens = selectedStakableTokens.map((token) => token.token_id);

    if (!stakableTokens.length)
      return toast(
        <div className="flex items-center">
          <ExclamationCircleIcon className="h-8 fill-blue stroke-white" />
          You don&apos;t have NFTs on your wallet to stake
        </div>
      );

    if (!selectedStakableTokens.length)
      return toast(
        <div className="flex items-center">
          <ExclamationCircleIcon className="h-8 fill-blue stroke-white" />
          You need to select the NFTs
        </div>
      );

    stake(selector, accountId!, collection, tokens).catch(() =>
      toast(
        <div className="flex items-center">
          <XCircleIcon className="h-8 fill-red stroke-white" />
          Something went wrong!
        </div>
      )
    );
  }

  function onUnstakeSelectedTokens() {
    if (!selectedUnstakeTokens.length)
      return toast(
        <div className="flex items-center">
          <ExclamationCircleIcon className="h-8 fill-blue stroke-white" />
          You need to select the NFTs
        </div>
      );
    showConfirmUnstakeModal(true);
  }

  function unstakeSelectedTokens() {
    unstake(selector, accountId!, selectedUnstakeTokens, collection).catch(() =>
      toast(
        <div className="flex items-center">
          <XCircleIcon className="h-8 fill-red stroke-white" />
          Something went wrong!
        </div>
      )
    );
  }

  function claimAllRewards() {
    claimRewards(selector, accountId!, claimableTokens, collection).catch(() =>
      toast(
        <div className="flex items-center">
          <XCircleIcon className="h-8 fill-red stroke-white" />
          Something went wrong!
        </div>
      )
    );
  }

  const nftStakingProjectProps = {
    id,
    tokens,
    claimableTokens,
    accountId,
    selectedTokens: selectedUnstakeTokens,
    selectedStakableTokens,
    selectingMode,
    connectWallet,
    collection: {
      id: collection,
      logo: staking?.collection_image,
      name: staking?.collection_meta.name,
      curfew: staking?.min_staking_period,
      penalty: staking?.early_withdraw_penalty,
      rewards: staking?.rewards,
    },
    stakableTokens: stakableTokens ? stakableTokens : [],
    selectToStakeModal,
    confirmUnstakeModal,
    showSelectToStakeModal: (show: boolean) => {
      setSelectedStakableTokens([]);
      showSelectToStakeModal(show);
    },
    showConfirmUnstakeModal,
    onSelectChange,
    onSelectStakableChange,
    selectAllTokens,
    selectAllStakableTokens,
    onUnstakeSelectedTokens,
    unstakeSelectedTokens,
    stakeSelectedStakableTokens,
    setSelectingMode: (show: boolean) => {
      setSelectedUnstakeTokens([]);
      setSelectingMode(show);
    },
    claimAllRewards,
    actionsLoading,
    stakingLoading,
    stakableLoading,
  };

  return <NFTStakingProjectComponent {...nftStakingProjectProps} />;
}

export default NFTStakingProject;
