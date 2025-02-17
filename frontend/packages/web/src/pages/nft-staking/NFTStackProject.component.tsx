import { useMemo, ReactNode, useEffect, useState } from "react";
import { NFTStakingCard, BackButton, Button, Empty } from "@/components";
import isEmpty from "lodash/isEmpty";
import { StakingToken, Token } from "@near/ts";
import { Tutorial } from "@/components";
import { Tab } from "@headlessui/react";
import { ListBulletIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import Select from "@/components/Select";
import NFTCard from "@/components/NFTCard";
import { STEPS_ITEMS } from "./NFTStakingProject.config";
import Big from "big.js";
import ConfirmModal from "@/components/ConfirmModal";
import Modal from "@/components/Modal";
import PageContainer from "@/components/PageContainer";
import { useNftMetadata } from "@/hooks/modules/NftStaking";
import { NftStorageConfirmModal } from "@/components/modules/nft/nft-storage-deposit-confirm-modal";
import { viewMethod } from "@/helper/near";

type NFTStakingProjectProps = {
  id: string;
  tokens: Token[];
  claimableTokens: Token[];
  accountId: string | null;
  selectingMode: boolean;
  selectedTokens: Token[];
  selectedStakableTokens: Token[];
  connectWallet: () => void;
  collection: {
    id: string;
    logo: string;
    name: string;
    curfew: string;
    penalty: string;
    rewards: StakingToken[];
  };
  stakableTokens: Token[];
  selectToStakeModal;
  confirmUnstakeModal;
  showSelectToStakeModal;
  showConfirmUnstakeModal;
  onSelectChange: (token: Token) => void;
  onSelectStakableChange: (token: Token) => void;
  selectAllTokens: () => void;
  selectAllStakableTokens: () => void;
  onUnstakeSelectedTokens: () => void;
  unstakeSelectedTokens: () => void;
  stakeSelectedStakableTokens: () => void;
  setSelectingMode: (enable: boolean) => void;
  claimAllRewards: () => void;
  actionsLoading: boolean;
  stakingLoading: boolean;
  stakableLoading: boolean;
};

export function NFTStakingProjectComponent(props: NFTStakingProjectProps) {
  const {
    tokens,
    claimableTokens,
    accountId,
    selectingMode,
    selectedTokens,
    selectedStakableTokens,
    connectWallet,
    collection,
    stakableTokens,
    selectToStakeModal,
    confirmUnstakeModal,
    showSelectToStakeModal,
    showConfirmUnstakeModal,
    onSelectChange,
    onSelectStakableChange,
    selectAllTokens,
    selectAllStakableTokens,
    onUnstakeSelectedTokens,
    unstakeSelectedTokens,
    stakeSelectedStakableTokens,
    setSelectingMode,
    claimAllRewards,
    actionsLoading,
  } = props;

  const stepItems = useMemo(() => {
    return STEPS_ITEMS(tokens).filter((item) => item);
  }, [tokens]);

  const { nftMetadata, loading: NftMetadataLoading } = useNftMetadata(
    collection.id
  );
  const [nftStorageDepositModal, setNftStorageDepositModal] = useState(false);

  function handleStake() {
    if (!window.localStorage.getItem("shownStorageWarning")) {
      setNftStorageDepositModal(true);
    } else {
      stakeSelectedStakableTokens();
    }
  }

  function renderSelectToStakeModalFooter() {
    const length = selectedStakableTokens.length;

    return (
      <div className="w-full flex justify-between items-center">
        <Button
          outline
          onClick={() => showSelectToStakeModal(false)}
          className="text-purple border-purple w-fit h-fit px-5 py-2"
        >
          Cancel
        </Button>
        <div className="flex gap-x-6 items-center">
          <span className="text-black text-3.5 tracking-tight leading-4 font-semibold">
            <strong className="font-extrabold">{length}</strong> NFT
            {length == 1 ? "" : "s"} selected
          </span>
          <Button
            onClick={handleStake}
            inline
            className="bg-gradient-to-r from-[#510B72] to-[#740B0B] rounded-md px-6 py-2.5"
          >
            Stake
          </Button>
        </div>
      </div>
    );
  }

  function renderSelectToStakeModal() {
    return (
      <Modal
        open={selectToStakeModal}
        title="Stake NFTs"
        onClose={() => showSelectToStakeModal(false)}
        footer={renderSelectToStakeModalFooter()}
        className="px-8 w-[620px] overflow-y-scroll h-[335px]"
      >
        {stakableTokens.length ? (
          <>
            <div className="w-full flex justify-end">
              <Button
                inline
                onClick={selectAllStakableTokens}
                className="pt-4 text-3.5 font-semibold text-purple-100 tracking-tight"
              >
                {selectedStakableTokens.length == stakableTokens.length
                  ? "Unselect all"
                  : "Select all"}
              </Button>
            </div>
            <div className="grid gap-4 grid-cols-3">
              {stakableTokens.map((token, key) => {
                return (
                  <Select
                    key={key}
                    showCheckbox={true}
                    selected={selectedStakableTokens.includes(token)}
                    onChange={() => onSelectStakableChange(token)}
                    small={true}
                  >
                    <NFTCard
                      rewards={collection.rewards}
                      curfew={collection.curfew}
                      penalty={collection.penalty}
                      minified={true}
                      img={parseImageUrl(
                        nftMetadata?.base_uri,
                        token.metadata.media
                      )}
                      {...token}
                      collection_id={collection.id}
                    />
                  </Select>
                );
              })}
            </div>
          </>
        ) : (
          <Empty className="w-[551px] h-[336px] text-purple">
            <p>You don&apos;t have any NFTs on your Wallet</p>
          </Empty>
        )}
      </Modal>
    );
  }

  function renderConfirmUnstakeModal() {
    const amountMessage =
      selectedTokens.length == tokens.length
        ? "all NFTs"
        : selectedTokens.length == 1
          ? "1 NFT"
          : selectedTokens.length + " NFTs";

    return (
      <ConfirmModal
        message={<>Are you sure you want to unstake {amountMessage}?</>}
        open={confirmUnstakeModal}
        onClose={() => showConfirmUnstakeModal(false)}
        className="flex justify-center gap-6"
      >
        <Button
          onClick={() => showConfirmUnstakeModal(false)}
          big
          className="w-[131px] min-w-[131px] px-0 py-4"
        >
          Cancel
        </Button>
        <Button
          outline
          big
          className="border-purple text-purple w-[131px] min-w-[131px] px-0 py-4"
          onClick={unstakeSelectedTokens}
        >
          Unstake
        </Button>
      </ConfirmModal>
    );
  }

  function renderStakedNFTsList(minified: boolean) {
    return tokens.map((token, index) => {
      return (
        <Select
          key={index}
          showCheckbox={selectingMode}
          selected={selectedTokens.includes(token)}
          onChange={() => selectingMode && onSelectChange(token)}
        >
          <NFTCard
            {...token}
            minified={minified}
            curfew={collection.curfew}
            penalty={collection.penalty}
            rewards={collection.rewards}
            img={parseImageUrl(nftMetadata?.base_uri, token.metadata.media)}
            collection_id={collection.id}
          />
        </Select>
      );
    });
  }

  function renderStakedNFTsNoStakedNFTs() {
    return (
      <Empty className="pt-8 pb-32 px-6 h-min gap-y-6">
        <h2 className="text-6 font-extrabold tracking-tight leading-6">
          No NFTs staked
        </h2>
        <Button
          disabled={!accountId}
          onClick={() => showSelectToStakeModal(true)}
          big
        >
          Stake NFTs
        </Button>
      </Empty>
    );
  }

  function renderStakedList(minified: boolean) {
    return (
      (!accountId && renderYourRewardsConnectWallet()) ||
      (isEmpty(tokens) && renderStakedNFTsNoStakedNFTs()) ||
      (!isEmpty(tokens) && renderStakedNFTsList(minified))
    );
  }

  function renderSelectingButtons() {
    const selectAllText =
      selectedTokens.length == tokens.length ? "Unselect All" : "Select All";

    if (!tokens.length || !selectingMode)
      return (
        <Button
          disabled={!tokens.length}
          onClick={() => setSelectingMode(true)}
        >
          Select to unstake
        </Button>
      );

    return (
      <div className="flex gap-4">
        <Button inline onClick={() => setSelectingMode(false)}>
          Cancel
        </Button>
        <Button onClick={selectAllTokens}>{selectAllText}</Button>
        <Button onClick={onUnstakeSelectedTokens}>Unstake selected</Button>
      </div>
    );
  }

  function renderStakedModeButton(icon: ReactNode) {
    return (
      <Tab as="div" className="outline-none">
        {({ selected }) => (
          <Button
            white={selected}
            className={`p-2.5 outline-none ${selected ? "hover:opacity-100" : "bg-white-600"
              }`}
          >
            {icon}
          </Button>
        )}
      </Tab>
    );
  }

  function renderStackedPanel() {
    return (
      <Tab.Group>
        <div className="flex justify-between">
          <Tab.List className="flex gap-4 ">
            {renderStakedModeButton(
              <ListBulletIcon className="h-6 text-current" />
            )}
            {renderStakedModeButton(
              <Squares2X2Icon className="h-6 text-current" />
            )}
          </Tab.List>

          {renderSelectingButtons()}
        </div>
        <Tab.Panels>
          <Tab.Panel className="mt-8 mb-6 gap-4 grid grid-cols-1">
            {renderStakedList(false)}
          </Tab.Panel>
          <Tab.Panel className="mt-16 mb-6 mx-8 grid grid-cols-4 gap-16">
            {renderStakedList(true)}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    );
  }

  function renderYourRewardsConnectWallet() {
    return (
      <Empty className="pt-8 pb-32 px-6 h-min gap-y-6">
        <h2 className="text-6 font-extrabold tracking-tight leading-6">
          Connect your Wallet
        </h2>
        <Button white onClick={connectWallet} big>
          Connect Wallet
        </Button>
      </Empty>
    );
  }

  function renderYourRewardsNoStakedNFTs() {
    return (
      <Empty className="pt-8 pb-32 px-6 h-min gap-y-6">
        <h2 className="text-6 font-extrabold tracking-tight leading-6">
          You still don’t have NFTs staked!
        </h2>
        <Button
          disabled={!accountId}
          onClick={() => showSelectToStakeModal(true)}
          big
        >
          Stake NFTs
        </Button>
      </Empty>
    );
  }

  function renderYourRewardsWaitStakedNFTs() {
    return (
      <Empty className="pt-8 pb-32 px-6 h-min gap-y-2.5">
        <h2 className="text-6 font-extrabold tracking-tight leading-6 text-center line-clamp-3">
          Your staked NFTs will be here
        </h2>
        <h2 className="text-6 font-extrabold tracking-tight leading-6 text-center line-clamp-3">
          to claim soon! :)
        </h2>
      </Empty>
    );
  }

  function renderYourRewardsList() {
    const token = {
      metadata: { title: "", media: "", description: "" },
      penalty: "0",
    } as unknown as Token;
    const tokens = actionsLoading ? [token, token] : claimableTokens;

    return (
      <div className="mt-6 flex flex-col gap-y-8">
        {tokens.map((token, index) => (
          <NFTCard
            {...token}
            key={index}
            minified={false}
            curfew={collection.curfew}
            penalty={collection.penalty}
            rewards={collection.rewards}
            img={parseImageUrl(nftMetadata?.base_uri, token.metadata.media)}
            collection_id={collection.id}
          />
        ))}
      </div>
    );
  }

  function renderYourRewardsPanel() {
    // Sums all balances of claimable tokens/NFTs per reward
    const rewards = collection.rewards
      ? collection.rewards.map((reward) => ({
        ...reward,
        perMonth: tokens
          .reduce(
            (sum: Big, token) =>
              sum.add(token.balance[reward?.account_id] || "0"),
            Big("0")
          )
          .toString(),
      }))
      : [{} as StakingToken, {} as StakingToken, {} as StakingToken];
    return (
      <>
        <NFTStakingCard
          logoless
          name="Total Rewards"
          rewards={rewards}
          wallet={accountId ? undefined : "Connect Wallet"}
          onClick={accountId ? undefined : connectWallet}
          collection={collection.id}
          shouldDivide={false}
          includeInnerBalance={true}
          collectionId={collection.id}
        />

        <div className="rounded-lg bg-white-600 p-6">
          <div className="flex flex-col gap-y-3 items-start">
            <h3 className="font-extrabold text-5 tracking-tight leading-5">
              Available to claim
            </h3>
            <Button
              className="self-end"
              disabled={!accountId}
              onClick={claimAllRewards}
              big
            >
              Claim All
            </Button>
          </div>
          {(actionsLoading && renderYourRewardsList()) ||
            (!accountId && renderYourRewardsConnectWallet()) ||
            (!tokens.length && renderYourRewardsNoStakedNFTs()) ||
            (!claimableTokens.length && renderYourRewardsWaitStakedNFTs()) ||
            (claimableTokens.length && renderYourRewardsList())}
        </div>
      </>
    );
  }

  function renderTabButton(selected, title, length?: number) {
    const style = selected
      ? "bg-white-500 font-bold hover:opacity-100"
      : "bg-transparent font-normal hover:bg-[#FFFFFF0D] hover:opacity-100";

    return (
      <Button
        inline
        className={`font-bold leading-4 text-4 tracking-tight p-2.5 outline-none ${style}`}
      >
        {title}
        {typeof length == "number" ? (
          <span className="ml-2 py-[1px] px-1 bg-white rounded-full font-semibold text-3.5 leading-4 text-black">
            {length}
          </span>
        ) : null}
      </Button>
    );
  }

  function renderTabButtons(title: string, length?: number) {
    return (
      <Tab as="div" className="outline-none">
        {({ selected }) => renderTabButton(selected, title, length)}
      </Tab>
    );
  }

  function renderStakeButton() {
    return (
      <Button
        disabled={!accountId}
        onClick={() => showSelectToStakeModal(true)}
        big
        className={accountId ? "" : "invisible"}
      >
        Stake NFTs
      </Button>
    );
  }
  return (
    <PageContainer>
      {renderSelectToStakeModal()}
      {renderConfirmUnstakeModal()}

      <BackButton href="/nft-staking">Back to NFTs Staking</BackButton>

      <div className="relative">
        <NFTStakingCard
          collectionId={collection.id}
          logo={collection.logo}
          name={collection.name}
          rewards={collection.rewards}
          collection={collection.id}
          shouldDivide={true}
        />
        <Tutorial items={stepItems as []} />
      </div>

      <div>
        <div className="flex justify-end mb-2">{renderStakeButton()}</div>

        <Tab.Group>
          <Tab.List className="flex gap-10 mb-12">
            {renderTabButtons("Your rewards")}
            {renderTabButtons("Staked NFTs", tokens.length)}
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel className="space-y-8">
              {renderYourRewardsPanel()}
            </Tab.Panel>
            <Tab.Panel className="space-y-8">{renderStackedPanel()}</Tab.Panel>
          </Tab.Panels>
          <div className="h-20"></div>
        </Tab.Group>
      </div>
      <NftStorageConfirmModal
        isOpen={nftStorageDepositModal}
        handleClose={() => setNftStorageDepositModal(false)}
        stakeSelectedStakableTokens={stakeSelectedStakableTokens}
      />
    </PageContainer>
  );
}

export default NFTStakingProjectComponent;
function parseImageUrl(baseUrl: string | undefined, imageUrl: string) {
  if (!baseUrl) {
    if (imageUrl.includes("/")) {
      return "https://dweb.link/ipfs/" + imageUrl;
    }
    return imageUrl;
  }

  if (baseUrl.endsWith("/")) return baseUrl + imageUrl;

  return baseUrl + "/" + imageUrl;
}