import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";

export const stepItemsProjects = [
  {
    element: ".top-card",
    title: "Launchpad Projects",
    intro: (
      <div>
        <span>
          This is the Launchpad projects page. Here you can stake your xJump,
          watch your current tier and search Vesting Projects
        </span>
      </div>
    ),
  },
  {
    title: "Member Area",
    element: ".member-area",
    intro: (
      <div className="flex flex-col">
        <span className="mb-2">This is member area.</span>

        <span>
          In this section you can stake your xJump tokens, check your level,
          consult the amount of staked tokens and the total of your allocations.
        </span>
      </div>
    ),
  },
  {
    title: "Projects",
    element: ".projects",
    intro: (
      <div className="flex flex-col">
        <span>
          All Investment projects are listed here, you can filter to show only
          your projects or private sale projects.
        </span>
      </div>
    ),
  },
];

const MemberAreaTutorialTitle = () => {
  return (
    <div
      className="flex flex-row items-center justify-start gap-2
    mb-[21px]"
    >
      <div className="w-[16px] h-[16px]">
        <QuestionMarkOutlinedIcon />
      </div>
      <span className="text-[16px] font-bold">Jump Pad Allocation tier</span>
    </div>
  );
};

export const stepItemsMemberArea = [
  {
    element: ".member-area",
    intro: (
      <div className="flex flex-col">
        <MemberAreaTutorialTitle />
        <span>
          The Jump Pad features a two-round system for public sales that ensures
          every tier level is guaranteed a token allocation. Traders of all
          sizes have the opportunity to invest in the best upcoming projects
          within the NEAR Protocol ecosystem.
        </span>
      </div>
    ),
    tooltipClass: "member-area-tooltip",
  },
  {
    element: ".member-area",
    intro: (
      <div className="flex flex-col">
        <MemberAreaTutorialTitle />
        <span>
          In the first round users can purchase the amount of tokens allotted to
          them based on their allocation tier. There are six allocation tiers:
          Bronze, Silver, Gold, Tungsten, Platinum, Diamond. Allocation tiers
          are determined by the quantity of xJUMP token staked for any given
          sale.
        </span>
      </div>
    ),
    tooltipClass: "member-area-tooltip",
  },
  {
    element: ".member-area",
    intro: (
      <div className="flex flex-col">
        <MemberAreaTutorialTitle />
        <span>
          In round 2, any unsold tokens from the first round are made available
          to the public on a FCFS basis. This round will remain open until all
          remaining tokens are sold.
        </span>
      </div>
    ),
    tooltipClass: "member-area-tooltip",
  },
  {
    element: ".tier-box",
    intro: (
      <div className="flex flex-col">
        <MemberAreaTutorialTitle />
        <ul>
          <li>1. Bronze: 100 xJUMP</li>
          <li>2. Tungsten: 250 xJUMP</li>
          <li>3. Silver: 500 xJUMP</li>
          <li>4. Gold: 1000 xJUMP</li>
          <li>5. Platinum: x2500 JUMP</li>
          <li>6. Diamond: x5000 JUMP</li>
        </ul>
      </div>
    ),
    tooltipClass: "member-area-tooltip",
  },
  {
    element: ".allocation-tier-box",
    intro: (
      <div className="flex flex-col">
        <MemberAreaTutorialTitle />
        <span>
          Your current allocation tier based on the amount of xJUMP staked.
        </span>
      </div>
    ),
    tooltipClass: "member-area-tooltip",
  },
  {
    element: ".jump-staked-box",
    intro: (
      <div className="flex flex-col">
        <MemberAreaTutorialTitle />
        <span>Your amount of xJUMP staked on the Jump Pad.</span>
      </div>
    ),
    tooltipClass: "member-area-tooltip",
  },
];

export const stepItemsProject = [
  {
    element: ".project-info",
    title: "Jump Pad Project",
    intro: (
      <div>
        <span>
          Here is the Project Page, this is the page where you can view all the
          information of a Vesting Project.
        </span>
      </div>
    ),
  },
  {
    title: "Project Details and Investments",
    element: ".details",
    intro: (
      <div className="flex flex-col">
        <span>
          In the Pool Details/My Investments section you will find the most
          diverse technical information about the Vesting Project and everything
          about the Vesting Project.
        </span>
      </div>
    ),
  },
  {
    title: "Investment Session",
    element: ".investment",
    intro: (
      <div className="flex flex-col">
        <span>
          It is in this section that you will find all the information to enter
          the Vesting Project.
        </span>
      </div>
    ),
  },
];

export default MemberAreaTutorialTitle;
