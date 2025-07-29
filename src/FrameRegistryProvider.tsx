import {type ReactNode, useCallback, useMemo, useRef} from "react";
import FrameRegistryContext from "./FrameRegistryContext.ts";
import type {Frame} from "./types.ts";

type Props = {
  children: ReactNode;
};

const FrameRegistryProvider = ({ children }: Props) => {
  const registryRef = useRef<Map<Window, Frame>>(new Map());

  const registerFrame = useCallback((window: Window, origin: string) => {
    registryRef.current.set(window, {
      origin,
      postMessage: message => window.postMessage(message, origin),
      connected: false
    });
  }, []);
  const unregisterFrame = useCallback((window: Window) => {
    registryRef.current.delete(window);
  }, []);
  const getFrame = useCallback((window: Window) => registryRef.current.get(window), []);
  const getFrames = useCallback(() => [...registryRef.current.values()], []);

  const value = useMemo(() => ({
    registerFrame,
    unregisterFrame,
    getFrame,
    getFrames,
  }), [registerFrame, unregisterFrame, getFrame, getFrames]);

  return (
    <FrameRegistryContext.Provider value={value}>
      {children}
    </FrameRegistryContext.Provider>
  );
};

export default FrameRegistryProvider;