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

interface PoolTabsProps {
  poolTab: number;
  setPoolTab: (s:number) => void;
}
const PoolTabs = ({ poolTab, setPoolTab }: PoolTabsProps) => {
  return (
    <div className="w-full" >
      <Tab.Group selectedIndex={poolTab} onChange={setPoolTab}>
        <Tab.List className="space-x-2">
          <Tab className="outline-none">
            {({ selected }) => renderTab(selected, "Jump Pools")}
          </Tab>
          <Tab className="outline-none">
            {({ selected }) => renderTab(selected, "My Liquidity")}
          </Tab>
        </Tab.List>
      </Tab.Group>
    </div>
  );
};

export default PoolTabs;
