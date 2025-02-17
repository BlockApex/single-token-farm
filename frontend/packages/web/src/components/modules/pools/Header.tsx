import { useState } from "react";
import { Checkbox, SimpleSelect } from "@/components/shared";

interface HeaderProps {
  title: string;
  tab: "pools" | "liquidity";
  hidePools: boolean;
  farmsAvailable: boolean;
  showFav: boolean;
  createdBy?: boolean;
  showFilter: boolean;
  setHidePools: (c: boolean) => void;
  setfarmsAvailable: (c: boolean) => void;
  setShowFav: (c: boolean) => void;
  setCreatedBy: (c: boolean) => void;

}
const Header = ({
  title,
  tab,
  setfarmsAvailable,
  setHidePools,
  farmsAvailable,
  hidePools,
  showFav,
  createdBy,
  setShowFav,
  setCreatedBy,
  showFilter
}: HeaderProps) => {
  const [filter, setFilter] = useState("0");
  return (
    <div className="w-full flex flex-col md:flex-row  items-start md:items-center justify-between p-4 md:p-6 ">
      <h1 className="text-2xl tracking-tighter font-bold leading-6 mb-4 md:mb-0">
        {title}
      </h1>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-start gap-4 md:gap-6">
        {tab === "pools" &&  showFilter  && (
          <Checkbox
            label="Created by me"
            checked={createdBy!}
            onChange={(e) => setCreatedBy(e.target.checked)}
          />
        )}

        {tab === "pools" && (
          <Checkbox
            label="Favorite Pools"
            checked={showFav}
            onChange={(e) => setShowFav(e.target.checked)}
          />
        )}
        <Checkbox
          label="Farm Available"
          checked={farmsAvailable}
          onChange={(e) => setfarmsAvailable(e.target.checked)}
        />
        {/* {tab === "pools" && (
          <Checkbox
            label="Hide non-whitelisted pools"
            checked={hidePools}
            onChange={(e) => setHidePools(e.target.checked)}
          />
        )} */}
        {/* <div className="flex items-center">
          <SimpleSelect
            options={[
              { label: "All", value: "0" },
              { label: "NEAR eco", value: "1" },
              { label: "alphabetical", value: "2" },
              { label: "meme", value: "3" },
              { label: "others", value: "4" },
            ]}
            selectedValue={filter}
            onChange={(e) => setFilter(e)}
            text="Filter By"
          />
        </div> */}
      </div>
    </div>
  );
};

export default Header;
