import { Button } from "@/components";
import { Tab } from "@headlessui/react";

function renderTab(selected: boolean, text: string) {
    return (
        <>
            <Button
                inline
                className={`${selected ? "font-bold" : "font-medium"
                    } rounded-none h-auto leading-4 tracking-tight pb-2 text-[14px] md:text-[20px]`}
            >
                {text}
            </Button>
            {selected && <hr className="h-1 mx-auto bg-violet border-none" />}
        </>
    );
}

interface RewardTabsProps {
    rewardTab: number;
    setRewardTab: (s: number) => void;
}
const RewardTabs = ({ rewardTab, setRewardTab }: RewardTabsProps) => {
    return (
        <div className="w-full" >
            <Tab.Group selectedIndex={rewardTab} onChange={setRewardTab}>
                <Tab.List className="space-x-2">
                    <Tab className="outline-none">
                        {({ selected }) => renderTab(selected, "Claimed Rewards")}
                    </Tab>
                    <Tab className="outline-none">
                        {({ selected }) => renderTab(selected, "Unclaimed Rewards")}
                    </Tab>
                </Tab.List>
            </Tab.Group>
        </div>
    );
};

export default RewardTabs;
