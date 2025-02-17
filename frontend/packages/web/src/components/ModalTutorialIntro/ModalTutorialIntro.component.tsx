import { ReactNode, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { JumpKangarooGuide } from "@/assets/svg/jump-kangaroo-guide";

export type ModalTutorialIntroCard = {
  icon: ReactNode;
  title: string;
  text: string;
};

type ModalTutorialIntroProps = {
  isOpen: boolean;
  openOnFirstTime: string;
  setOpen: (isOpen: boolean) => void;
  titles: string[];
  description: string;
  cards: ModalTutorialIntroCard[];
  footer: ReactNode;
};

/**
 * The first iteration modal
 * If openOnFirstTime is set, the modal will check if user had the first time interaction,
 * if not the modal will call the setOpen(true) to open the modal
 * @param {boolean} isOpen If modal is open or not
 * @param {string} openOnFirstTime Local Storage key for first interaction auto open
 * @param {function} setOpen Set function of isOpen
 * @param {string[]} titles Array of 2 title lines
 * @param {string} description Description right below the title
 * @param {ModalTutorialIntroCard[]} cards List of the 3 cards on the body
 * @param {ReactNode} footer Footer node to the bottom of the modal
 * @return {ReactNode} Tutorial Modal
 */
function ModalTutorialIntro(props: ModalTutorialIntroProps) {
  const {
    isOpen,
    openOnFirstTime,
    setOpen,
    titles,
    description,
    cards,
    footer,
  } = props;

  useEffect(() => {
    if (openOnFirstTime)
      if (!localStorage.getItem(openOnFirstTime)) {
        localStorage.setItem(openOnFirstTime, new Date().toISOString());
        setOpen(true);
      }
  }, [openOnFirstTime]);

  function renderCard(card: ModalTutorialIntroCard, key: number) {
    return (
      <div
        key={key}
        className="rounded-sm shadow-[0_2px_10px_1px_rgba(152,73,156,.25)] flex h-[99px] bg-white px-3.5 pt-4"
      >
        <div className="basis-7">{card.icon}</div>
        <div className="flex-grow-0 w-fit space-y-2">
          <h4 className="text-black font-bold text-3.5 leading-4 tracking-normal">
            {card.title}
          </h4>
          <p className="text-black font-normal text-3.5 leading-4.5 tracking-normal">
            {card.text}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Dialog
      open={isOpen}
      className="fixed inset-0 z-[55] flex justify-center items-center"
      onClose={setOpen}
    >
      <Dialog.Backdrop className="fixed inset-0 bg-black/50 z-50" />
      <Dialog.Panel className="relative bg-white rounded-sm shadow-2 p-5 py-11 flex flex-col w-[444px] h-[626px]">
        <JumpKangarooGuide className="absolute inset-0 w-[444px] h-[626px] z-0" />
        <Dialog.Title className="text-4.5 font-extrabold tracking-normal text-black leading-6 flex flex-col items-center w-full">
          {titles[0]}
          <span className="bg-[rgb(112,0,255)] bg-guide w-fit bg-clip-text text-transparent">
            {titles[1]}
          </span>
        </Dialog.Title>

        <p className="text-black text-center font-normal text-3.5 leading-4.5 z-10 tracking-normal mt-4">
          {description}
        </p>

        <div className="flex flex-col gap-6 mt-[2.625rem] mx-3 items-center z-10">
          {cards.map(renderCard)}
        </div>

        <div className="w-full flex mt-6 justify-center z-10">{footer}</div>
      </Dialog.Panel>
    </Dialog>
  );
}

export default ModalTutorialIntro;
