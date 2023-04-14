import { useEffect } from "react";
import TestUtils from "react-dom/test-utils";

import ShareJsonModal from "@foxglove/studio-base/components/ShareJsonModal";

export default {
  title: "components/ShareJsonModal",
};

export const Standard = () => (
  <ShareJsonModal title="Foo" onRequestClose={() => {}} initialValue="" onChange={() => {}} />
);

Standard.storyName = "standard";
Standard.parameters = { colorScheme: "dark" };

export const StandardLight = () => (
  <ShareJsonModal title="Foo" onRequestClose={() => {}} initialValue="" onChange={() => {}} />
);

StandardLight.storyName = "standard light";
StandardLight.parameters = { colorScheme: "light" };

export const Json = () => (
  <ShareJsonModal
    title="Foo"
    onRequestClose={() => {}}
    initialValue={{ foo: "bar", baz: "qux" }}
    onChange={() => {}}
  />
);

Json.storyName = "JSON";
Json.parameters = { colorScheme: "dark" };

export const SubmittingInvalidLayout = () => {
  useEffect(() => {
    setTimeout(() => {
      const textarea = document.querySelector("textarea")!;
      textarea.value = "{";
      TestUtils.Simulate.change(textarea);
    }, 10);
  }, []);
  return (
    <div data-modalcontainer="true">
      <ShareJsonModal title="Foo" onRequestClose={() => {}} initialValue="" onChange={() => {}} />
    </div>
  );
};

SubmittingInvalidLayout.storyName = "submitting invalid layout";
SubmittingInvalidLayout.parameters = { colorScheme: "dark" };
