import React, { useState } from "react";
import Header from "./Header";
import PoolsTable from "./PoolsTable";
import PoolContainer from "@/components/modules/pools/PoolContainer";
import { Spinner, Text } from "@chakra-ui/react";
import { Pagination } from "@/components/shared";
import { useGetPools } from "@/hooks/modules/pools";

const SORT_TYPE = {
  ASC: "asc",
  DESC: "desc",
};

const PoolList = ({ search, accountId }) => {
  const [page, setPage] = useState(0);
  const [farmsAvailable, setfarmsAvailable] = useState(false);
  const [hidePools, setHidePools] = useState(false);
  const [showFav, setShowFav] = useState(false);
  const [createdBy, setCreatedBy] = useState(false);


  const [sort, setSort] = useState<{ key: string; order_by: string }>({
    key: "",
    order_by: "",
  });

  const { pools, error, loading, count } = useGetPools(page, farmsAvailable, sort, search, showFav, createdBy ? accountId : "");


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
          hidePools={hidePools}
          farmsAvailable={farmsAvailable}
          createdBy={createdBy}
          setCreatedBy={(c) => setCreatedBy(c)}
          setHidePools={(c) => setHidePools(c)}
          setfarmsAvailable={(c) => setfarmsAvailable(c)}
          showFav={showFav}
          showFilter={accountId ? true : false}
          setShowFav={(show: boolean) => {
            setPage(0)
            setShowFav(show)
          }}
          title="Pools"
          tab="pools"
        />
        <div className="w-full h-auto px-4 md:px-6">
          {!loading && pools ? (
            <PoolsTable sort={sort} handleSort={handleSort} pools={pools} />
          ) : (
            ""
          )}
          {loading ? (
            <div className="w-full h-full flex items-center justify-center pb-14 mt-8">
              <Spinner
                thickness='4px'
                speed='0.65s'
                emptyColor='gray.200'
                color='#4b2354'
                size='xl'
              />
            </div>
          ) : (
            ""
          )}
          {error ? (
            <div className="flex items-center justify-center mt-8 pb-8">
              <Text fontWeight="extrabold" color='red'>{error}</Text>
            </div>
          ) : ''}
        </div>
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

export default PoolList;
