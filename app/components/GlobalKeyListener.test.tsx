/** @jest-environment jsdom */
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { mount } from "enzyme";

import GlobalKeyListener from "@foxglove/studio-base/components/GlobalKeyListener";
import MockMessagePipelineProvider from "@foxglove/studio-base/components/MessagePipeline/MockMessagePipelineProvider";
import CurrentLayoutContext, {
  CurrentLayout,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import { defaultPlaybackConfig } from "@foxglove/studio-base/providers/CurrentLayoutProvider/reducers";

describe("GlobalKeyListener", () => {
  let mockContext: CurrentLayout | undefined;
  let unmount: (() => void) | undefined;

  beforeEach(() => {
    mockContext = {
      state: {
        configById: {},
        globalVariables: {},
        userNodes: {},
        linkedGlobalVariables: [],
        playbackConfig: defaultPlaybackConfig,
      },
      mosaicId: "x",
      selectedPanelIds: [],
      getSelectedPanelIds: () => [],
      setSelectedPanelIds: () => {},
      actions: {
        getCurrentLayout: jest.fn(),
        undoLayoutChange: jest.fn(),
        redoLayoutChange: jest.fn(),
        savePanelConfigs: jest.fn(),
        updatePanelConfigs: jest.fn(),
        createTabPanel: jest.fn(),
        changePanelLayout: jest.fn(),
        loadLayout: jest.fn(),
        overwriteGlobalVariables: jest.fn(),
        setGlobalVariables: jest.fn(),
        setUserNodes: jest.fn(),
        setLinkedGlobalVariables: jest.fn(),
        setPlaybackConfig: jest.fn(),
        closePanel: jest.fn(),
        splitPanel: jest.fn(),
        swapPanel: jest.fn(),
        moveTab: jest.fn(),
        addPanel: jest.fn(),
        dropPanel: jest.fn(),
        startDrag: jest.fn(),
        endDrag: jest.fn(),
      },
    };

    const wrapper = document.createElement("div");
    document.body.appendChild(wrapper);
    const root = mount(
      <CurrentLayoutContext.Provider value={mockContext}>
        <MockMessagePipelineProvider>
          <div data-nativeundoredo="true">
            <textarea id="some-text-area" />
          </div>
          <GlobalKeyListener />
          <textarea id="other-text-area" />
        </MockMessagePipelineProvider>
      </CurrentLayoutContext.Provider>,
      { attachTo: wrapper },
    );
    unmount = () => root.unmount();
  });
  afterEach(() => {
    unmount?.();
  });

  it("fires undo events", () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true }));
    expect(mockContext?.actions.redoLayoutChange).not.toHaveBeenCalled();
    expect(mockContext?.actions.undoLayoutChange).toHaveBeenCalledTimes(1);
  });

  it("fires redo events", () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "z", ctrlKey: true, shiftKey: true }),
    );
    expect(mockContext?.actions.redoLayoutChange).toHaveBeenCalledTimes(1);
    expect(mockContext?.actions.undoLayoutChange).not.toHaveBeenCalled();
  });

  it("does not fire undo/redo events from editable fields", () => {
    const shareTextarea = document.getElementById("some-text-area");
    if (shareTextarea == undefined) {
      throw new Error("could not find shareTextArea.");
    }
    shareTextarea.dispatchEvent(
      new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }),
    );
    expect(mockContext?.actions.undoLayoutChange).not.toHaveBeenCalled();
    expect(mockContext?.actions.redoLayoutChange).not.toHaveBeenCalled();

    // Check that it does fire in a different text area.
    const otherTextarea = document.getElementById("other-text-area");
    if (!otherTextarea) {
      throw new Error("could not find otherTextArea.");
    }
    otherTextarea.dispatchEvent(
      new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }),
    );
    expect(mockContext?.actions.undoLayoutChange).not.toHaveBeenCalled();
    expect(mockContext?.actions.redoLayoutChange).not.toHaveBeenCalled();
  });
});
