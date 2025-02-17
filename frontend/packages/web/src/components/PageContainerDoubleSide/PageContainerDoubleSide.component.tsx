import { PropsWithChildren } from "react";
import { motion } from "framer-motion";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import PageContainerDoubleSideLeft from "./PageContainerDoubleSideLeft.component";
import PageContainerDoubleSideRight from "./PageContainerDoubleSideRight.component";

function PageContainerDoubleSide(props: PropsWithChildren<PropsWithChildren>) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-[38px] w-full"
    >
      <SkeletonTheme baseColor="#FFFFFF00" highlightColor="#FFFFFF1A">
        <div className="flex p-6 flex-col lg:flex-row max-w-full mx-auto max-w-[1512px] gap-6">
          {props.children}
        </div>
      </SkeletonTheme>
    </motion.div>
  );
}

const Left = PageContainerDoubleSideLeft;
const Right = PageContainerDoubleSideRight;

PageContainerDoubleSide.Left = Left;
PageContainerDoubleSide.Right = Right;

export default PageContainerDoubleSide;
