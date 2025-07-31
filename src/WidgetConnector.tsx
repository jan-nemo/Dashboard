import {type ReactNode, useCallback, useEffect, useMemo, useRef} from "react";
import {isWidgetMessage} from "./WidgetMessage.ts";
import type {WidgetId} from "./WidgetId.tsx";
import type OutboundWidgetMessageSubject from "./OutboundWidgetMessageSubject.tsx";
import type InboundWidgetMessageSubject from "./InboundWidgetMessageSubject.ts";
import WidgetConnectorContext from "./WidgetConnectorContext.ts";
import WidgetMessageBus from "./WidgetMessageBus.ts";

class WidgetRegistration {
  readonly id: WidgetId;
  readonly origin: string;

  constructor(id: WidgetId, origin: string) {
    this.id = id;
    this.origin = origin;
  }
}

class WidgetMessageChannel {
  private _closed: boolean = false;

  private readonly _messageChannel: MessageChannel = new MessageChannel();

  get port1(): MessagePort {
    return this._messageChannel.port1;
  }

  get port2(): MessagePort {
    return this._messageChannel.port2;
  }

  get closed(): boolean {
    return this._closed;
  }

  close(): void {
    this._closed = true;

    this._messageChannel.port1.onmessage = null;
    this._messageChannel.port1.close();
    this._messageChannel.port2.close();
  }
}

type Props = {
  children: ReactNode;
  inboundMessage$: InboundWidgetMessageSubject;
  outboundMessage$: OutboundWidgetMessageSubject;
};

const WidgetConnector = ({ children, inboundMessage$, outboundMessage$ }: Props) => {
  const messageBus = useMemo(() => new WidgetMessageBus(outboundMessage$, inboundMessage$), [inboundMessage$, outboundMessage$]);

  const widgetRegistrationsRef = useRef<Map<Window, WidgetRegistration>>(new Map());
  const widgetMessageChannelsRef = useRef<Map<WidgetId, WidgetMessageChannel>>(new Map());

  const connect = useCallback((id: WidgetId, window: Window, origin: string) => {
    const widgetRegistration = new WidgetRegistration(id, origin);

    widgetRegistrationsRef.current.set(window, widgetRegistration);

    return () => {
      widgetMessageChannelsRef.current.get(id)?.close();
      widgetMessageChannelsRef.current.delete(id);

      widgetRegistrationsRef.current.delete(window);
    };
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage, false);

    return () => window.removeEventListener('message', handleMessage, false);

    function handleMessage(event: MessageEvent) {
      if (!event.source)
        return;

      const widgetRegistration = widgetRegistrationsRef.current.get(event.source as Window);
      if (!widgetRegistration)
        return;

      if (event.origin !== widgetRegistration.origin)
        return;

      const message = event.data;
      if (!isWidgetMessage(message))
        return;

      if (message.type !== 'CONNECTION/OPEN')
        return;

      widgetMessageChannelsRef.current.get(widgetRegistration.id)?.close();
      widgetMessageChannelsRef.current.delete(widgetRegistration.id);

      const widgetMessageChannel = new WidgetMessageChannel();
      widgetMessageChannel.port1.onmessage = event => {
        const message = event.data;
        if (!isWidgetMessage(message))
          return;

        inboundMessage$.next({ message, sender: widgetRegistration.id })
      };
      widgetMessageChannelsRef.current.set(widgetRegistration.id, widgetMessageChannel);

      (event.source as Window).postMessage({ type: "CONNECTION/OPENED" }, event.origin, [widgetMessageChannel.port2]);
    }
  }, [inboundMessage$]);

  useEffect(() => {
    const subscription = outboundMessage$.subscribe(outboundMessage => {
      for (const { port1 } of outboundMessage.recipient.filter(widgetMessageChannelsRef.current))
        port1.postMessage(outboundMessage.message);
    });

    return () => subscription.unsubscribe();
  }, [outboundMessage$]);

  const value = useMemo(() => ({
    connect,
    messageBus
  }), [connect, messageBus])

  return (
    <WidgetConnectorContext.Provider value={value}>
      {children}
    </WidgetConnectorContext.Provider>
  )
}

export default WidgetConnector;