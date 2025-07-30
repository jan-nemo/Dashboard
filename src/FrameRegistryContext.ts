import {createContext} from "react";
import type Frame from "./Frame";

type FrameRegistry = {
  registerFrame: (window: Window, frame: Frame) => () => void;
  getFrame: (window: Window) => Frame | undefined;
  getFrames: () => ReadonlyArray<Frame>;
};

const FrameRegistryContext = createContext<FrameRegistry | null>(null);

export default FrameRegistryContext;