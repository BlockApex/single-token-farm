import { Flex, Button, Input, useNumberInput } from "@chakra-ui/react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

export function NumberInput({
  value,
  onChange,
  min = 0,
  max,
}: {
  value: string | number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  const { getInputProps, getIncrementButtonProps, getDecrementButtonProps } =
    useNumberInput({
      min,
      max,
      value,
      onChange: (_, valueNumber) => onChange(valueNumber),
    });

  const input = getInputProps();
  const inc = getIncrementButtonProps();
  const dec = getDecrementButtonProps();

  return (
    <Flex className="space-x-[4px]">
      <Input
        {...input}
        className="rounded-[10px] h-[40px] bg-[rgba(252,252,252,0.2)] border-transparent"
      />

      <Button
        {...inc}
        className="w-[40px] h-[40px] bg-white hover:opacity-[0.8] disabled:opacity-[0.5]"
      >
        <PlusIcon className="w-[18px] h-[18px] text-[#431E5A]" />
      </Button>

      <Button
        {...dec}
        className="w-[40px] h-[40px] bg-white hover:opacity-[0.8] disabled:opacity-[0.5]"
      >
        <MinusIcon className="w-[18px] h-[18px] text-[#431E5A]" />
      </Button>
    </Flex>
  );
}
