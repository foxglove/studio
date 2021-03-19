// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import DatabaseIcon from "@mdi/svg/svg/database.svg";
import PlusCircleOutlineIcon from "@mdi/svg/svg/plus-circle-outline.svg";
import { useState } from "react";
import styled from "styled-components";

import Button from "@foxglove-studio/app/components/Button";
import Checkbox from "@foxglove-studio/app/components/Checkbox";
import Icon from "@foxglove-studio/app/components/Icon";
import Panel from "@foxglove-studio/app/components/Panel";
import TextContent from "@foxglove-studio/app/components/TextContent";
import TextField from "@foxglove-studio/app/components/TextField";
import { isEmail } from "@foxglove-studio/app/shared/validators";
import colors from "@foxglove-studio/app/styles/colors.module.scss";

const Term = styled.span`
  color: ${colors.accent};
  font-weight: bold;
`;

function validateEmail(str: string): string | undefined {
  return isEmail(str) ? undefined : "Enter a valid e-mail address";
}

function WelcomePanel() {
  const [subscribeChecked, setSubscribeChecked] = useState(true);
  const [slackInviteChecked, setSlackInviteChecked] = useState(true);
  const [emailValue, setEmailValue] = useState("");

  const submitEnabled = (subscribeChecked || slackInviteChecked) && emailValue.length > 0;

  return (
    <TextContent style={{ padding: 12, overflowY: "auto" }}>
      <h1>Welcome to {APP_NAME}</h1>
      <p>
        {APP_NAME} is an integrated visualization and debugging tool for robotics. It allows you to
        quickly and easily understand what’s happening in real-time, and provides a unique
        visualization and development experience.
      </p>
      <p>
        The configuration of views and graphs you’re looking at now is called the{" "}
        <Term>layout</Term>. Each view is a <Term>panel</Term>. Click the{" "}
        <Icon clickable={false}>
          <PlusCircleOutlineIcon />
        </Icon>{" "}
        icon above and try adding a new panel.
      </p>
      <p>
        Want to view data from your own <Term>bag file</Term>? Double-click the bag file to open it
        with {APP_NAME}, or just drag &amp; drop it here. Click{" "}
        <Icon clickable={false}>
          <DatabaseIcon />
        </Icon>{" "}
        in the upper left to select another data source.
      </p>
      <p>
        To get in touch with us and learn more tips &amp; tricks, join our Slack workspace and
        subscribe to our mailing list:
      </p>
      <TextField
        placeholder="me@example.com"
        value={emailValue}
        onChange={setEmailValue}
        validator={validateEmail}
      />
      <Checkbox
        label={`Send me updates about ${APP_NAME}`}
        checked={subscribeChecked}
        onChange={setSubscribeChecked}
      />
      <Checkbox
        label={`Invite me to the Slack workspace`}
        checked={slackInviteChecked}
        onChange={setSlackInviteChecked}
      />
      <Button isPrimary disabled={!submitEnabled} onClick={() => alert("Not yet supported")}>
        Sign Up
      </Button>
    </TextContent>
  );
}

export default Panel(
  Object.assign(WelcomePanel, {
    panelType: "onboarding.welcome",
    defaultConfig: {},
  }),
);
