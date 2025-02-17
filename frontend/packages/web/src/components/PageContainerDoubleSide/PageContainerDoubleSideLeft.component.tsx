import { PropsWithChildren } from "react";

function PageContainerDoubleSideLeft(props: PropsWithChildren) {
  return (
    <div className="flex flex-col w-full gap-y-8 relative">
      {props.children}
    </div>
  );
}

export default PageContainerDoubleSideLeft;
