import React from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";

export const Search = ({ placeholder , value , onChange}) => {
  return (
    <div className="relative h-min w-full">
      <input
        type="text"
        placeholder={placeholder}
        className="placeholder:text-white-400 w-full lg:w-[354px] text-white bg-white-500 rounded-sm border-0 m-0 leading-[16px] text-3.5 py-3 pl-4 pr-12"
        name="search"
        id="search"
        value={value}
        onChange={onChange}
      />
      <button
        type={"submit"}
        className="absolute inset-0 left-auto px-4 flex justify-center items-center hover:stroke-white-300"
      >
        <MagnifyingGlassIcon className="fill-white-300 w-5 h-5" />
      </button>
    </div>
  );
};
