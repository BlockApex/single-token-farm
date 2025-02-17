const steps = [
  {
    name: "Create account",
    description: "Vitae sed mi luctus laoreet.",
    href: "#",
    status: "complete",
  },
  {
    name: "Profile information",
    description: "Cursus semper viverra facilisis et et some more.",
    href: "#",
    status: "current",
  },
  {
    name: "Business information",
    description: "Penatibus eu quis ante.",
    href: "#",
    status: "upcoming",
  },
  {
    name: "Theme",
    description: "Faucibus nec enim leo et.",
    href: "#",
    status: "upcoming",
  },
  {
    name: "Preview",
    description: "Iusto et officia maiores porro ad non quas.",
    href: "#",
    status: "upcoming",
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const Steps = () => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="overflow-hidden">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={classNames(
              stepIdx !== steps.length - 1 ? "pb-10" : "",
              "relative"
            )}
          >
            {stepIdx !== steps.length - 1 ? (
              <div className="absolute top-4 left-[5px] -ml-px mt-0.5 h-full w-[2px] bg-[rgba(252,252,252,0.2)]" />
            ) : null}

            <div className="group relative flex items-start">
              <span className="flex h-9 items-center">
                <span className="relative z-10 flex h-[10px] w-[10px] items-center justify-center rounded-full border-2 border-gray-300 bg-white" />
              </span>

              <span className="ml-4 flex min-w-0 flex-col">
                <span className="text-sm font-medium text-gray-500">
                  {step.name}
                </span>
                <span className="text-sm text-gray-500">
                  {step.description}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Steps;
