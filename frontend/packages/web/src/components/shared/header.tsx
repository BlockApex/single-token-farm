import { JumpTextIcon } from "@/assets/svg/jump-text";
import { Button } from "./button";
import { MobileNav } from "./mobile-nav";
import { Fragment, useEffect, useState } from "react";
import { AirdropModal } from "@/modals";
import { Wallet } from "./wallet";
import { JumpIcon } from "@/assets/svg/jump-logo";
import Logo from "@/assets/logo.png"
import {
  MoonIcon,
  Bars3Icon,
  ChevronDownIcon,
} from "@heroicons/react/24/solid";
import { SunIcon } from "@heroicons/react/24/outline";
import { useChainSelector } from "@/context/chain-selector";
import { Dialog, Transition } from "@headlessui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { WalletIcon } from "@/assets/svg";
const SCROLL_TOLERANCE = 8;
const chainOptions = [
  {
    chainId: "near",
    imgSrc: "/assets/svgs/near-logo.svg",
  },
  {
    chainId: "mantle",
    imgSrc: "/assets/mantle.png",
  },
  /*  {
    chainId: "telos-testnet",
    imgSrc: "/assets/telos.png",
  }, */
  {
    chainId: "telos",
    imgSrc: "/assets/telos.png",
  },
];
export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [isStyleSchemeDark, setStyleScheme] = useState(true);
  const [showChainModal, setShowChainModal] = useState(false);
  const { chain, setChain } = useChainSelector();
  const [isHeaderFloating, setHeaderFloating] = useState(
    window.scrollY > SCROLL_TOLERANCE
  );

  useEffect(() => {
    // Add/remove scrolling listener to isHeaderFloating
    const onScroll = () => setHeaderFloating(window.scrollY > SCROLL_TOLERANCE);

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  function toggleSelectChainModal() {
    setShowChainModal(!showChainModal);
  }
  const classes =
    "transition-all fixed inset-0 bottom-auto z-50 flex items-center justify-between px-3 md:px-8 h-[74px]";
  const floatingClasses = " shadow-lg backdrop-blur bg-white-600";

  return (
    <div className="fixed w-full h-[74px] z-50 ">
      <header className={classes + (isHeaderFloating ? floatingClasses : "")}>
        {chain === "near" && (
          <AirdropModal
            isOpen={showTokenModal}
            onClose={() => setShowTokenModal(false)}
          />
        )}
        <div className="flex gap-x-4 items-center">
          {/* <JumpIcon /> */}
          <div className="sm:flex hidden">
            {/* <JumpTextIcon /> */}
            <img src={Logo} width={40} height={40} />
            <h1 className="text-white text-4xl font-bold ml-2" >NEAR</h1>
          </div>
        </div>

        <div className="flex gap-x-6 items-center">
          {/* Dark/Light Switch Button */}
          <Button
            white
            className="h-10 aspect-square p-0 hidden"
            onClick={() => setStyleScheme(!isStyleSchemeDark)}
          >
            {!isStyleSchemeDark && <MoonIcon className="h-3 fill-purple" />}
            {isStyleSchemeDark && <SunIcon className="h-3" />}
          </Button>

          {/* Mobile Hamburger Button */}
          <Button white onClick={() => setIsOpen(true)} className="lg:hidden">
            <Bars3Icon className="h-3.5" />
          </Button>
          {chain === "near" && (
            <MobileNav isOpen={isOpen} onClose={() => setIsOpen(!isOpen)} />
          )}

          <ChainSelectorModal
            showModal={showChainModal}
            toggleModal={() => {
              setShowChainModal(!showChainModal);
            }}
          />
          <div className="hidden md:block" >
          <Button white onClick={toggleSelectChainModal}>
            <img
              src={
                chainOptions.find(
                  (c) => c.chainId.toLowerCase() === chain.toLowerCase()
                )?.imgSrc
              }
              className="h-5 w-5"
            />
            {chain.toLocaleUpperCase()}
          </Button>
          </div>
          {/* Wallet Button/Menu */}
          {chain === "near" && <Wallet />}
          {chain === "mantle" && <EVMConnectButton />}
          {chain === "telos-testnet" && <EVMConnectButton />}
          {chain === "telos" && <EVMConnectButton />}
        </div>
      </header>
    </div>
  );
}

function ChainSelectorModal({
  showModal,
  toggleModal,
}: {
  showModal: boolean;
  toggleModal: () => void;
}) {
  const { setChain } = useChainSelector();
  return (
    <Transition appear show={showModal} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => toggleModal()}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className="
                  w-full max-w-[456px] px-[20px] pt-[20px] pb-[41px] transform overflow-hidden rounded-[16px] bg-white transition-all
                  bg-[url('./modalbg.png')]
                "
              >
                <div className="flex flex-col mb-[32px]">
                  <Dialog.Title className="text-[#121315] text-[16px] font-[700] tracking-[-0.04em]">
                    Select Chain
                  </Dialog.Title>
                </div>

                <div className="space-y-[24px] flex flex-col">
                  {chainOptions.map((chain, index) => {
                    return (
                      <button
                        key={"index-selector-modal-" + index}
                        onClick={() => {
                          setChain(chain.chainId);
                          window.location.href = window.location.origin;
                          toggleModal();
                        }}
                        className="  rounded-[16.5818px] h-[78px] px-[32px] py-[17px] bg-white flex items-center shadow-[0px_3.31636px_16.5818px_rgba(152,73,156,0.25)] hover:shadow-[0px_3.31636px_16.5818px_rgba(152,73,156,0.5)]
                        bg-[linear-gradient(90deg,_#894DA0_7px,_transparent_4px)]  text-[#121315]
                      "
                      >
                        <img
                          src={chain.imgSrc}
                          className="w-[32px] mr-[52px]"
                        />
                        <span className="font-[700] text-[20px] capitalize">
                          {chain.chainId}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function EVMConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    white
                    onClick={openConnectModal}
                    className="text-3.5 font-semibold leading-4 tracking-tight text-purple gap-x-1"
                  >
                    <WalletIcon className="h-5" />
                    Connect
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    white
                    onClick={openChainModal}
                    className="text-3.5 font-semibold leading-4 tracking-tight text-purple gap-x-1"
                  >
                    Wrong network
                  </Button>
                );
              }

              return (
                <div style={{ display: "flex", gap: 12 }}>
                  <Button
                    white
                    onClick={openAccountModal}
                    className="text-3.5 font-semibold leading-4 tracking-tight text-purple gap-x-1 "
                  >
                    <span>
                      {account.displayName}
                      {account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ""}
                    </span>

                    <ChevronDownIcon className="ml-2 -mr-1 w-[20px] h-[20px] text-[#1A1A1A]" />
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
