import React, { useState } from "react";
import Header from "./Header";
import { Skeleton, Text, Spinner } from "@chakra-ui/react";
import MyLiquidityTable from "./MyLiquidityTable";
import PoolContainer from "@/components/modules/pools/PoolContainer";
import { Pagination } from "@/components/shared";
import { useGetUserPools } from "@/hooks/modules/pools";

const SORT_TYPE = {
  ASC: "asc",
  DESC: "desc",
};

const MyLiquidity = ({ search, accountId }) => {
  const [page, setPage] = useState(0);
  const [hidePools, setHidePools] = useState(false);
  const [farmsAvailable, setfarmsAvailable] = useState(false);
  const [createdBy, setCreatedBy] = useState(false);

  const [sort, setSort] = useState<{ key: string; order_by: string }>({
    key: "",
    order_by: "",
  });

  const { pools, error, loading, count } = useGetUserPools(
    page,
    farmsAvailable,
    sort,
    search,
    accountId
  );

  const handleSort = (key: string) => {
    let sortCopy = { ...sort };
    if (sortCopy.key === key) {
      if (sortCopy.order_by === SORT_TYPE.DESC) {
        sortCopy = { key, order_by: SORT_TYPE.ASC };
      } else {
        sortCopy = { key, order_by: SORT_TYPE.DESC };
      }
      setSort(sortCopy);
    } else {
      sortCopy = { key, order_by: SORT_TYPE.DESC };
      setSort(sortCopy);
    }
  };

  return (
    <>
      <PoolContainer>
        <Header
          title="My Liquidity"
          tab="liquidity"
          hidePools={hidePools}
          farmsAvailable={farmsAvailable}
          createdBy={createdBy}
          setCreatedBy={(c) => setCreatedBy(c)}
          setHidePools={(c) => setHidePools(c)}
          setfarmsAvailable={(c) => setfarmsAvailable(c)}
          showFav={false}
          setShowFav={() => null}
          showFilter={accountId ? true : false}
        />
        {accountId ? (
          <div className="w-full h-auto px-4 md:px-6">
            {!loading && pools ? <MyLiquidityTable pools={pools} /> : ""}
            {loading ? (
              <div className="w-full flex items-center justify-center pb-14">
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="#4b2354"
                  size="xl"
                />
              </div>
            ) : (
              ""
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center mt-8 pb-8">
            <Text fontWeight="extrabold">Connect your wallet</Text>
          </div> 
        )}
        {error ? (
          <div className="flex items-center justify-center mt-8 pb-8">
          <Text fontWeight="extrabold" color='red'>{error}</Text>
        </div> 
        ) : ''}
      </PoolContainer>
      {count > 0 ? (
        <Pagination
          pageCount={count / 10}
          onPageChange={(page) => setPage(page.selected)}
          currentPage={page}
        />
      ) : (
        ""
      )}
    </>
  );
};

export default MyLiquidity;
