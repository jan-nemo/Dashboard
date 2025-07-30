import {createContext} from "react";
import type Frame from "./Frame";

const FrameRegistryContext = createContext<{
  registerFrame: (window: Window, frame: Frame) => void;
  unregisterFrame: (window: Window) => void;
  getFrame: (window: Window) => Frame | undefined;
  getFrames: () => ReadonlyArray<Frame>;
} | null>(null);

export default FrameRegistryContext;