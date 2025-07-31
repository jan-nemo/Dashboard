import {useEffect, useRef, useState} from "react";
import useWidgetConnect from "./useWidgetConnect.ts";
import type {WidgetId} from "./WidgetId.ts";
import useWidgetMessageBus from "./useWidgetMessageBus.ts";
import {filter, map} from "rxjs";
import type {WidgetMessage} from "./WidgetMessage.ts";

type Props = {
  id: WidgetId
  url: string;
};

function isResizeWidgetMessage(message: WidgetMessage): message is { type: 'RESIZE', payload: { width: string; height: string } } {
  if (message.type !== 'RESIZE')
    return false;

  if (!('payload' in message))
    return false;

  if (typeof message.payload !== 'object')
    return false;

  if (!message.payload)
    return false;

  return (
    ('height'in message.payload && typeof message.payload.height == 'string')
    &&
    ('width' in message.payload && typeof message.payload.width == 'string')
  );
}

function isTitleSetWidgetMessage(message: WidgetMessage): message is { type: 'RESIZE', payload: { title: string } } {
  if (message.type !== 'TITLE/SET')
    return false;

  if (!('payload' in message))
    return false;

  if (typeof message.payload !== 'object')
    return false;

  if (!message.payload)
    return false;

  return 'title'in message.payload && typeof message.payload.title == 'string';
}

const Widget = ({ id, url }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [title, setTitle] = useState<string | null>(null);

  const connect = useWidgetConnect();
  useEffect(() => {
    const window = iframeRef.current?.contentWindow;
    if (!window)
      return;

    const origin = new URL(url).origin;
    
    return connect(id, window, origin);
  }, [connect, id, url]);

  const messageBus = useWidgetMessageBus();
  useEffect(() => {
    const subscription = messageBus.inboundMessage$.pipe(
      filter(inboundMessage => inboundMessage.sender === id),
      map(inboundMessage => inboundMessage.message)
    ).subscribe(message => {
      if (isResizeWidgetMessage(message)) {
        iframeRef.current!.style.width = message.payload.width;
        iframeRef.current!.style.height = message.payload.height;
      }
      if (isTitleSetWidgetMessage(message)) {
        iframeRef.current!.title = message.payload.title;
        setTitle(message.payload.title);
      }
    });

    return () => subscription.unsubscribe();
  }, [id, messageBus]);

  return (
    <div style={{ margin: '10px' }}>
      <h2 style={{ margin: '10px', padding: '10px 0px', display: 'inline' }}>{title}</h2>
      <div style={{ margin: '10px' }}>
        <iframe
          src={url}
          ref={iframeRef}
          loading="lazy"
          style={{ border: '1px solid black', padding: '10px' }}
        />
      </div>
    </div>
  );
};

export default Widget;