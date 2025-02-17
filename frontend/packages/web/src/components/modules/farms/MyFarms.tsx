import React from "react";
import FarmContainer from "@/components/modules/farms/FarmContainer";
import Farm from "./Farm";
import { Skeleton, Text, Spinner } from "@chakra-ui/react";
import { useGetFarms } from "@/hooks/modules/farms";
import { useWalletSelector } from "@/context/wallet-selector";

const MyFarms = ({ search }) => {
  const { accountId } = useWalletSelector();
  const { farms, loading, error } = useGetFarms(search, accountId!, false, true, false);

  return (
    <FarmContainer>
      <div className="p-4">
        {accountId ? (
          <>
            {farms && farms.length
              ? farms.map((farm, i) => {
                return <Farm key={i} farm={farm} />;
              })
              : ""}
            {farms && !farms.length && !loading ? (
              <div className="flex items-center justify-center mt-8">
                <Text fontWeight="extrabold">No Data Found</Text>
              </div>
            ) : (
              ""
            )}
            {loading ? (
              <div className="w-full flex items-center justify-center  p-12">
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
          </>
        ) : (
          <div className="flex items-center justify-center mt-8 pb-8">
            <Text fontWeight="extrabold">
              Connect your wallet to view your farms.
            </Text>
          </div>
        )}
      </div>
    </FarmContainer>
  );
};

export default MyFarms;
