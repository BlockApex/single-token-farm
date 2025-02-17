import toast, { Toast } from "react-hot-toast";

/** @description - This is the connect wallet default warning toast */
export function ConnectWallet({ t }: { t: Toast }) {
  return (
    <span>
      You must connect your <b>wallet</b>
      <button
        className="bg-indigo-500 text-white py-2 text-sm px-3 rounded focus:outline-none"
        onClick={() => toast.dismiss(t.id)}
      >
        Dismiss
      </button>
    </span>
  );
}
