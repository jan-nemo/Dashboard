import {createContext} from "react";
import type Frame from "./Frame";

type WidgetConnector = {
  connect: (window: Window, frame: Frame) => () => void;
  getFrame: (window: Window) => Frame | undefined;
  getFrames: () => ReadonlyArray<Frame>;
};

const WidgetConnectorContext = createContext<FrameRegistry | null>(null);

export default WidgetConnectorContext;