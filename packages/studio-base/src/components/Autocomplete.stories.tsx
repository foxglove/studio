import { range } from "lodash";
import { Component } from "react";
import TestUtils from "react-dom/test-utils";

import Autocomplete from "@foxglove/studio-base/components/Autocomplete";

function focusInput(el: HTMLDivElement | ReactNull) {
  if (el) {
    const input = el.querySelector("input");
    if (input) {
      input.focus();
    }
  }
}

export default {
  title: "components/Autocomplete",

  parameters: {
    colorScheme: "dark",
  },
};

export const FilteringToO = () => {
  class Example extends Component {
    public override render() {
      return (
        <div style={{ padding: 20 }} ref={focusInput}>
          <Autocomplete
            items={["one", "two", "three"]}
            filterText="o"
            value="o"
            onSelect={() => {}}
            hasError
          />
        </div>
      );
    }
  }
  return <Example />;
};

FilteringToO.storyName = "filtering to 'o'";

export const FilteringToOLight = () => {
  class Example extends Component {
    public override render() {
      return (
        <div style={{ padding: 20 }} ref={focusInput}>
          <Autocomplete
            items={["one", "two", "three"]}
            filterText="o"
            value="o"
            onSelect={() => {}}
            hasError
          />
        </div>
      );
    }
  }
  return <Example />;
};

FilteringToOLight.storyName = "filtering to 'o' light";
FilteringToOLight.parameters = { colorScheme: "light" };

export const WithNonStringItemsAndLeadingWhitespace = () => {
  return (
    <div style={{ padding: 20 }} ref={focusInput}>
      <Autocomplete
        items={[
          { value: "one", text: "ONE" },
          { value: "two", text: "    TWO" },
          { value: "three", text: "THREE" },
        ]}
        getItemText={({ text }: any) => text}
        filterText="o"
        value="o"
        onSelect={() => {}}
      />
    </div>
  );
};

WithNonStringItemsAndLeadingWhitespace.storyName = "with non-string items and leading whitespace";

export const UncontrolledValue = () => {
  return (
    <div
      style={{ padding: 20 }}
      ref={(el) => {
        if (el) {
          const input: HTMLInputElement | undefined = el.querySelector("input") as any;
          if (input) {
            input.focus();
            input.value = "h";
            TestUtils.Simulate.change(input);
          }
        }
      }}
    >
      <Autocomplete
        items={[{ value: "one" }, { value: "two" }, { value: "three" }]}
        getItemText={({ value }: any) => `item: ${value.toUpperCase()}`}
        onSelect={() => {}}
      />
    </div>
  );
};

UncontrolledValue.storyName = "uncontrolled value";

export const UncontrolledValueLight = () => {
  return (
    <div
      style={{ padding: 20 }}
      ref={(el) => {
        if (el) {
          const input: HTMLInputElement | undefined = el.querySelector("input") as any;
          if (input) {
            input.focus();
            input.value = "h";
            TestUtils.Simulate.change(input);
          }
        }
      }}
    >
      <Autocomplete
        items={[{ value: "one" }, { value: "two" }, { value: "three" }]}
        getItemText={({ value }: any) => `item: ${value.toUpperCase()}`}
        onSelect={() => {}}
      />
    </div>
  );
};

UncontrolledValueLight.storyName = "uncontrolled value light";
UncontrolledValueLight.parameters = { colorScheme: "light" };

export const UncontrolledValueWithSelectedItem = () => {
  return (
    <div style={{ padding: 20 }} ref={focusInput}>
      <Autocomplete
        items={[{ value: "one" }, { value: "two" }, { value: "three" }]}
        getItemText={({ value }: any) => `item: ${value.toUpperCase()}`}
        selectedItem={{ value: "two" }}
        onSelect={() => {}}
      />
    </div>
  );
};

UncontrolledValueWithSelectedItem.storyName = "uncontrolled value with selected item";

export const UncontrolledValueWithSelectedItemAndClearOnFocus = () => {
  return (
    <div style={{ padding: 20 }} ref={focusInput}>
      <Autocomplete
        items={[{ value: "one" }, { value: "two" }, { value: "three" }]}
        getItemText={({ value }: any) => `item: ${value.toUpperCase()}`}
        selectedItem={{ value: "two" }}
        onSelect={() => {}}
        selectOnFocus
      />
    </div>
  );
};

UncontrolledValueWithSelectedItemAndClearOnFocus.storyName = "uncontrolled value with selected item and clearOnFocus";

export const SortWhenFilteringFalse = () => {
  return (
    <div style={{ padding: 20 }} ref={focusInput}>
      <Autocomplete
        items={[{ value: "bab" }, { value: "bb" }, { value: "a2" }, { value: "a1" }]}
        getItemText={({ value }: any) => `item: ${value.toUpperCase()}`}
        value="b"
        onSelect={() => {}}
        sortWhenFiltering={false}
      />
    </div>
  );
};

SortWhenFilteringFalse.storyName = "sortWhenFiltering=false";

export const WithALongTruncatedPathAndAutoSize = () => {
  class Example extends Component {
    public override render() {
      return (
        <div style={{ maxWidth: 200 }} ref={focusInput}>
          <Autocomplete
            items={[]}
            value="/abcdefghi_jklmnop.abcdefghi_jklmnop[:]{some_id==1297193}.isSomething"
            onSelect={() => {}}
            autoSize
          />
        </div>
      );
    }
  }
  return <Example />;
};

WithALongTruncatedPathAndAutoSize.storyName = "with a long truncated path (and autoSize)";

export const ManyItems = () => {
  const items = range(1, 1000).map((i) => `item_${i}`);
  class Example extends Component {
    public override render() {
      return (
        <div style={{ maxWidth: 200 }} ref={focusInput}>
          <Autocomplete items={items} onSelect={() => {}} autoSize />
        </div>
      );
    }
  }
  return <Example />;
};

ManyItems.storyName = "many items";
