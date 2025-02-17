import isEmpty from "lodash/isEmpty";

export const STEPS_ITEMS = (tokens) => [
  {
    element: ".nft-staking-card",
    title: "NFT Staking",
    intro: (
      <div>
        <span>
          Here is the NFT Staking Project Page, the card displays all the
          rewards you can get per month if you stake your NFT&apos;s.
        </span>
      </div>
    ),
  },
  {
    title: "Your Position",
    element: ".nft-position",
    intro: (
      <div className="flex flex-col">
        <span>
          In this session you have access to all the rewards available to be
          redeemed.
        </span>
      </div>
    ),
  },
  {
    title: "User Area",
    element: ".nft-user",
    intro: (
      <div className="flex flex-col">
        <span>
          This is the user area, here you will be able to stake/unstake your
          NFT&apos;S and redeem all available rewards.
        </span>
      </div>
    ),
  },
  !isEmpty(tokens) && {
    title: "Staked NFT's",
    element: ".nft-staked",
    intro: (
      <div className="flex flex-col">
        <span>Here you can find all your staked NFT&apos;s.</span>
      </div>
    ),
  },
];

export default STEPS_ITEMS;
