import {type CSSProperties, useEffect, useRef} from "react";
import useFrameRegistryContext from "./useFrameRegistryContext.ts";

type Props = {
  url: string;
  style: CSSProperties
}

const Frame = ({ url, style }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { registerFrame, unregisterFrame } = useFrameRegistryContext();

  useEffect(() => {
    const window = iframeRef.current?.contentWindow;
    if (!window)
      return;

    const origin = new URL(url).origin;
    registerFrame(window, origin);

    return () => unregisterFrame(window);
  }, [registerFrame, unregisterFrame, url]);

  return <iframe
    src={url}
    ref={iframeRef}
    style={style}
  />
};

export default Frame;