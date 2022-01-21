// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import styled, { keyframes } from "styled-components";

const Tick = styled.div<{ angle: number }>`
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotate(${({ angle }) => angle}turn);
  opacity: ${({ angle }) => angle};

  ::after {
    content: "";
    position: absolute;
    width: 4px;
    border-radius: 2px;
    height: 30%;
    left: 50%;
    transform: translateX(-50%);
    background: #acacac;
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0turn);
  }
  to {
    transform: rotate(1turn);
  }
`;
const Wrapper = styled.div<{ ticks: number }>`
  width: 50px;
  height: 50px;
  position: relative;

  animation: ${spin};
  animation-duration: 1s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  /* animation-timing-function: ${({ ticks }) => `steps(${ticks}, end)`}; */
`;

const pulse = keyframes`
  from {
    opacity: 0.25;
  }
  to {
    opacity: 1;
  }
`;
const Pulse = styled.div`
  animation: ${pulse} 1s linear alternate infinite;
`;

export default function Spinner(): JSX.Element {
  const ticks = 8;
  return (
    <Pulse>Loading…</Pulse>
    // <Wrapper ticks={ticks}>
    //   {new Array(ticks).fill(undefined).map((_, i) => (
    //     <Tick key={i} angle={(i + 1) / ticks} />
    //   ))}
    // </Wrapper>
  );
}
