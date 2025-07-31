import {useCallback, useState} from "react";
import type {WidgetId} from "./WidgetId.tsx";
import WidgetConnector from "./WidgetConnector.tsx";
import InboundWidgetMessageSubject from "./InboundWidgetMessageSubject.ts";
import OutboundWidgetMessageSubject from "./OutboundWidgetMessageSubject.tsx";
import Widget from "./Widget.tsx";
import {map, merge} from "rxjs";
import type {WidgetMessage} from "./WidgetMessage.ts";
import {Recipient} from "./OutboundWidgetMessage.tsx";
import createWidgetMessageMiddleware from "./createWidgetMessageMiddleware.ts";
import ofType from "./ofType.ts";

type Widget = {
  id: WidgetId;
  url: string;
};

const createWidget = (url: string) : Widget => ({
  id: crypto.randomUUID(),
  url,
});

const WIDGETS: Widget[] = [
  createWidget('http://localhost:5174/widget-b'),
  createWidget('http://localhost:5174/widget-c'),
  createWidget('http://localhost:5174/widget-b'),
  createWidget('http://localhost:5174/widget-a'),
];

const INBOUND_WIDGET_MESSAGE_SUBJECT = new InboundWidgetMessageSubject();
const OUTBOUND_WIDGET_MESSAGE_SUBJECT = new OutboundWidgetMessageSubject();

createWidgetMessageMiddleware(INBOUND_WIDGET_MESSAGE_SUBJECT, OUTBOUND_WIDGET_MESSAGE_SUBJECT, inboundMessage$ => {
  const broadcast$ = inboundMessage$.pipe(
    ofType(isBroadcastMessage),
    map(inboundMessage => ({
      recipient: Recipient.all([inboundMessage.sender]),
      message: {
        ...inboundMessage.message,
        type: `BROADCASTED/${inboundMessage.message.type.slice('BROADCAST/'.length)}`,
      }
    })),
  );

  const refreshIdToken$ = inboundMessage$.pipe(
    ofType(isRefreshIdTokenMessage),
    map(inboundMessage => ({
      recipient: Recipient.single(inboundMessage.sender),
      message: {
        type: 'ID_TOKEN/REFRESHED',
        payload: {
          idToken: '<IDTOKEN>',
        },
      }
    }))
  );

  return merge(broadcast$, refreshIdToken$);

  function isBroadcastMessage(message: WidgetMessage): message is { type: `BROADCAST/${string}`, [key: string]: unknown } {
    return message.type.startsWith('BROADCAST/');
  }

  function isRefreshIdTokenMessage(message: WidgetMessage): message is { type: `ID_TOKEN/REFRESH` } {
    return message.type == 'ID_TOKEN/REFRESH';
  }
})

function App() {
  const [widgets, setWidgets] = useState<Widget[]>(WIDGETS);

  const handleRemove = useCallback((id: WidgetId) => {
    setWidgets(widgets => {
      return widgets.filter(widget => widget.id !== id);
    })
  }, []);

  return (
    <WidgetConnector inboundMessage$={INBOUND_WIDGET_MESSAGE_SUBJECT} outboundMessage$={OUTBOUND_WIDGET_MESSAGE_SUBJECT}>
      <div>
        {widgets.map(widget => (
          <div key={widget.id} style={{ position: 'relative', display: 'inline-block' }}>
            <Widget  id={widget.id} url={widget.url} />
            <button
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                zIndex: 10,
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid #ccc',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '14px',
                lineHeight: 1,
              }}
              onClick={() => handleRemove(widget.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </WidgetConnector>
  );
}

export default App
