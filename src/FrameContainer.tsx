import {type CSSProperties, useEffect, useRef} from "react";
import useFrameRegistry from "./useFrameRegistry";
import Frame from "./Frame.ts";

type Props = {
  url: string;
  style: CSSProperties
}

const FrameContainer = ({ url, style }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { registerFrame } = useFrameRegistry();

  useEffect(() => {
    const window = iframeRef.current?.contentWindow;
    if (!window)
      return;

    const unregisterFrame = registerFrame(
      window, 
      new Frame(new URL(url).origin)
    );

    return () => unregisterFrame();
  }, [registerFrame, url]);

  return <iframe
    src={url}
    ref={iframeRef}
    style={style}
  />
};

export default FrameContainer;