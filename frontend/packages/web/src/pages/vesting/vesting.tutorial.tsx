export const stepItemsVesting = [
  {
    title: "Jump Vesting",
    element: ".top-card",
    intro: (
      <div>
        <span>
          This is the Jump Vesting page, here you can follow and redeem all the
          rewards received by Jump.
        </span>
      </div>
    ),
  },
  {
    title: "Total Locked",
    element: ".amount-locked",
    intro: (
      <div>
        <span>This is your amount of locked tokens.</span>
      </div>
    ),
  },
  {
    title: "Total Unlocked",
    element: ".amount-unlocked",
    intro: (
      <div className="flex flex-col">
        <span>Here you can find your amount of unlocked tokens.</span>
      </div>
    ),
  },
  {
    title: "Total Withdrawn",
    element: ".amount-withdrawn",
    intro: (
      <div className="flex flex-col">
        <span>
          This is the total amount of tokens you have withdrawn so far.
        </span>
      </div>
    ),
  },
];

export const extraItem = {
  title: "Vesting Card",
  element: ".vesting-card",
  intro: (
    <div className="flex flex-col">
      <span className="mb-2">
        This section shows all the currently active programs you invested in.
      </span>

      <span>
        You can claim the available amount of tokens, buy a fast pass or wait
        until the end of the vesting period.
      </span>
    </div>
  ),
};

export default stepItemsVesting;
