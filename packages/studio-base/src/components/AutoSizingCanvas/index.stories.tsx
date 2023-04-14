import { useState, useEffect } from "react";

import AutoSizingCanvas from ".";

function Example({
  changeSize = false,
  changePixelRatio = false,
  devicePixelRatio,
}: {
  changeSize?: boolean;
  changePixelRatio?: boolean;
  devicePixelRatio?: number;
}) {
  const [width, setWidth] = useState(300);
  const [pixelRatio, setPixelRatio] = useState(devicePixelRatio);
  useEffect(() => {
    const timeOutID = setTimeout(() => {
      if (changeSize) {
        setWidth(150);
      }
      if (changePixelRatio) {
        setPixelRatio(2);
      }
    }, 10);

    return () => {
      clearTimeout(timeOutID);
    };
  }, [changePixelRatio, changeSize]);

  return (
    <div style={{ width, height: 100, backgroundColor: "green" }}>
      <AutoSizingCanvas
        overrideDevicePixelRatioForTest={pixelRatio}
        draw={(ctx, drawWidth, drawHeight) => {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, drawWidth, drawHeight);
          ctx.strokeStyle = "red";
          ctx.lineWidth = 2;
          ctx.font = "24px Arial";
          ctx.strokeRect(0, 0, drawWidth, drawHeight);

          const text = `hello ${ctx.getTransform().a}`;
          const size = ctx.measureText(text);
          ctx.fillStyle = "black";
          ctx.textBaseline = "middle";
          ctx.fillText(text, drawWidth / 2 - size.width / 2, drawHeight / 2);
        }}
      />
    </div>
  );
}

export default {
  title: "components/AutoSizingCanvas",
};

export const Static = () => <Example />;

Static.storyName = "static";

export const ChangingSize = () => <Example changeSize />;

ChangingSize.storyName = "changing size";

export const PixelRatio2 = () => <Example devicePixelRatio={2} />;

PixelRatio2.storyName = "pixel ratio 2";

export const ChangingPixelRatio = () => <Example changePixelRatio />;

ChangingPixelRatio.storyName = "changing pixel ratio";
