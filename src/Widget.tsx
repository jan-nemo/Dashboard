import {type CSSProperties, useEffect, useRef} from "react";
import {useWidgetConnect} from "./WidgetConnector.tsx";

type Props = {
  url: string;
  style: CSSProperties
}

const Widget = ({ url, style }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const origin = new URL(url).origin;

  const connect = useWidgetConnect();

  useEffect(() => {
    const window = iframeRef.current?.contentWindow;
    if (!window)
      return;

    return connect(window, origin);
  }, [connect, origin]);

  return <iframe
    src={url}
    ref={iframeRef}
    style={style}
  />
};

export default Widget;