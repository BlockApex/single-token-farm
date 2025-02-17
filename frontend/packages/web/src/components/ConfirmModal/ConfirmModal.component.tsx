import { HTMLAttributes, ReactNode } from "react";
import { Dialog } from "@headlessui/react";
import { JumpModalBg } from "@/assets/svg/jump-modal-bg";

type ConfirmModalProps = HTMLAttributes<HTMLDivElement> & {
  message: string | ReactNode;
  open: boolean;
  onClose: () => void;
};

function ConfirmModal({
  message,
  children,
  open,
  onClose,
  className,
}: ConfirmModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="fixed inset-0 z-[55] flex justify-center items-center"
    >
      <Dialog.Backdrop className="fixed inset-0 bg-black/50 z-50" />
      <Dialog.Panel className="relative bg-white rounded-sm shadow-2 p-6 w-[444px] h-[238px]">
        <div className="inset-0 top-auto w-full absolute overflow-hidden rounded-sm pointer-events-none">
          <JumpModalBg />
        </div>
        <Dialog.Title className="text-purple max-w-[20ch] mx-auto mt-8 mb-6 text-center tracking-tighter leading-6 text-5 font-bold">
          {message}
        </Dialog.Title>
        <div className={className}>{children}</div>
      </Dialog.Panel>
    </Dialog>
  );
}

export default ConfirmModal;
