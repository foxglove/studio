// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import DatabaseIcon from "@mdi/svg/svg/database.svg";
import PlusCircleOutlineIcon from "@mdi/svg/svg/plus-circle-outline.svg";
import { useState } from "react";
import { useAsyncFn } from "react-use";
import styled from "styled-components";

import OsContextSingleton from "@foxglove-studio/app/OsContextSingleton";
import Button from "@foxglove-studio/app/components/Button";
import Checkbox from "@foxglove-studio/app/components/Checkbox";
import Flex from "@foxglove-studio/app/components/Flex";
import Icon from "@foxglove-studio/app/components/Icon";
import Panel from "@foxglove-studio/app/components/Panel";
import PanelToolbar from "@foxglove-studio/app/components/PanelToolbar";
import TextContent from "@foxglove-studio/app/components/TextContent";
import TextField from "@foxglove-studio/app/components/TextField";
import { useAsyncAppConfigurationValue } from "@foxglove-studio/app/hooks/useAsyncAppConfigurationValue";
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
  const [subscribedState, setSubscribed] = useAsyncAppConfigurationValue<boolean>(
    "onboarding.subscribed",
  );
  const [subscribeChecked, setSubscribeChecked] = useState(true);
  const [slackInviteChecked, setSlackInviteChecked] = useState(true);
  const [emailValue, setEmailValue] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();

  const [submitState, submit] = useAsyncFn(async () => {
    if (slackInviteChecked) {
      OsContextSingleton?.handleJoinSlackClick();
    }
    if (subscribeChecked && process.env.SIGNUP_API_URL != undefined) {
      const response = await fetch(process.env.SIGNUP_API_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      if (response.status !== 200) {
        throw new Error("We were unable to process your signup request. Sorry!");
      }
    }
    await setSubscribed(true);
  }, [slackInviteChecked, subscribeChecked, setSubscribed, emailValue]);

  const loading = subscribedState.loading || submitState.loading;
  const error = submitState.error ?? subscribedState.error;
  const subscribed = subscribedState.value ?? false;

  const submitEnabled =
    (subscribeChecked || slackInviteChecked) &&
    emailValue.length > 0 &&
    emailError == undefined &&
    !loading;

  return (
    <Flex col scroll>
      <PanelToolbar floating />
      <TextContent style={{ padding: 12 }}>
        <h1>Welcome to {APP_NAME}</h1>
        <p>
          {APP_NAME} is an integrated visualization and debugging tool for robotics. It allows you
          to quickly and easily understand what’s happening in real-time, and provides a unique
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
          Want to view data from your own <Term>ROS bag file</Term>? Double-click a bag file to open
          it with {APP_NAME}, or just drag &amp; drop it here. Click{" "}
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
          onError={setEmailError}
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
        <Button
          isPrimary={subscribedState.value === false}
          disabled={!submitEnabled}
          onClick={submit}
        >
          {loading ? "Loading…" : "Sign Up"}
        </Button>{" "}
        {error ? (
          <span style={{ color: colors.red }}>{error.toString()}</span>
        ) : subscribed ? (
          <span style={{ color: colors.green }}>Thanks for signing up!</span>
        ) : undefined}
      </TextContent>
    </Flex>
  );
}

export default Panel(
  Object.assign(WelcomePanel, {
    panelType: "onboarding.welcome",
    defaultConfig: {},
  }),
);
