import {useState} from "react";
import type {WidgetId} from "./WidgetId.tsx";
import WidgetConnector from "./WidgetConnector.tsx";
import InboundWidgetMessageSubject from "./InboundWidgetMessageSubject.ts";
import OutboundWidgetMessageSubject from "./OutboundWidgetMessageSubject.tsx";
import Widget from "./Widget.tsx";
import WidgetMessageBus from "./WidgetMessageBus.ts";
import {filter, map, type OperatorFunction} from "rxjs";
import type {WidgetMessage} from "./WidgetMessage.ts";
import type {InboundWidgetMessage} from "./InboundWidgetMessage.tsx";
import {Recipient} from "./OutboundWidgetMessage.tsx";

function inboundMessageOfType<T extends WidgetMessage>(messageTypeGuard: (message: WidgetMessage) => message is T): OperatorFunction<InboundWidgetMessage, InboundWidgetMessage & { message: T }> {
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

const INCOMING_WIDGET_MESSAGE_SUBJECT = new InboundWidgetMessageSubject();
const OUTGOING_WIDGET_MESSAGE_SUBJECT = new OutboundWidgetMessageSubject();

const messageBus = new WidgetMessageBus(OUTGOING_WIDGET_MESSAGE_SUBJECT, INCOMING_WIDGET_MESSAGE_SUBJECT);

function isBroadcastWidgetMessage(message: WidgetMessage): message is { type: `BROADCAST/${string}`, [key: string]: unknown } {
  return message.type.startsWith('BROADCAST/');
}

messageBus.inboundMessage$.pipe(
  inboundMessageOfType(isBroadcastWidgetMessage),
  map(inboundMessage => ({
    recipient: Recipient.all([inboundMessage.sender]),
    message: {
      ...inboundMessage.message,
      type: `BROADCASTED/${inboundMessage.message.type.slice('BROADCAST/'.length)}`,
    }
  })),
).subscribe(outboundMessage => {
  messageBus.publish(outboundMessage);
});

function App() {
  const [widgets] = useState<Widget[]>(WIDGETS);

  return (
    <WidgetConnector inboundMessage$={INCOMING_WIDGET_MESSAGE_SUBJECT} outboundMessage$={OUTGOING_WIDGET_MESSAGE_SUBJECT}>
      <div>
        {widgets.map(widget => <Widget key={widget.id} id={widget.id} url={widget.url} />)}
      </div>
    </WidgetConnector>
  );
}

export default App
