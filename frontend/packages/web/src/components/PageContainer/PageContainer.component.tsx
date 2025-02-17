import { PropsWithChildren } from "react";
import { motion } from "framer-motion";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export const PageContainer = (props: PropsWithChildren<PropsWithChildren>) => {
  return (
    <div className="flex p-6 flex-col w-full  mx-auto max-w-[1512px]">
      <motion.div
        animate={{ opacity: 1 }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-[38px]"
      >
        <SkeletonTheme baseColor="#FFFFFF00" highlightColor="#FFFFFF1A">
          {props.children}
        </SkeletonTheme>
      </motion.div>
    </div>
  );
};

export default PageContainer;
