// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { Component, PropsWithChildren, ReactNode } from "react";

type Props = {
  onError: (err: Error) => void;
};

/** An error boundary that calls an onError function when it captures an error */
export class CaptureErrorBoundary extends Component<PropsWithChildren<Props>, unknown> {
  public override componentDidCatch(error: Error): void {
    this.props.onError(error);
  }

  public override render(): ReactNode {
    return this.props.children;
  }
}
