import {useEffect, useRef, useState} from "react";
import useWidgetConnector from "./useWidgetConnector.ts";
import type {WidgetId} from "./WidgetId.ts";
import {filter, ignoreElements, map, merge, tap} from "rxjs";
import type {WidgetMessage} from "./WidgetMessage.ts";
import {Recipient} from "./OutboundWidgetMessage.tsx";
import useWidgetMessageMiddleware from "./useWidgetMessageMiddleware.ts";
import ofType from "./ofType.ts";

type Props = {
  id: WidgetId
  url: string;
};

const Widget = ({ id, url }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [title, setTitle] = useState<string | null>(null);

  const connect = useWidgetConnector();
  useEffect(() => {
    const window = iframeRef.current?.contentWindow;
    if (!window)
      return;

    const origin = new URL(url).origin;
    
    return connect(id, window, origin);
  }, [connect, id, url]);

  useWidgetMessageMiddleware(inboundMessage$ => {
    const resizeWidget$ = inboundMessage$.pipe(
      filter(inboundMessage => inboundMessage.sender === id),
      ofType(isResizeMessage),
      tap(inboundMessage => {
        iframeRef.current!.style.width = inboundMessage.message.payload.width;
        iframeRef.current!.style.height = inboundMessage.message.payload.height;
      }),
      ignoreElements(),
    );

    const setTitle$ = inboundMessage$.pipe(
      filter(inboundMessage => inboundMessage.sender === id),
      ofType(isTitleSetMessage),
      tap(inboundMessage => {
        iframeRef.current!.title = inboundMessage.message.payload.title;
        setTitle(inboundMessage.message.payload.title);
      }),
      ignoreElements(),
    );

    const foo$ = inboundMessage$.pipe(
      filter(inboundMessage => inboundMessage.sender === id),
      ofType(isFooMessage),
      map(inboundMessage => ({
        recipient: Recipient.single(inboundMessage.sender),
        message: { type: 'BOO' }
      })),
    );

    return merge(resizeWidget$, setTitle$, foo$);

    function isResizeMessage(message: WidgetMessage): message is { type: 'RESIZE', payload: { width: string; height: string } } {
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

    function isTitleSetMessage(message: WidgetMessage): message is { type: 'RESIZE', payload: { title: string } } {
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

    function isFooMessage(message: WidgetMessage): message is { type: 'RESIZE', payload: { title: string } } {
      return message.type === 'FOO'
    }
  }, [id]);

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