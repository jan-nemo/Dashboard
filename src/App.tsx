import {useState} from "react";
import type {WidgetId} from "./WidgetId.tsx";
import WidgetConnector from "./WidgetConnector.tsx";
import InboundWidgetMessageSubject from "./InboundWidgetMessageSubject.ts";
import OutboundWidgetMessageSubject from "./OutboundWidgetMessageSubject.tsx";
import Widget from "./Widget.tsx";
import {filter, map, merge, type Observable, type OperatorFunction} from "rxjs";
import type {WidgetMessage} from "./WidgetMessage.ts";
import type {InboundWidgetMessage} from "./InboundWidgetMessage.tsx";
import {type OutboundWidgetMessage, Recipient} from "./OutboundWidgetMessage.tsx";

function ofType<T extends WidgetMessage>(messageTypeGuard: (message: WidgetMessage) => message is T): OperatorFunction<InboundWidgetMessage, InboundWidgetMessage & { message: T }> {
  return source => source.pipe(
    filter((inboundMessage): inboundMessage is InboundWidgetMessage & { message: T } => messageTypeGuard(inboundMessage.message))
  );
}

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

type WidgetMiddleware = (message$: Observable<InboundWidgetMessage>) => Observable<OutboundWidgetMessage>;

function rootMiddleware(inboundMessage$: Observable<InboundWidgetMessage>): Observable<OutboundWidgetMessage> {
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
}

function createMiddleware(
  inboundMessage$: InboundWidgetMessageSubject,
  outboundMessage$: OutboundWidgetMessageSubject,
  rootMiddleware: WidgetMiddleware
) {
  rootMiddleware(inboundMessage$.asObservable()).subscribe(outboundMessage => {
    outboundMessage$.next(outboundMessage);
  });
}

createMiddleware(INBOUND_WIDGET_MESSAGE_SUBJECT, OUTBOUND_WIDGET_MESSAGE_SUBJECT, rootMiddleware)

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
