import { PropsWithChildren } from "react";

function PageContainerDoubleSideRight(props: PropsWithChildren) {
  return (
    <div className="flex lg:max-w-[468px] w-full flex-col gap-y-8 relative">
      {props.children}
    </div>
  );
}

export default PageContainerDoubleSideRight;
