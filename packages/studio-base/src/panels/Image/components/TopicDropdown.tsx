// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useMemo } from "react";

type TopicDropdownItem = {
  name: string;
  selected: boolean;
};

type Props = {
  title: string;
  items: TopicDropdownItem[];
  open?: boolean;
  onChange: (activeTopics: string[]) => void;
};

const menuProps = {
  MenuListProps: {
    dense: true,
  },
};

export function TopicDropdown(props: Props): JSX.Element {
  const { items, onChange, title } = props;

  const selectedTopics = useMemo<string[]>(() => {
    return items.filter((item) => item.selected).map((item) => item.name);
  }, [items]);

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    onChange(typeof value === "string" ? [value] : value);
  };

  return (
    <>
      <Select
        value={selectedTopics}
        disabled={items.length === 0}
        displayEmpty
        title={title}
        renderValue={(_selected) => title}
        size="small"
        variant="filled"
        onChange={handleChange}
        open={props.open}
        MenuProps={menuProps}
      >
        {items.length === 0 && (
          <MenuItem disabled value="">
            No camera topics
          </MenuItem>
        )}
        {items.map((item) => (
          <MenuItem key={item.name} value={item.name}>
            {item.name}
          </MenuItem>
        ))}
      </Select>
    </>
  );
}
