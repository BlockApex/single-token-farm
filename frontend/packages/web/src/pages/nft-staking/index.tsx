import { Tab } from "@headlessui/react";
import { useNavigate } from "react-router";
import { TopCard, NFTStakingCard, Empty, Button } from "@/components";
import isEmpty from "lodash/isEmpty";
import { useQuery } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";
import {
  NftStakingProjectsConnectionDocument,
  NftStakingProjectsConnectionQueryVariables,
  StakedEnum,
} from "@near/apollo";
import { useWalletSelector } from "@/context/wallet-selector";
import { twMerge } from "tailwind-merge";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import PageContainer from "@/components/PageContainer";
import { viewMethod } from "@/helper/near";
import { useNftStaking } from "@/stores/nft-staking-store";

const PAGINATE_LIMIT = 30;

export const NFTStaking = () => {
  const navigate = useNavigate();

  const [filterStaked, setStaked] = useState<StakedEnum | null>(null);
  const [filterSearch, setSearch] = useState<string | null>(null);
  const { accountId, selector } = useWalletSelector();
  const [isStakedProjects, setIsStakedProjects] = useState<any | null>(null);
  /* const queryVariables: NftStakingProjectsConnectionQueryVariables =
    useMemo(() => {
      return {
        limit: PAGINATE_LIMIT,
        accountId: accountId ?? "",
        showStaked: filterStaked,
        search: filterSearch,
      };
    }, [filterSearch, filterStaked]); */

  const {
    data: nftProjects,
    loading,
    refetch,
  } = useQuery(NftStakingProjectsConnectionDocument, {
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (isEmpty(nftProjects)) return;
    if (!accountId) return;
    const collectionIds = nftProjects?.nft_staking_projects?.data?.map(
      (project) => project.collection_id
    );

    const promises = collectionIds.map(async (collectionId) => {
      const isStaked = await viewMethod(
        import.meta.env.VITE_NFT_STAKING_CONTRACT,
        "view_staked",
        {
          account_id: accountId,
          collection: {
            type: "NFTContract",
            account_id: collectionId,
          },
          from_index: 0,
          limit: 1,
        }
      );
      return {
        [collectionId]: isStaked.length > 0,
      };
    });
    Promise.all(promises).then((results) => {
      const isStakedProjects = results.reduce((acc, cur) => {
        return {
          ...acc,
          ...cur,
        };
      }, {});
      setIsStakedProjects(isStakedProjects);
    });
  }, [nftProjects, accountId]);
  /* useEffect(() => {
    (async () => {
      await refetch({
        ...queryVariables,
        offset: 0,
      });
    })();
  }, [queryVariables]); */

  const stepItems = [
    {
      element: ".projects-list",
      title: "Staking Pools",
      intro: (
        <div>
          <span>
            In this page you can see a list of all the staking pools available
            to stake your NFT assets.
          </span>
        </div>
      ),
    },
    {
      element: ".projects-card",
      title: "Project Pool",
      intro: (
        <div>
          <span>
            The project card displays all the rewards you can get per month if
            you stake in.
          </span>
        </div>
      ),
    },
  ];

  const renderProjectCard = (staking, index) => {
    return (
      <NFTStakingCard
        key={"nft-staking-collection" + index}
        className="hover:opacity-80"
        onClick={() =>
          navigate(`/nft-staking/${window.btoa(staking?.collection_id)}`)
        }
        logo={staking?.collection_image}
        name={staking?.collection_meta?.name}
        rewards={staking?.rewards}
        collection={staking?.collection_id}
        shouldDivide={true}
        collectionId={staking?.collection_id}
      />
    );
  };

  const renderStakingPools = () => {
    if (!isEmpty(nftProjects))
      return nftProjects?.nft_staking_projects?.data
        ?.filter((project) => project.active !== false)
        .map(renderProjectCard);
    if (!loading) return <Empty text="No collections available" />;
    return <NFTStakingCard collectionId="" />;
  };

  const renderStakedPools = () => {
    if (!isStakedProjects) return <NFTStakingCard collectionId="" />;
    if (!isEmpty(nftProjects))
      return nftProjects?.nft_staking_projects?.data
        ?.filter((project) => isStakedProjects[project.collection_id])
        .map(renderProjectCard);
    if (!loading) return <Empty text="No collections available" />;
    return <NFTStakingCard collectionId="" />;
  };

  const renderTab = ({ selected }, title) => {
    const style = selected
      ? "bg-white-500 font-bold"
      : "bg-transparent font-normal hover:bg-[#FFFFFF0D]";
    return (
      <Button
        className={twMerge(
          "font-bold leading-4 text-4 tracking-tight p-2.5 outline-none",
          style
        )}
      >
        {title}
      </Button>
    );
  };

  const renderSearchbar = () => {
    return (
      <div className="relative h-min">
        <input
          type="text"
          placeholder="Search project"
          className="placeholder:text-white-400 w-full lg:w-[354px] text-white bg-white-500 rounded-sm border-0 m-0 leading-[16px] text-3.5 py-3 pl-4 pr-12"
          name="search"
          onInput={(e) => setSearch(e.currentTarget.value)}
          id="search"
        />
        <button
          type={"submit"}
          className="absolute inset-0 left-auto px-4 flex justify-center items-center hover:stroke-white-300"
        >
          <MagnifyingGlassIcon className="fill-white-300 w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <PageContainer>
      <TopCard
        gradientText="NFT Staking"
        bigText="Jump NFT Staking"
        bottomDescription={`
          Welcome to Jump NFT Staking; the portal between NFT technology and decentralized finance on NEAR Protocol!
        `}
        jumpLogo
        stepItems={stepItems}
      />

      <Tab.Group
        onChange={(index) =>
          setStaked(index == 0 ? StakedEnum.No : StakedEnum.Yes)
        }
      >
        <div className="flex flex-wrap justify-between w-full gap-y-4">
          <Tab.List className="flex gap-10 w-full lg:w-auto">
            <Tab as="div" className="outline-none">
              {(props) => renderTab(props, "Staking pools")}
            </Tab>
            {accountId && (
              <Tab as="div" className="outline-none">
                {(props) => renderTab(props, "My staked pools")}
              </Tab>
            )}
          </Tab.List>
          {renderSearchbar()}
        </div>

        <Tab.Panels>
          <Tab.Panel>
            <div className="ProjectList space-y-[24px]">
              {renderStakingPools()}
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="ProjectList space-y-[24px]">
              {renderStakedPools()}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </PageContainer>
  );
};

export default NFTStaking;