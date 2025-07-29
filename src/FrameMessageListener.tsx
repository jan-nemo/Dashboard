import {type ReactNode, useEffect} from "react";
import useFrameRegistryContext from "./useFrameRegistryContext.ts";
import frameMessageBus from "./frameMessageBus.ts";
import {isFrameMessage} from "./types.ts";

type Props = {
  children: ReactNode;
};

const FrameMessageListener = ({ children }: Props) => {
  const { getFrame } = useFrameRegistryContext();

  useEffect(() => {
    window.addEventListener('message', handleMessage, false);

    return () => window.removeEventListener('message', handleMessage, false);

    function handleMessage(event: MessageEvent) {
      if (!event.source)
        return;

      console.log(event.data);

      const frame = getFrame(event.source as Window);
      if (!frame)
        return;

      if (event.origin !== frame.origin)
        return;

      const message: unknown = event.data;
      if (!isFrameMessage(message))
        return;

      frameMessageBus.publish(message, frame);
    }
  }, [getFrame]);

  return children;
};

export default FrameMessageListener;