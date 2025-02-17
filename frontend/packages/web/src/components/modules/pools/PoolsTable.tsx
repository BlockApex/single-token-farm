import { Text } from "@chakra-ui/react";
import { Chevron } from "@/assets/svg/chevron";
import { TableBody, Td } from "@/components/shared";
import PoolsHeader from "./PoolsHeader";
import PoolsRow from "./PoolsRow";
import { useNavigate } from "react-router";

interface PoolsTableProps {
  pools: any[];
  handleSort: (key: string) => void;
  sort: { key: string; order_by: string };
}

const PoolsTable = ({ pools, handleSort, sort }: PoolsTableProps) => {
  const navigate = useNavigate();
  const styleKey = (key: string, sort: any) => {
    return sort.key === key ? "text-[#CD7FF0]" : "text-white";
  };

  const showChevron = (key: string, sort: any) => {
    return sort.key !== key ? (
      ""
    ) : sort.order_by === "desc" ? (
      <Chevron className="ml-2" />
    ) : (
      <Chevron className="ml-2 rotate-180" />
    );
  };
  return (
    <div className="w-full pb-4">
      <PoolsHeader>
        <Td className="">
          <div
            className={`text-white font-semibold text-sm flex items-center cursor-pointer`}
          >
            Pair 
          </div>
        </Td>
        <Td className="hidden md:block">
          <></>
        </Td>
        <Td className="">
          <div
            onClick={() => handleSort("total_fee")}
            className={`${styleKey(
              "total_fee",
              sort
            )} font-semibold text-sm flex items-center cursor-pointer`}
          >
            Fee
            {showChevron("total_fee", sort)}
          </div>
        </Td>
        <Td className="hidden md:block">
          <div
            onClick={() => handleSort("APR")}
            className={`${styleKey(
              "APR",
              sort
            )} font-semibold text-sm flex items-center cursor-pointer`}
          >
            APR
            {showChevron("APR", sort)}
          </div>
        </Td>
        <Td className="hidden lg:block">
          <div
            onClick={() => handleSort("volume_24h")}
            className={`${styleKey(
              "volume_24h",
              sort
            )} font-semibold text-sm flex items-center cursor-pointer`}
          >
            Volume (24h)
            {showChevron("volume_24h", sort)}
          </div>
        </Td>
        <Td className="hidden lg:block">
          <div
            onClick={() => handleSort("TVL")}
            className={`${styleKey(
              "TVL",
              sort
            )} font-semibold text-sm flex items-center cursor-pointer`}
          >
            TVL
            {showChevron("TVL", sort)}
          </div>
        </Td>
        <Td className="hidden lg:block">
          <></>
        </Td>
      </PoolsHeader>
      <TableBody>
        {pools.length ? (
          pools.map((pool: any, i: number) => {
            return <PoolsRow pool={pool} key={i} />;
          })
        ) : (
          <div className="flex items-center justify-center mt-8" >
            <Text fontWeight="extrabold">No Data Found</Text>
          </div>
        )}
      </TableBody>
    </div>
  );
};

export default PoolsTable;
