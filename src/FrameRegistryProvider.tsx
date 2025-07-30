import {type ReactNode, useCallback, useEffect, useMemo, useRef} from "react";
import WidgetConnectorContext from "./WidgetConnectorContext.ts";
import Frame from "./Frame";
import {type FrameMessage, isFrameMessage} from "./WidgetMessage.ts";
import frameMessageBus from "./frameMessageBus.ts";
import FrameMessageChannel from "./FrameMessageChannel.ts";

type Props = {
  children: ReactNode;
};

const FrameRegistryProvider = ({ children }: Props) => {
  const registryRef = useRef<Map<Window, Frame>>(new Map());

  const registerFrame = useCallback((window: Window, frame: Frame) => {
    registryRef.current.set(window, frame);

    return () => registryRef.current.delete(window);
  }, []);
  const getFrame = useCallback((window: Window) => registryRef.current.get(window), []);
  const getFrames = useCallback(() => [...registryRef.current.values()], []);

  const value = useMemo(() => ({
    registerFrame,
    getFrame,
    getFrames,
  }), [registerFrame, getFrame, getFrames]);

  return (
    <WidgetConnectorContext.Provider value={value}>
      {children}
    </WidgetConnectorContext.Provider>
  );
};

export default FrameRegistryProvider;

class FrameCo {
  private readonly _registry = new Map<Window, Frame>();
}

interface Frame {
  postMessage<T extends FrameMessage>(message: T): void;
}

type FrameProviderProps = {
  children: ReactNode;
  onAdded: (frame: Frame) => void;
  onRemoved: (frame: Frame) => void;
  onMessage: (event: FrameMessageEvent) => void;
};

type FrameMessageEvent = {
  message: FrameMessage;
  sender: Frame;
};

const WidgetProvider = () => {
  const frameRegistryRef = useRef<Map<Window, Frame>>(new Map());
  const frameMessageChannelRegistryRef = useRef<Map<Frame, FrameMessageChannel>>(new Map());

  const register = useCallback((window: Window, id: string, origin: string) => {


    frameRegistryRef.current.set(window, frame);

    return () => {
      frameMessageChannelRegistryRef.current.get(frame)?.close();
      frameMessageChannelRegistryRef.current.delete(frame);

      frameRegistryRef.current.delete(window);
    };
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage, false);

    return () => window.removeEventListener('message', handleMessage, false);

    function handleMessage(event: MessageEvent) {
      if (!event.source || !(event.source instanceof Window))
        return;

      const frame = frameRegistryRef.current.get(event.source);
      if (!frame)
        return;

      if (event.origin !== frame.url.origin)
        return;

      const message: unknown = event.data;
      if (!isFrameMessage(message))
        return;

      if (message.type !== 'CONNECTION/OPEN')
        return;

      let frameMessageChannel = frameMessageChannelRegistryRef.current.get(frame);
      if (!frameMessageChannel) {
        frameMessageChannel = new FrameMessageChannel();
        frameMessageChannel.port1.onmessage = event => {
          if (isFrameMessage(event.data))
            frameMessageBus.publish(event.data, frame);
        };

        frameMessageChannelRegistryRef.current.set(frame, frameMessageChannel);
      }

      event.source.postMessage(
        { type: "CONNECTION/OPENED" },
        event.origin,
        [frameMessageChannel.port2]
      )
    }
  }, []);
}