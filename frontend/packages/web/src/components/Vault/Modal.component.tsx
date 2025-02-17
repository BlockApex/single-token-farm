import { HTMLAttributes, ReactNode } from "react";
import { Dialog } from "@headlessui/react";

type ModalProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  open: boolean;
  onClose: () => void;
};

function ModalVault(props: ModalProps) {
  const { title, children, open, onClose, className } = props;

  return (
    <Dialog
      open={open}
      className="fixed inset-0 z-[55] overflow-auto py-16 "
      onClose={onClose}
    >
      <Dialog.Backdrop className="fixed inset-0 bg-black/50 z-50" />
      <div className="w-[480px]" style={{margin: "0 auto"}}>
      <Dialog.Panel className="relative bg-white rounded-lg shadow-2 px-6 py-5 w-full">
        <div className="w-full flex justify-between items-center">
          <Dialog.Title className="text-black text-[24px] font-bold  mb-6">
            {title}
          </Dialog.Title>
        </div>
        <div className={className}>{children}</div>
      </Dialog.Panel>
      </div>
      
    </Dialog>
  );
}

export default ModalVault;
