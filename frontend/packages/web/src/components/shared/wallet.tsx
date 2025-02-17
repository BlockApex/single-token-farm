import { Fragment, useMemo } from "react";
import { Button } from "./button";
import { WalletIcon } from "@/assets/svg";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { useWalletSelector } from "@/context/wallet-selector";
import { Square2StackIcon } from "@heroicons/react/24/outline";
import { LogoutIcon } from "@/assets/svg";
import Big from "big.js";
import { CopyToClipboard } from "react-copy-to-clipboard";
import toast from "react-hot-toast";

const shortenAddress = (address: string, chars = 8): string => {
  if (!address) {
    return "";
  }
  if (address.length <= chars * 2) {
    return address;
  }

  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const Wallet = () => {
  const { token, xToken, accountId, toggleModal, signOut } =
    useWalletSelector();

  const tokenDecimals = useMemo(() => {
    if (!token?.metadata) {
      return;
    }

    return new Big(10).pow(token?.metadata.decimals);
  }, [token?.metadata]);

  const formattedTokenBalance = useMemo(() => {
    if (!tokenDecimals || !token?.balance) {
      return "-";
    }

    return new Big(token?.balance || 0).div(tokenDecimals).toFixed(2);
  }, [token?.balance, tokenDecimals]);

  const xtokenDecimals = useMemo(() => {
    if (!xToken?.metadata) {
      return;
    }

    return new Big(10).pow(xToken?.metadata.decimals);
  }, [xToken?.metadata]);

  const formattedXTokenBalance = useMemo(() => {
    if (!xtokenDecimals || !xToken?.balance) {
      return "-";
    }

    return new Big(xToken?.balance || 0).div(xtokenDecimals).toFixed(2);
  }, [xToken?.balance, xtokenDecimals]);

  if (!accountId) {
    return (
      <Button
        white
        onClick={() => toggleModal()}
        className="font-semibold leading-4 tracking-tight text-purple gap-x-1"
      >
        <WalletIcon className="h-5" />
        Connect
      </Button>
    );
  }

  return (
    <Menu as="div" className="relative text-left inline-block">
      <Menu.Button as="div">
        <Button
          white
          className="text-3.5 font-semibold leading-4 tracking-tight text-purple gap-x-1"
        >
          <span children={shortenAddress(accountId)} />

          <ChevronDownIcon className="ml-2 -mr-1 w-[25px] h-[25px] text-[#1A1A1A]" />
        </Button>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          as="div"
          className="
            absolute 
						right-0
						max-w-[354px]
            mt-2 w-[354px] 
            origin-top-right
            rounded-[16px]
            bg-white
            shadow-[0px_4px_30px_rgba(0,0,0,0.25)]
            focus:outline-none
          "
        >
          <div className="py-[14px] px-[24px]">
            <CopyToClipboard
              text={accountId}
              onCopy={() => toast.success("Copy to clipboard")}
            >
              <button className="inline-flex px-[16px] py-[10px] border border-[rgba(0,0,0,0.2)] rounded-[10px] space-x-[16px] hover:bg-[rgba(0,0,0,0.02)]">
                <span
                  children={shortenAddress(accountId)}
                  className="text-[#1A1A1A] text-[14px] font-[500]"
                />

                <Square2StackIcon className="w-[24px] text-[rgba(26,26,26,0.5)]" />
              </button>
            </CopyToClipboard>
          </div>

          <div className="flex px-[24px] border border-y border-[rgba(0,0,0,0.2)] pt-[17px] pb-[28px] flex flex-col space-y-[16px]">
            <div>
              <span className="text-[14px] font-[500] text-[#1A1A1A]">
                Balance
              </span>
            </div>

            <div className="flex justify-between">
              <div className="flex space-x-[8px] items-center">
                <img
                  src={token?.metadata?.icon}
                  className="w-[20px] h-[20px] rounded-full"
                />

                <div>
                  <span
                    children={token?.metadata?.symbol}
                    className="font-[500] text-[14px] text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div>
                <span
                  children={formattedTokenBalance}
                  className="font-[700] text-[14px] text-[#1A1A1A]"
                />
              </div>
            </div>

            {/* <div className="flex justify-between">
              <div className="flex space-x-[8px] items-center">
                <img
                  src={xToken?.metadata?.icon}
                  className="w-[20px] h-[20px] rounded-full"
                />

                <div>
                  <span
                    children={xToken?.metadata?.symbol}
                    className="font-[500] text-[14px] text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div>
                <span
                  children={formattedXTokenBalance}
                  className="font-[700] text-[14px] text-[#1A1A1A]"
                />
              </div>
            </div> */}
          </div>

          <div>
            <button
              onClick={async () => {
                await signOut();
                let strict_tokens = localStorage.getItem("strict_tokens");
                let tokens = localStorage.getItem("tokens");
                let rpc = localStorage.getItem("selectedRPC");

                localStorage.clear();
                localStorage.setItem("strict_tokens", strict_tokens!);
                localStorage.setItem("tokens", tokens!);
                localStorage.setItem("selectedRPC",rpc!)
                await new Promise((resolve) => setTimeout(resolve, 700));
                window.location.reload();
              }}
              className="pt-[19px] px-[24px] pb-[21px] w-full rounded-b-[16px] hover:bg-[#DB2B1F]/[0.65] flex items-center space-x-[8px] text-[#DB2B1F] hover:text-white"
            >
              <LogoutIcon />

              <span className="font-[400] text-[14px]">Disconnect</span>
            </button>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
