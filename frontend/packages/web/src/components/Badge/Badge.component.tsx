import Skeleton from "react-loading-skeleton";
import { HTMLAttributes } from "react";

function Badge(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-full bg-white py-[5px] px-4 absolute bottom-6 right-6 w-fit text-3.5 font-extrabold leading-3.5 tracking-tight text-purple ${props.className}`}
    >
      <p>{props.children || <Skeleton width="120px" />}</p>
    </div>
  );
}

export default Badge;
