import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import { AnchorHTMLAttributes } from "react";
import { useNavigate } from "react-router";

export const BackButton = (props: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const navigate = useNavigate();

  const onClick = (event) => {
    event.preventDefault();
    navigate(props.href as string);
  };

  return (
    <a
      href={props.href}
      onClick={props.onClick || (props.href ? onClick : undefined)}
      className="flex gap-x-3 font-extrabold tracking-tight"
    >
      <ChevronLeftIcon className="w-4" />
      {props.children || "Go Back"}
    </a>
  );
};
