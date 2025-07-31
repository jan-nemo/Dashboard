import {createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef} from "react";
import {type WidgetMessage, isWidgetMessage} from "./WidgetMessage.ts";
import {Observable, Subject} from "rxjs";

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

type WidgetConnector = {
  connect: (id: WidgetId, window: Window, origin: string) => () => void;
  messagePublisher: OutgoingWidgetMessagePublisher;
  messageObservable: IncomingWidgetMessageObservable;
};

const WidgetConnectorContext = createContext<WidgetConnector | null>(null);

export const useWidgetConnect = () => {
  const context = useContext(WidgetConnectorContext);
  if (!context)
    throw new Error('useWidgetConnector must be used within a WidgetConnectorProvider');

  return context.connect;
}
export const useWidgetMessagePublisher = () => {
  const context = useContext(WidgetConnectorContext);
  if (!context)
    throw new Error('useWidgetMessagePublisher must be used within a WidgetConnectorProvider');

  return context.messagePublisher;
}

export const useWidgetMessageObservable = () => {
  const context = useContext(WidgetConnectorContext);
  if (!context)
    throw new Error('useWidgetMessagePublisher must be used within a WidgetConnectorProvider');

  return context.messageObservable;
}

export type WidgetId = string;

type IncomingWidgetMessage = {
  sender: WidgetId;
  message: WidgetMessage;
};

type OutgoingWidgetMessage = {
  receiver: WidgetId;
  message: WidgetMessage;
}

class IncomingWidgetMessageSubject extends Subject<IncomingWidgetMessage> {
}

class OutgoingWidgetMessageSubject extends Subject<OutgoingWidgetMessage> {
}

class OutgoingWidgetMessagePublisher {
  private readonly _subject;

  constructor(subject: OutgoingWidgetMessageSubject) {
    this._subject = subject;
  }

  publish(outgoingWidgetMessage: OutgoingWidgetMessage): void {
    this._subject.next(outgoingWidgetMessage);
  }
}

class IncomingWidgetMessageObservable extends Observable<IncomingWidgetMessage> {
  constructor(subject: IncomingWidgetMessageSubject) {
    super(subscriber => subject.subscribe(subscriber));
  }
}

type Props = {
  children: ReactNode;
  incomingMessage$: IncomingWidgetMessageSubject;
  outgoingMessage$: OutgoingWidgetMessageSubject;
};

const WidgetConnector = ({ children, incomingMessage$, outgoingMessage$ }: Props) => {
  const outgoingMessagePublisherRef = useRef(new OutgoingWidgetMessagePublisher(outgoingMessage$));
  const incomingMessageObservableRef = useRef(new IncomingWidgetMessageObservable(incomingMessage$));

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
      if (!event.source || !(event.source instanceof Window))
        return;

      const widgetRegistration = widgetRegistrationsRef.current.get(event.source);
      if (!widgetRegistration)
        return;

      if (event.origin !== widgetRegistration.origin)
        return;

      const message = event.data;
      if (!isWidgetMessage(message))
        return;

      if (message.type !== 'CONNECTION/OPEN')
        return;

      let widgetMessageChannel = widgetMessageChannelsRef.current.get(widgetRegistration.id);
      if (!widgetMessageChannel) {
        widgetMessageChannel = new WidgetMessageChannel();
        widgetMessageChannel.port1.onmessage = event => {
          const message = event.data;
          if (!isWidgetMessage(message))
            return;

          incomingMessage$.next({ message, sender: widgetRegistration.id })
        };
        widgetMessageChannelsRef.current.set(widgetRegistration.id, widgetMessageChannel);
      }

      event.source.postMessage({ type: "CONNECTION/OPENED" }, event.origin, [widgetMessageChannel.port2]);
    }
  }, [incomingMessage$]);

  useEffect(() => {
    const subscription = outgoingMessage$.subscribe(outgoingMessage => {
      const { message, receiver } = outgoingMessage;

      widgetMessageChannelsRef.current.get(receiver)?.port1.postMessage(message);
    });

    return () => subscription.unsubscribe();
  }, [outgoingMessage$]);

  const value = useMemo(() => ({
    connect,
    messagePublisher: outgoingMessagePublisherRef.current,
    messageObservable: incomingMessageObservableRef.current,
  }), [connect])

  return (
    <WidgetConnectorContext.Provider value={value}>
      {children}
    </WidgetConnectorContext.Provider>
  )
}

export default WidgetConnector;