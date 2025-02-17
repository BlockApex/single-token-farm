import { Switch } from "@headlessui/react";
import React, { PropsWithChildren, useMemo } from "react";
import CheckBox from "./CheckBox.component";

type SelectProps = PropsWithChildren & {
  selected: boolean;
  showCheckbox?: boolean;
  onChange: (selected: boolean) => void;
  className?: string;
  small?: boolean;
};

function Select(props: SelectProps) {
  const { selected, showCheckbox, onChange, children, className, small } =
    props;
  const isSelected = useMemo(() => selected, [selected]);

  const onSelectChange = (selected) => {
    selected = !selected;
    onChange(selected);
  };

  return (
    <Switch
      checked={isSelected}
      onChange={onSelectChange}
      as="div"
      className={"relative " + className}
    >
      {children}
      {showCheckbox && <CheckBox checked={isSelected} small={small} />}
    </Switch>
  );
}

Select.CheckBox = CheckBox;
export default Select;
