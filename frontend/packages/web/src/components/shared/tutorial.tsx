import { Steps } from "intro.js-react";
import { IconButton } from "@/components";
import { ReactNode, useState } from "react";

export interface TutorialItemInterface {
  title?: string;
  element: string;
  intro: ReactNode;
}

export const Tutorial = ({
  items,
  options,
  onChange,
}: {
  items: TutorialItemInterface[];
  options?: any;
  onChange?: (index: number, element: Element) => void;
}) => {
  const [show, setShow] = useState(false);

  return (
    <>
      <div className="absolute right-4 top-4 z-20">
        <IconButton onClick={() => setShow(!show)} />
      </div>

      <Steps
        enabled={show}
        steps={items}
        initialStep={0}
        onExit={() => setShow(false)}
        onChange={onChange}
        options={{
          showProgress: false,
          showBullets: false,
          scrollToElement: false,
          ...options,
        }}
      />
    </>
  );
};
