import { FarmIcon } from "./assets/svg/farm";
import { PoolsIcon } from "./assets/svg/pools";
import { RocketIcon } from "./assets/svg/rocket";
import { LockIcon } from "./assets/svg/lock";
import { SwapIcon } from "./assets/svg/swap";
import { AnalyticsIcon } from "./assets/svg/analytics";
import { StakingIcon } from "./assets/svg/nft-staking-icon";
import { XJumpIcon } from "./assets/svg/xjump-icon";
import { TokenLabIcon } from "./assets/svg/token-lab-icon";

export const navRoutes = [
  {
    enabled: true,
    title: "Jump Pad",
    icon: <RocketIcon />,
    route: "/",
    subroutePrefix: "/",
  },
  {
    enabled: true,
    title: "xJUMP",
    icon: <XJumpIcon />,
    route: "/telos/coin-staking",
    subroutePrefix: "coin-staking",
  },
  {
    enabled: true,
    title: "NFT Staking",
    icon: <StakingIcon />,
    route: "/telos/nft-staking",
    subroutePrefix: "nft-staking",
  },
  {
    enabled: true,
    title: "Bridge",
    icon: <SwapIcon />,
    route: "/telos/bridge",
    subroutePrefix: "bridge",
  },
  {
    enabled: true,
    title: "Jump Vesting",
    icon: <LockIcon />,
    route: "/telos/vesting",
    subroutePrefix: "vesting",
  },
  {
    enabled: true,
    title: "Token Laboratory",
    icon: <TokenLabIcon />,
    route: "/telos/token-launcher",
    subroutePrefix: "token-launcher",
  },
  {
    enabled: true,
    title: "Swap",
    icon: <SwapIcon />,
    route: "/telos/swap",
    subroutePrefix: "swap",
  },
  {
    enabled: true,
    title: "Pools",
    icon: <PoolsIcon />,
    route: "/telos/pools",
    subroutePrefix: "pools",
  },

  {
    enabled: true,
    title: "Farm",
    icon: <FarmIcon />,
    route: "/telos/farm",
    subroutePrefix: "farm",
  },
  {
    title: "Analytics",
    icon: <AnalyticsIcon />,
    route: "/telos/analytics",
    subroutePrefix: "analytics",
  },
];