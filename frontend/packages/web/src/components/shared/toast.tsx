import { twMerge } from "tailwind-merge";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

const explorer = {
  mainnet: "https://explorer.near.org/transactions/",
  testnet: "https://explorer.testnet.near.org/transactions/",
};

export const Toast = ({
  visible,
  status,
  message,
  transactionHash,
}: {
  visible: boolean;
  status: string;
  message: string;
  transactionHash: string | undefined;
}) => (
  <div
    className={twMerge(
      visible ? "animate-enter" : "animate-leave",
      "max-w-md w-auto bg-white shadow-lg rounded-[12px] pointer-events-auto p-[18px] flex items-start space-x-[9px]"
    )}
  >
    <div
      className={twMerge(
        "rounded-full w-[20px] h-[20px] flex items-center justify-center shrink-0 relative top-[2px]",
        status === "success" ? "bg-[#3FB460]" : "bg-[#ff4b4b]"
      )}
    >
      {status === "success" ? (
        <CheckIcon className="w-[12px] h-[12px] text-white" />
      ) : (
        <XMarkIcon className="w-[12px] h-[12px] text-white" />
      )}
    </div>

    <div>
      <div className="mb-[4px]">
        <span
          className="font-[500] text-[14px] tracking-[-0.03em] text-black"
          children={message}
        />
      </div>

      {status !== "success" && (
        <div>
          <a
            target="_blank"
            className="font-[600] text-[14px] tracking-[-0.03em] text-black"
            href={explorer[import.meta.env.VITE_NEAR_NETWORK] + transactionHash}
          >
            Click here to learn more about your transaction.
          </a>
        </div>
      )}
    </div>
  </div>
);
