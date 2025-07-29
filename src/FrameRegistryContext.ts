import {createContext} from "react";
import { type Frame } from "./types";

const FrameRegistryContext = createContext<{
  registerFrame: (window: Window, origin: string) => void;
  unregisterFrame: (window: Window) => void;
  getFrame: (window: Window) => Frame | undefined;
  getFrames: () => ReadonlyArray<Frame>;
} | null>(null);

export default FrameRegistryContext;