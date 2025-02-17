import { useWalletSelector } from "@/context/wallet-selector";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import type { ModuleState } from "@near-wallet-selector/core";
import { Spinner } from "@chakra-ui/react";

export function WalletSelectorModal(props: {}) {
  const { selector, showModal, toggleModal } = useWalletSelector();
  const [modules, setModules] = useState<ModuleState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subscription = selector.store.observable.subscribe((state) => {
      state.modules.sort((current, next) => {
        if (current.metadata.deprecated === next.metadata.deprecated) {
          return 0;
        }
        return current.metadata.deprecated ? 1 : -1;
      });

      setModules(state.modules);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleWalletClick = async (module: ModuleState) => {
    setError(null);
    try {
      setLoading(true);
      const { available } = module.metadata;

      if (module.type === "injected" && !available) {
        setLoading(false);
        setError("Wallet is not available.");
        return;
      }

      const wallet = await module.wallet();

      console.log(wallet , "WALLET.......")
      let signInParams: any = {
        contractId: import.meta.env.VITE_NFT_STAKING_CONTRACT,
        methodNames: [],
      };

      // Handle Ledger (hardware) wallets
      if (wallet.type === "hardware") {
        return
        // try {
        //   const accounts = await wallet.getAccounts();
        //   // console.log(accounts , "ACCOUNTS........")
        //   if (!accounts || accounts.length === 0) {
        //     setError("No Ledger accounts found.");
        //     setLoading(false);
        //     return
        //   }
        //   signInParams.accounts = accounts.map(acc => acc.accountId);
        // } catch (error) {
        //   setError("Failed to retrieve Ledger accounts.");
        //   setLoading(false);
        //   return;
        // }
      }

      await wallet.signIn(signInParams);
      setLoading(false);
    } catch (e: any) {
      console.log(e, "error..........");
      setLoading(false);
      setError(typeof e === "string" ? e : "Connection Failed!");
    }
  };

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
                <div className="flex flex-col mb-[10px]">
                  <Dialog.Title className="text-[#121315] text-[16px] font-[700] tracking-[-0.04em]">
                    Connect Wallet
                  </Dialog.Title>
                </div>
                {loading ? (
                  <div className="flex items-center justify-start mb-2">
                    <Spinner size="sm" emptyColor="gray.200" color="#4b2354" />
                    <p className="text-[#121315] pl-2">Connecting Wallet.....</p>
                  </div>
                ) : (
                  ""
                )}
                {error ? (
                  <div className="flex items-center justify-start mb-2">
                    <p className="text-red">{error}</p>
                  </div>
                ) : (
                  ""
                )}

                <div className="space-y-[24px] flex flex-col">
                  {modules.map((module) => (
                    <button
                      key={"wallet-selector-modal-module" + module.id}
                      onClick={() => handleWalletClick(module)}
                      className="
                        rounded-[16.5818px] h-[78px] px-[32px] py-[17px] bg-white flex items-center shadow-[0px_3.31636px_16.5818px_rgba(152,73,156,0.25)] hover:shadow-[0px_3.31636px_16.5818px_rgba(152,73,156,0.5)]
                        bg-[linear-gradient(90deg,_#894DA0_7px,_transparent_4px)]  text-[#121315]
                      "
                    >
                      <img src={module.metadata.iconUrl} className="w-[32px] mr-[52px]" />
                      <span children={module.metadata.name} className="font-[700] text-[20px]" />
                    </button>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
