import {useState} from "react";
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
    ofType(isBroadcastWidgetMessage),
    map(inboundMessage => ({
      recipient: Recipient.all([inboundMessage.sender]),
      message: {
        ...inboundMessage.message,
        type: `BROADCASTED/${inboundMessage.message.type.slice('BROADCAST/'.length)}`,
      }
    })),
  );

  const refreshIdToken$ = inboundMessage$.pipe(
    ofType(isRefreshIdTokenWidgetMessage),
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

  function isBroadcastWidgetMessage(message: WidgetMessage): message is { type: `BROADCAST/${string}`, [key: string]: unknown } {
    return message.type.startsWith('BROADCAST/');
  }

  function isRefreshIdTokenWidgetMessage(message: WidgetMessage): message is { type: `ID_TOKEN/REFRESH` } {
    return message.type == 'ID_TOKEN/REFRESH';
  }
})

function App() {
  const [widgets] = useState<Widget[]>(WIDGETS);

  return (
    <WidgetConnector inboundMessage$={INBOUND_WIDGET_MESSAGE_SUBJECT} outboundMessage$={OUTBOUND_WIDGET_MESSAGE_SUBJECT}>
      <div>
        {widgets.map(widget => <Widget key={widget.id} id={widget.id} url={widget.url} />)}
      </div>
    </WidgetConnector>
  );
}

export default App
