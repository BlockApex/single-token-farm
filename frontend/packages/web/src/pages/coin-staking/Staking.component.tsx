import { Button, TopCard, Tutorial } from "@/components";
import Badge from "@/components/Badge";
import Chart from "@/components/xjump-chart";
import { Tab } from "@headlessui/react";
import PageContainerDoubleSide from "@/components/PageContainerDoubleSide";
import { STEP_ITEMS } from "@/pages/coin-staking/Staking.tutorial";
import { useFormik } from "formik";
import {
  initialValues,
  validationSchema,
} from "@/modals/staking/form/formStaking";
import { useEffect, useState } from "react";
import ModalTutorialIntro from "@/components/ModalTutorialIntro";
import { XJUMP_FIRST_TIME_ITERATION_KEY } from "@/pages/coin-staking/Staking.config";
import {
  ArrowRightIcon,
  CurrencyDollarIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import { Steps } from "intro.js-react";
import { RocketSolidIcon } from "@/assets/svg/rocket-solid";

type StakingComponentProps = {
  isLoading;
  apr;
  valuePerDayJumpToken;
  valuePerDayTetherToken?;
  onSubmit: (values, call: (value: string) => void) => void;
  submitStaking: (value: string) => void;
  submitWithdraw: (value: string) => void;
  valueJumpToken;
  valueXJumpToken;
  ratioJumpToken;
  balanceXJumpToken;
  balanceJumpToken;
  availableXJumpToClaim;
  chartObj;
  tutorialModal: boolean;
  setTutorialModal: (tutorialModal: boolean) => void;
  tutorialGuide: boolean;
  setTutorialGuide: (tutorialGuide: boolean) => void;
  onGuideChange: (nextIndex: number, nextElement: Element) => void;
  dashboardTab: number;
  setDashboardTab: (index: number) => void;
};

function StakingComponent(props: StakingComponentProps) {
  const {
    apr,
    valuePerDayJumpToken,
    valuePerDayTetherToken,
    onSubmit,
    submitStaking,
    submitWithdraw,
    valueXJumpToken,
    ratioJumpToken,
    balanceXJumpToken,
    balanceJumpToken,
    availableXJumpToClaim,
    chartObj,
    tutorialModal,
    setTutorialModal,
    tutorialGuide,
    setTutorialGuide,
    onGuideChange,
    dashboardTab,
    setDashboardTab,
  } = props; 

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedData, setSelectedData] = useState(chartObj || []);

  const {
    values: valuesWithDraw,
    setFieldValue: setFieldValueWithDraw,
    handleSubmit: handleWithdraw,
    isSubmitting: isWithdrawSubmitting,
  } = useFormik({
    onSubmit: (values) => onSubmit(values, submitWithdraw),
    initialValues: initialValues,
    validationSchema: validationSchema,
  });

  const {
    values: valuesStake,
    setFieldValue: setFieldValueStake,
    handleSubmit: handleStakeSubmit,
    isSubmitting: isStakeSubmitting,
  } = useFormik({
    onSubmit: (values) => onSubmit(values, submitStaking),
    initialValues: initialValues,
    validationSchema: validationSchema,
  });

  useEffect(() => {
    switch (selectedIndex) {
      case 1:
        setSelectedData(chartObj.week);
        break;
      case 2:
        setSelectedData(chartObj.month);
        break;
      case 3:
        setSelectedData(chartObj.year);
        break;
      default:
        setSelectedData(chartObj.day);
        break;
    }
  }, [selectedIndex]);

  function renderChartDetailBox(name: string, value: string) {
    return (
      <div className="flex flex-col rounded-[20px] bg-white-600 p-4  sm:h-[80px] gap-y-4 w-auto md:w-[38.1%] lg:w-[38.1%]">
        <p className="text-3.5 leading-4 font-medium tracking-tight text-left">
          {name}
        </p>
        <strong className="block text-[1.125rem] leading-4 font-extrabold tracking-tight text-left">
          {value}
        </strong>
      </div>
    );
  }

  function renderTimePeriodTab(selected: boolean, text: string) {
    return (
      <>
        <Button
          inline
          className="font-bold rounded-none h-auto text-3.5 leading-3.5 tracking-tight pb-0.5 pt-[15px]"
        >
          {text}
        </Button>
        {selected && (
          <hr className="h-1 mx-auto rounded-[20px] bg-violet border-none w-[27px]" />
        )}
      </>
    );
  }

  function renderChartPeriodSelect() {
    return (
      <div className="flex gap-[20px] items-center justify-center rounded-[10px] bg-white-600 sm:h-[44px] md:min-w-[188px]">
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="h-full">
            <Tab className="outline-none ">
              {({ selected }) => renderTimePeriodTab(selected, "1D")}
            </Tab>
            <Tab className="outline-none">
              {({ selected }) => renderTimePeriodTab(selected, "1W")}
            </Tab>
            <Tab className="outline-none">
              {({ selected }) => renderTimePeriodTab(selected, "1M")}
            </Tab>
            <Tab className="outline-none">
              {({ selected }) => renderTimePeriodTab(selected, "1Y")}
            </Tab>
          </Tab.List>
        </Tab.Group>
      </div>
    );
  }

  function renderTopCard() {
    return (
      <TopCard
        gradientText="JUMP Staking"
        bigText="xJUMP Single Stake Pool"
        bottomDescription={
          "By staking JUMP, users earn the fees generated by the Jump DeFi ecosystem of protocols. When you stake JUMP in the xJUMP Pool you receive xJUMP tokens. xJUMP is used to determine Jump Pad allocation tiers for token sales and is also used for governance over the Jump DAO."
        }
        jumpLogo
        small
      />
    );
  }

  function renderChart(selectedData) {
    return (
      <div className="rounded-lg bg-white-600 p-6 flex flex-col">
        <div
          className="flex sm:flex-row flex-col justify-between items-start 
        sm:items-end gap-y-4"
        >
          <div className="flex flex-row gap-x-6 md:min-w-[70%] flex-1">
            {renderChartDetailBox("xJump value", `${valueXJumpToken} JUMP`)}
            {renderChartDetailBox(
              "Total staked JUMP",
              `${intlFormat(ratioJumpToken.toFixed(2))}`
            )}
          </div>
          {/*  {renderChartPeriodSelect()} */}
        </div>
        <Chart
          label={Array.from({ length: 30 }, (_, i) => i + 1).map((i) => {
            return `${new Date().getFullYear()}-${
              new Date().getMonth() + 1
            }-${i}`;
          })}
          value={Array.from({ length: 30 }, (_, i) => i + 1).map((i) => {
            return (i % 2) + 1.5 * i;
          })}
        />
      </div>
    );
  }

  function renderTab(selected: boolean, text: string) {
    return (
      <>
        <Button
          inline
          className={`${
            selected ? "font-bold" : "font-medium"
          } rounded-none h-auto text-4 leading-4 tracking-tight pb-2`}
        >
          {text}
        </Button>
        {selected && <hr className="h-1 mx-auto bg-violet border-none" />}
      </>
    );
  }

  function renderClaimingInput(stake: boolean) {
    return (
      <label htmlFor="value" className="outline">
        <div className="relative h-[121px] flex items-center justify-center rounded-lg bg-white-600 mb-6">
          <input
            type="number"
            name="value"
            id="value"
            placeholder="0"
            value={stake ? valuesStake.value : valuesWithDraw.value}
            min="0"
            max={balanceJumpToken}
            onChange={(e) =>
              stake
                ? setFieldValueStake("value", e.target.value.toString())
                : setFieldValueWithDraw("value", e.target.value.toString())
            }
            className="w-full border-none bg-transparent h-[121px] p-6 rounded-lg placeholder:text-white font-extrabold text-6 tracking-tight leading-6"
          />
          <Button
            className="absolute right-6"
            onClick={() =>
              stake
                ? setFieldValueStake("value", balanceJumpToken)
                : setFieldValueWithDraw("value", availableXJumpToClaim)
            }
          >
            MAX
          </Button>
        </div>
      </label>
    );
  }

  function renderDashboardLine(name: string, value: string, badge?: string) {
    return (
      <div className="flex justify-between">
        <p className="text-4 leading-4 font-medium tracking-tight">{name}</p>
        <div className="relative flex flex-col items-end justify-between">
          <strong className="block text-4 leading-4 font-medium tracking-tight text-right">
            {value}
          </strong>
          {badge && (
            <Badge className="relative block bg-purple-100 text-white font-semibold text-3.5 inset-0 top-2">
              {badge}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  function renderDashboardDetails(stake: boolean) {
    if (stake)
      return (
        <div className="rounded-lg bg-white-600 p-6 pb-7 space-y-10">
          {renderDashboardLine("APR", `~100.013%`)}
          {/*    {renderDashboardLine(
            "Reward per token staked",
            `${valuePerDayJumpToken} JUMP / Day`
            // `= ${valuePerDayTetherToken} USDT`
          )} */}
          {renderDashboardLine("xJUMP Value", `${valueXJumpToken} JUMP`)}
        </div>
      );
    else
      return (
        <div className="rounded-lg bg-white-600 p-6 pb-12 space-y-10">
          {/* {renderDashboardLine("Your staking", `${balanceJumpToken} JUMP`)} */}
          {renderDashboardLine(
            "You own",
            `~${parseFloat(balanceXJumpToken).toFixed(3)} xJUMP`
          )}
          {renderDashboardLine(
            "Valued at",
            `~${(balanceXJumpToken * valueXJumpToken).toFixed(3)} JUMP`
          )}
        </div>
      );
  }

  function renderDashboardFooterButton(stake: boolean) {
    if (stake)
      return (
        <Button
          className="mt-10"
          full
          disabled={isStakeSubmitting}
          big
          onClick={() => handleStakeSubmit()}
        >
          Stake
        </Button>
      );

    return (
      <Button
        className="mt-10"
        full
        disabled={isWithdrawSubmitting}
        onClick={() => handleWithdraw()}
        big
      >
        Unstake and claim rewards
      </Button>
    );
  }

  function renderBalance(stake: boolean) {
    return (
      <p className="mt-4 mb-4 text-right font-semibold text-3.5 tracking-tight leading-3.5">
        {stake
          ? `Balance: ~${parseFloat(balanceJumpToken)
              .toFixed(3)
              .replace(".000", "")} JUMP`
          : `You can claim: ${parseFloat(availableXJumpToClaim)
              .toFixed(3)
              .replace(".000", "")} xJUMP`}
      </p>
    );
  }

  function renderDashboardPanel(stake: boolean) {
    return (
      <div>
        {renderBalance(stake)}
        {renderClaimingInput(stake)}
        {renderDashboardDetails(stake)}
        {renderDashboardFooterButton(stake)}
      </div>
    );
  }

  function renderDashboard() {
    return (
      <div className="rounded-lg bg-white-600 px-6 py-4 pb-10 xJumpDashboard">
        <Tab.Group selectedIndex={dashboardTab} onChange={setDashboardTab}>
          <Tab.List className="space-x-2">
            <Tab className="outline-none">
              {({ selected }) => renderTab(selected, "Stake")}
            </Tab>
            <Tab className="outline-none">
              {({ selected }) => renderTab(selected, "Unstake")}
            </Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel className="outline-none">
              {renderDashboardPanel(true)}
            </Tab.Panel>
            <Tab.Panel className="outline-none">
              {renderDashboardPanel(false)}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    );
  }

  function renderTutorialIntroModal() {
    return (
      <ModalTutorialIntro
        isOpen={tutorialModal}
        openOnFirstTime={XJUMP_FIRST_TIME_ITERATION_KEY}
        setOpen={setTutorialModal}
        titles={["Welcome to Jump DeFi", "xJUMP Single Stake Pool"]}
        description="The single-stake buyback pool that allows users to access the core utilities of the Jump DeFi platform."
        cards={[
          {
            icon: <RocketSolidIcon className="h-4.5 w-4.5" />,
            title: "Jump Pad Allocation tiers",
            text: "xJUMP is used to determined launchpad allocation tiers for token sales.",
          },
          {
            icon: (
              <CurrencyDollarIcon className="h-[22px] w-[22px] mt-[-2px] stroke-purple stroke-1" />
            ),
            title: "Revenue share",
            text: "By staking JUMP users can earn a percentage of fees generated by the Jump DeFi ecosystem",
          },
          {
            icon: (
              <MegaphoneIcon className="h-5 w-5 stroke-purple stroke-1 mt-[-3px] ml-[-2px]" />
            ),
            title: "Governance",
            text: "xJUMP is used to vote on governance proposals that directly affect Jump DeFi platform functions.",
          },
        ]}
        footer={
          <Button
            big
            className="text-3.5"
            onClick={() => {
              setTutorialModal(false);
              setTutorialGuide(true);
            }}
          >
            See more
            <ArrowRightIcon className="h-6" />
          </Button>
        }
      />
    );
  }

  return (
    <PageContainerDoubleSide>
      {renderTutorialIntroModal()}
      <Steps
        enabled={tutorialGuide}
        steps={STEP_ITEMS}
        initialStep={0}
        onExit={() => setTutorialGuide(false)}
        onChange={onGuideChange}
        options={{
          showProgress: false,
          showBullets: false,
          scrollToElement: false,
          showStepNumbers: true,
          stepNumbersOfLabel: "/",
        }}
      />

      <PageContainerDoubleSide.Left>
        {renderTopCard()}
        {renderChart(selectedData)}
        <Tutorial
          items={STEP_ITEMS}
          options={{
            showStepNumbers: true,
            stepNumbersOfLabel: "/",
          }}
          onChange={onGuideChange}
        />
      </PageContainerDoubleSide.Left>

      <PageContainerDoubleSide.Right>
        {renderDashboard()}
        <Tutorial
          items={STEP_ITEMS}
          options={{
            showStepNumbers: true,
            stepNumbersOfLabel: "/",
          }}
          onChange={onGuideChange}
        />
      </PageContainerDoubleSide.Right>
    </PageContainerDoubleSide>
  );
}

export default StakingComponent;

function intlFormat(value: number | string) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    notation: "compact",
  }).format(parseFloat(value as string));
}
