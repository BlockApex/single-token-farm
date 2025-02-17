/* This example requires Tailwind CSS v2.0+ */
import { Fragment, useMemo } from "react";
import { useTheme } from "@/hooks/theme";
import { Flex, useColorModeValue } from "@chakra-ui/react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";

interface Item<V> {
  label: string;
  value: V | null;
}

export function Select<V>({
  value,
  onChange,
  items,
  placeholder,
}: {
  items: readonly Item<V>[];
  placeholder: string;
  value: V | null;
  onChange: (value: V | null) => void;
}) {
  const {
    jumpGradient,
    gradientBackground,
    darkPurple,
    glassyWhite,
    glassyWhiteOpaque,
  } = useTheme();

  const selected = useMemo(() => {
    return items.find((item) => item.value === value);
  }, [value]);

  return (
    <Listbox
      value={value}
      onChange={(newValue) => onChange(newValue === value ? null : newValue)}
    >
      {({ open }) => (
        <>
          <div className="mt-1 relative">
            <Listbox.Button>
              <Flex
                bg={jumpGradient}
                className="p-[2px] rounded-[17px] min-w-[159px]"
              >
                <Flex
                  bg={useColorModeValue(gradientBackground, "#21002F")}
                  className="cursor-pointer w-full items-center justify-between min-w-[110px] p-[12px] h-[60px] rounded-[15px]"
                >
                  <span className="first-letter:uppercase truncate pl-[15px] pr-[30px] text-[16px]">
                    {selected?.label ?? placeholder}
                  </span>

                  <ChevronUpDownIcon className="h-[18px]" />
                </Flex>
              </Flex>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="cursor-pointer shadow-lg cursor-pointer">
                <Flex
                  bg={jumpGradient}
                  className="absolute z-10 mt-1 w-full max-h-60 overflow-auto focus:outline-none cursor-pointer shadow-lg p-[2px] rounded-[17px] overflow-hidden"
                >
                  <Flex
                    className="flex-col w-full rounded-[15px] overflow-hidden"
                    bg={useColorModeValue(gradientBackground, "#21002F")}
                  >
                    {items.map(({ label, value }) => (
                      <Listbox.Option
                        key={"select-option-" + value}
                        value={value}
                        className="cursor-pointer overflow-hidden"
                      >
                        {({ selected }) => (
                          <Flex
                            _hover={{
                              bg: useColorModeValue(darkPurple, "white"),
                              color: useColorModeValue("white", "black"),
                            }}
                            className="cursor-default select-none relative py-2 pl-3 pr-9 cursor-pointer"
                          >
                            <Flex className="block truncate first-letter:uppercase cursor-pointer">
                              {label}
                            </Flex>

                            {selected ? (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            ) : null}
                          </Flex>
                        )}
                      </Listbox.Option>
                    ))}
                  </Flex>
                </Flex>
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}
