import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

export const STEP_ITEMS = [
  {
    title: "xJUMP",
    tooltipClass: "xJump",
    element: ".xJumpDashboard",
    intro: (
      <div>
        <QuestionMarkCircleIcon className="absolute top-[30px] left-8 h-5" />
        <h5>Stake</h5>
        <p>
          Stake your JUMP in the xJUMP buyback pool to earn additional JUMP
          rewards. xJUMP value increases proportionate to JUMP as platform fees
          are used to add JUMP to the pool. To read more about xJUMP,{" "}
          <a
            href="https://trove-labs.gitbook.io/jump-defi/products/xjump#xjump-faq"
            target="_blank"
            rel="noreferrer"
          >
            click here
          </a>
          .
        </p>
      </div>
    ),
  },
  {
    title: "xJUMP",
    tooltipClass: "xJump",
    element: ".xJumpDashboard",
    intro: (
      <div className="flex flex-col">
        <QuestionMarkCircleIcon className="absolute top-[30px] left-8 h-5" />
        <h5>Unstake</h5>
        <p>
          Everytime you unstake, xJUMP is converted to JUMP and additional JUMP
          is earned based on the time staked and value of xJUMP.
        </p>
      </div>
    ),
  },
  {
    title: "xJUMP",
    tooltipClass: "xJump",
    //TODO Update reference to the desired on design
    element: ".xJumpChartJumpValue",
    intro: (
      <div>
        <QuestionMarkCircleIcon className="absolute top-[30px] left-8 h-5" />
        <h5>xJUMP Value</h5>
        <p>
          xJUMP value which increases as platform fees are acrued in the xJUMP
          pool. The value diffrential grows as more JUMP is deposited into the
          xJUMP pool.
        </p>
      </div>
    ),
  },
  {
    title: "xJUMP",
    tooltipClass: "xJump",
    //TODO Update reference to the desired on design
    element: ".xJumpChartJumpLocked",
    intro: (
      <div className="flex flex-col">
        <QuestionMarkCircleIcon className="absolute top-[30px] left-8 h-5" />
        <h5>Total JUMP Locked</h5>
        <p>
          Total amount of JUMP staked into the xJUMP single-stake pool by token
          holders.
        </p>
      </div>
    ),
  },
];

export default STEP_ITEMS;
