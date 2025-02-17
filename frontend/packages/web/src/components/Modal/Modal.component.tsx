import { HTMLAttributes, ReactNode } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components";
import { XMarkIcon } from "@heroicons/react/24/solid";

type ModalProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  open: boolean;
  onClose: () => void;
  footer: ReactNode;
};

function Modal(props: ModalProps) {
  const { title, children, open, onClose, className, footer } = props;

  return (
    <Dialog
      open={open}
      className="fixed inset-0 z-[55] flex justify-center items-center"
      onClose={onClose}
    >
      <Dialog.Backdrop className="fixed inset-0 bg-black/50 z-50" />
      <Dialog.Panel className="relative bg-white rounded-lg shadow-2 overflow-hidden h-[443px]">
        <div className="w-full shadow-[0_4px_20px_#FFF] shadow-[#98499C]/10 flex justify-between items-center pl-8 pr-6 h-12">
          <Dialog.Title className="text-black text-3.5 font-semibold tracking-tight leading-3.5">
            {title}
          </Dialog.Title>
          <Button inline onClick={onClose}>
            <XMarkIcon className="h-6 fill-black" />
          </Button>
        </div>

        <div className={className}>{children}</div>

        <div
          className={
            "w-full flex justify-between absolute inset-0 px-8 py-3 top-auto bg-white"
          }
        >
          {footer}
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

export default Modal;
