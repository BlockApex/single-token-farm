import { Button } from "@/components";
import { Tab } from "@headlessui/react";

function renderTab(selected: boolean, text: string) {
  return (
    <>
      <Button
        inline
        className={`${
          selected ? "font-bold" : "font-medium"
        } rounded-none h-auto leading-4 tracking-tight pb-2 text-[14px] md:text-[20px]`}
      > 
        {text}
      </Button>
      {selected && <hr className="h-1 mx-auto bg-violet border-none" />}
    </>
  );
}

interface FarmsTabsProps {
  tab: number;
  setTab: (s: number) => void;
}
const FarmTabs = ({ tab, setTab }: FarmsTabsProps) => {
  return (
    <div className="w-full">
      <Tab.Group selectedIndex={tab} onChange={setTab}>
        <Tab.List className="space-x-2">
          <Tab className="outline-none">
            {({ selected }) => renderTab(selected, "All Farms")}
          </Tab>
          {/* <Tab className="outline-none">
            {({ selected }) => renderTab(selected, "My Farms")}
          </Tab> */}
        </Tab.List>
      </Tab.Group>
    </div>
  );
};

export default FarmTabs;
