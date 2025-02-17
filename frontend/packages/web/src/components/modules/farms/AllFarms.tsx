import React, { useEffect } from "react";
import FarmContainer from "@/components/modules/farms/FarmContainer";
import Farm from "./Farm";
import { Skeleton, Text, Spinner } from "@chakra-ui/react";
import { useGetFarms } from "@/hooks/modules/farms";

const AllFarms = ({ search, createdBy, whitelist, accountId }) => {
  const { farms, loading, error, hasMore, loadMore } = useGetFarms(search, accountId, createdBy, false, whitelist);


  // console.log(farms, loading, error, hasMore, 'HELLO NEW FARMS IMPLEMENTATION........' )

  // Infinite scroll logic
  useEffect(() => {
    const handleScroll = () => {
      if (farms && farms.length) {
        const scrollTop = document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        // Check if the user has scrolled near the bottom of the page
        if (scrollTop + clientHeight >= scrollHeight - 50) {
          if (hasMore && !loading) {
            loadMore();
          }
        }

      }
    };

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Clean up the scroll event listener on unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hasMore, loading, loadMore]);


  return (
    <FarmContainer>
      <div className="p-4">
        {farms && farms.length ? (
          farms.map((farm, i) => {
            return <Farm key={i} farm={farm} />;
          })
        ) : (
          ""
        )}
        {accountId && farms && !farms.length && !loading ? (
          <div className="flex items-center justify-center mt-8">
            <Text fontWeight="extrabold">No Data Found</Text>
          </div>
        ) : (
          ""
        )}
        {!accountId ? (
                    <div className="flex items-center justify-center mt-8">
                    <Text fontWeight="extrabold">PLEASE CONNECT WALLET</Text>
                  </div>
        ):""}
        {loading ? (
          <div className="w-full flex items-center justify-center p-12">
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
    </FarmContainer>
  );
};

export default AllFarms;
