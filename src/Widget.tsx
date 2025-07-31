import {useEffect, useRef, useState} from "react";
import useWidgetConnect from "./useWidgetConnect.ts";
import type {WidgetId} from "./WidgetId.ts";
import useWidgetMessageBus from "./useWidgetMessageBus.ts";
import {filter, map} from "rxjs";
import type {WidgetMessage} from "./WidgetMessage.ts";
import {Recipient} from "./OutboundWidgetMessage.tsx";

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

function isFooWidgetMessage(message: WidgetMessage): message is { type: 'RESIZE', payload: { title: string } } {
  return message.type === 'FOO'
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
    ).subscribe(inboundMessage => {
      if (isResizeWidgetMessage(inboundMessage.message)) {
        iframeRef.current!.style.width = inboundMessage.message.payload.width;
        iframeRef.current!.style.height = inboundMessage.message.payload.height;
      }
      if (isTitleSetWidgetMessage(inboundMessage.message)) {
        iframeRef.current!.title = inboundMessage.message.payload.title;
        setTitle(inboundMessage.message.payload.title);
      }
      if (isFooWidgetMessage(inboundMessage.message)) {
        messageBus.publish(({ recipient: Recipient.single(inboundMessage.sender), message: { type: 'BOO' } }))
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