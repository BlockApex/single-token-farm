import { JumpIcon } from "@/assets/svg/jump-logo";
import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type EmptyProps = HTMLAttributes<HTMLDivElement> & {
  text?: string;
};

export function Empty({ text, children, className }: EmptyProps) {
  return (
    <div
      className={twMerge(
        `flex items-center justify-center mx-auto h-[400px] flex-col`,
        `${className}`
      )}
    >
      {text ? (
        <>
          <JumpIcon />
          <p className="mt-4 font-extrabold text-[30px] tracking-tight mb-1">
            {text}
          </p>
        </>
      ) : (
        <>{children}</>
      )}
    </div>
  );
}
