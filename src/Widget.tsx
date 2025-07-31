import {type CSSProperties, useEffect, useRef} from "react";
import {useWidgetConnect, type WidgetId} from "./WidgetConnector.tsx";

type Props = {
  id: WidgetId
  url: string;
  style: CSSProperties
}

const Widget = ({ id, url, style }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const connect = useWidgetConnect();

  useEffect(() => {
    const window = iframeRef.current?.contentWindow;
    if (!window)
      return;

    const origin = new URL(url).origin;
    
    return connect(id, window, origin);
  }, [connect, id, url]);

  return <iframe
    src={url}
    ref={iframeRef}
    style={style}
  />
};

export default Widget;