import { Tooltip } from "@chakra-ui/react";
import { useNavigate } from "react-router";
import { navRoutes } from "@/routes";
import { navRoutes as mantleRoute } from "@/mantle-route";
import { navRoutes as telosTestnetRoute } from "@/talos-testnet-route";
import { navRoutes as telosRoute } from "@/telos-route";
import { twMerge } from "tailwind-merge";
import { useChainSelector } from "@/context/chain-selector";

export const Nav = () => {
  const navigate = useNavigate();
  const { chain } = useChainSelector();
  const onClick = (event, route) => {
    event.preventDefault();
    route.enabled && navigate(route.route);
  };

  const renderLink = (route) => {
    const { route: path, enabled, icon, title } = route;

    const {
      location: { pathname },
    } = window;

    const current =
      pathname === path || (path === "/" && pathname.includes("/projects"));

    return (
      <Tooltip
        isDisabled={enabled}
        key={path}
        hasArrow
        label="Coming soon"
        placement="right"
      >
        <a
          href={enabled ? path : null}
          onClick={(event) => onClick(event, route)}
        >
          <div
            className={twMerge(
              "relative before:transition before:content-[' ']",
              "before:rounded-full before:absolute before:aspect-square",
              "before:scale-0 before:w-17 hover:before:scale-125",
              "before:bg-white-600 before:opacity-30 hover:before:opacity-100 font-semibold text-center w-full flex",
              "flex-col items-center justify-center p-4 leading-3 tracking-normal gap-y-[.47rem]",
              current ? "text-white" : "text-white-400"
            )}
          >
            {icon}
            <p className="w-min text-3">{title}</p>
          </div>
        </a>
      </Tooltip>
    );
  };

  return (
    <div className="relative   hidden lg:block h-screen inline-block flex-grow-0 flex-shrink-0 basis-[107px]">
      {/* pb-[98px] = HEADER_HEIGHT + 24px */}
      <nav className="fixed top-16 hidden lg:block h-screen w-[107px] overflow-y-scroll py-4 pb-[98px]">
        {chain === "near" && navRoutes.map(renderLink)}
        {chain === "mantle" && mantleRoute.map(renderLink)}
        {chain === "telos-testnet" && telosTestnetRoute.map(renderLink)}
        {chain === "telos" && telosRoute.map(renderLink)}
      </nav>
    </div>
  );
};