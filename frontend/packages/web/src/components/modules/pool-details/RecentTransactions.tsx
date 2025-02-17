import React from "react";
import { TableBody, Td } from "@/components/shared";
import { Open } from "@/assets/svg";
import { Text } from "@chakra-ui/react";
import { useGetPoolTransactions } from "@/hooks/modules/pools";
import { format } from 'date-fns';
import { Spinner } from "@chakra-ui/react";



const Actions = {
  add_liquidity: "Add Liquidity",
  remove_liquidity: "Remove Liquidity",
  swap: "Swap"
}
const RecentTransactions = ({ id }) => {

  const { transactions, error, loading } = useGetPoolTransactions(id!!);

  return (
    <div className="w-full h-auto rounded-lg bg-white-600 p-6 md:p-8">
      <section className="w-full flex items-center justify-between">
        <h1 className="text-3xl tracking-tighter font-bold leading-6">
          Recent Transactions
        </h1>
      </section>

      <section className="mt-4 md:mt-6">
        <div className="py-1 px-3 grid lg:grid-cols-[1fr_1fr_1fr_1fr] md:grid-cols-[1fr_1fr_1fr_1fr] grid-cols-[2fr_1fr] gap-4">
          <Td className="">
            <div className="text-white font-semibold text-sm">From</div>
          </Td>
          <Td className="">
            <div className="text-white font-semibold text-sm">To</div>
          </Td>
          <Td className="hidden md:flex">
            <div className="text-white font-semibold text-sm">Action</div>
          </Td>

          <Td className="hidden md:flex">
            <div className="text-white font-semibold text-sm">Time</div>
          </Td>
        </div>
        <TableBody>
          {!loading && transactions && transactions.length ? transactions?.slice(0, 6).map((tx: any, i: number) => {
            // Convert tx?.timestamp to a Date object and format it
            const timestamp = tx?.Time ? new Date(tx.Time) : null;
            const formattedDate = timestamp ? format(timestamp, "yyyy-MM-dd HH:mm:ss") : "Invalid date";
            let hashUrl = `https://testnet.nearblocks.io/txns/${tx['Hash']}`

            return (
              <div key={i} className="hover:bg-white-600 transition-all cursor-pointer rounded-md py-1 px-3 grid lg:grid-cols-[1fr_1fr_1fr_1fr] md:grid-cols-[1fr_1fr_1fr_1fr] grid-cols-[2fr_1fr] gap-4 mt-4">
                <Td className="">
                  <div className="text-white font-bold text-md">
                    {tx?.From}
                  </div>
                </Td>
                <Td className="">
                  <div className="text-white font-bold text-md">
                    {tx?.To}
                  </div>
                </Td>
                <Td className="hidden md:flex">
                  <div className="text-white font-bold text-md">
                    {Actions[tx?.Action]}
                  </div>
                </Td>

                <Td className="hidden md:flex">
                  <div className="text-white font-bold text-md">
                    {formattedDate}
                    <a href={hashUrl} target="_blank" >
                      <button className="pl-2">
                        <Open />
                      </button>
                    </a>
                  </div>
                </Td>
              </div>
            );
          }) :
            ""}
          {!loading && transactions && !transactions.length ? (
            <div className="flex items-center justify-center mt-8" >
              <Text fontWeight="extrabold">No Transactions Found</Text>
            </div>
          ) : ""}

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
        </TableBody>
      </section>
    </div>
  );
};

export default RecentTransactions;
