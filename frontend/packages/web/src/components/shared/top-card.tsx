import { JumpBigWhite } from "@/assets/svg";
import { twMerge } from "tailwind-merge";
import { Tutorial, TutorialItemInterface } from "@/components";
import isEmpty from "lodash/isEmpty";
import { ReactNode } from "react";
import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";
import { InfoTooltip } from "@/components/shared";

type Props = {
  maxW?: string;
  gradientText: string;
  bigText: string;
  bottomDescription: string;
  renderAsset?: JSX.Element;
  content?: JSX.Element;
  jumpLogo?: boolean;
  children?: ReactNode;
  onClick?: () => void;
  stepItems?: TutorialItemInterface[];
  small?: boolean;
  actions?: JSX.Element;
  tooltip?: boolean;
  tooltipContent?: React.ReactNode;
};

export const TopCard = ({
  gradientText,
  bigText,
  bottomDescription,
  jumpLogo = false,
  content = <></>,
  maxW = "",
  children,
  stepItems,
  small,
  actions,
  tooltip = false,
  tooltipContent,
}: Props) => {
  return (
    <div className={twMerge("launchpad top-card flex", maxW)}>
      <div
        className={
          (small ? "py-6 pb-6 gap-4" : "py-7 pb-10 gap-1.5") +
          " overflow-hidden flex flex-wrap align-middle justify-between w-full color-white font-extrabold px-6 h-full rounded-lg bg-white-600 relative"
        }
      >
        {!isEmpty(stepItems) && <Tutorial items={stepItems || []} />}
        {tooltip ? (
          <InfoTooltip label={tooltipContent}>
            <span className="absolute right-4 top-4 z-20 cursor-pointer">
              <QuestionMarkOutlinedIcon className="w-4 h-4" />
            </span>
          </InfoTooltip>
        ) : (
          ""
        )}
        <div className="flex flex-col relative flex-grow z-20 gap-y-4">
          <p
            className={
              small
                ? "text-3.5 font-extrabold leading-3.5 tracking-thigher"
                : "text-base tracking leading-4 mb-0.5"
            }
          >
            {gradientText}
          </p>
          <h1 className="text-2xl tracking-tighter font-bolder leading-6">
            {bigText}
          </h1>
          <p
            className={
              (small
                ? "font-medium lg:max-w-[84%]"
                : "font-semibold max-w-3xl") + " text-3.5 tracking leading-4.5"
            }
          >
            {bottomDescription}
          </p>
          {children}
          {actions}
        </div>

        {content && (
          <div className="relative z-20 flex space-x-[1.25rem]">{content}</div>
        )}

        <div className="absolute bottom-0 -right-4 z-10 max-h-full overflow-hidden">
          {jumpLogo && <JumpBigWhite small={small} />}
        </div>
      </div>
    </div>
  );
};
