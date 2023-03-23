// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Typography } from "@mui/material";
import { clamp } from "lodash";
import { FixedSizeList, ListChildComponentProps } from "react-window";

const LISTBOX_PADDING = 8;
const ROW_HEIGHT = 24;

function renderRow(props: ListChildComponentProps) {
  const { data, index, style } = props;
  const dataSet = data[index];
  const inlineStyle = {
    ...style,
    top: (style.top as number) + LISTBOX_PADDING,
  };

  return (
    <Typography component="li" noWrap style={inlineStyle}>
      {dataSet}
    </Typography>
  );
}

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef<HTMLDivElement>((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});
OuterElementType.displayName = "OuterElement";

/**
 * React-window adapter for a virtualized list, used in autocomplete.
 */
export const ReactWindowListboxAdapter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLElement>
>(function ListboxComponent(props, ref) {
  const { children, ...other } = props;
  const itemData: React.ReactChild[] = [];
  (children as React.ReactChild[]).forEach(
    (item: React.ReactChild & { children?: React.ReactChild[] }) => {
      itemData.push(item);
      itemData.push(...(item.children ?? []));
    },
  );

  const totalHeight = 2 * LISTBOX_PADDING + ROW_HEIGHT * clamp(itemData.length, 16);

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <FixedSizeList
          height={totalHeight}
          innerElementType="ul"
          itemCount={itemData.length}
          itemData={itemData}
          itemSize={ROW_HEIGHT}
          outerElementType={OuterElementType}
          //   overscanCount={5}
          width="100%"
        >
          {renderRow}
        </FixedSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});
