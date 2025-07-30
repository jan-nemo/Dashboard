import {type CSSProperties, useEffect, useRef} from "react";
import useFrameRegistryContext from "./useFrameRegistryContext.ts";
import Frame from "./Frame.ts";

type Props = {
  url: string;
  style: CSSProperties
}

const FrameContainer = ({ url, style }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { registerFrame, unregisterFrame } = useFrameRegistryContext();

  useEffect(() => {
    const window = iframeRef.current?.contentWindow;
    if (!window)
      return;

    registerFrame(
      window, 
      new Frame(window, new URL(url).origin)
    );

    return () => unregisterFrame(window);
  }, [registerFrame, unregisterFrame, url]);

  return <iframe
    src={url}
    ref={iframeRef}
    style={style}
  />
};

export default FrameContainer;