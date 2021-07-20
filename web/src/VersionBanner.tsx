// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import CloseIcon from "@mdi/svg/svg/close.svg";
import { useState, ReactElement } from "react";
import styled from "styled-components";

import "@foxglove/studio-base/styles/global.scss";

const MINIMUM_CHROME_VERSION = 76;

const StyledBanner = styled.div`
  text-align: center;
  width: 100vw;
  padding: 10px;
  background-color: rgba(99, 102, 241, 0.9);
  z-index: 100;
`;
const StyledIconWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  fill: white;
  margin-bottom: -20px;
`;

const VersionBanner = function ({
  isChrome,
  currentVersion,
  isDismissable,
}: {
  isChrome: boolean;
  currentVersion: number;
  isDismissable: boolean;
}): ReactElement | ReactNull {
  const [showBanner, setShowBanner] = useState(true);

  if (!showBanner || currentVersion >= MINIMUM_CHROME_VERSION) {
    return ReactNull;
  }

  const prompt = isChrome
    ? `You're using an outdated version of Chrome. Update to version ${MINIMUM_CHROME_VERSION}+ to continue.`
    : `You're using an unsupported browser. Use Chrome ${MINIMUM_CHROME_VERSION}+ to continue.`;
  const fixText = isChrome ? "Update Chrome" : "Download Chrome";

  return (
    <StyledBanner>
      <div>
        {isDismissable ? (
          <StyledIconWrapper onClick={() => setShowBanner(false)}>
            <CloseIcon />
          </StyledIconWrapper>
        ) : (
          ReactNull
        )}
        <p>{prompt} </p>
        {isChrome ? undefined : (
          <p>
            Check out our browser support progress in{" "}
            <a href="https://github.com/foxglove/studio/issues/1511">this GitHub issue</a>.
          </p>
        )}
      </div>

      <div style={{ paddingTop: "10px" }}>
        <a href="https://www.google.com/chrome/" target="_blank" rel="noreferrer">
          <button>{fixText}</button>
        </a>
      </div>
    </StyledBanner>
  );
};

export default VersionBanner;
