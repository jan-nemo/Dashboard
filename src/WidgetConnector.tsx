import {createContext, type ReactNode, useCallback, useContext, useEffect, useRef} from "react";
import {type WidgetMessage, isWidgetMessage} from "./WidgetMessage.ts";

type WidgetRegistrationId = unknown;

class WidgetRegistration {
  readonly id: WidgetRegistrationId;
  readonly origin: string;

  constructor(origin: string) {
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

interface WidgetConnection {
  postMessage(message: WidgetMessage): void;
}

type WidgetConnector = {
  connect: (window: Window, origin: string) => () => void;
};

const WidgetConnectorContext = createContext<WidgetConnector | null>(null);

export const useWidgetConnect = () => {
  const context = useContext(WidgetConnectorContext);
  if (!context)
    throw new Error('useWidgetConnector must be used within a WidgetConnectorProvider');

  return context.connect;
}

export const useWidgetConnection = (id: WidgetRegistrationId) => {

}

type Props = {
  children: ReactNode;
  onAdded: (widget: WidgetConnection) => void;
  onRemoved: (frame: WidgetConnection) => void;
  onMessage: (message: WidgetMessage, sender: WidgetConnection) => void;
};

const WidgetConnector = ({ children, onAdded, onRemoved, onMessage }: Props) => {
  const widgetRegistrationsRef = useRef<Map<Window, WidgetRegistration>>(new Map());
  const widgetMessageChannelsRef = useRef<Map<WidgetRegistration, WidgetMessageChannel>>(new Map());
  const widgetConnectionsRef = useRef<Map<WidgetRegistration, WidgetConnection>>(new Map());

  const connect = useCallback((window: Window, origin: string) => {
    const widgetRegistration = new WidgetRegistration(origin);

    widgetRegistrationsRef.current.set(window, widgetRegistration);

    return () => {
      widgetMessageChannelsRef.current.get(widgetRegistration)?.close();
      widgetMessageChannelsRef.current.delete(widgetRegistration);

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

      let widgetMessageChannel = widgetMessageChannelsRef.current.get(widgetRegistration);
      if (!widgetMessageChannel) {
        widgetMessageChannel = new WidgetMessageChannel();
        widgetMessageChannel.port1.onmessage = event => {
          if (!isWidgetMessage(event.data))
            return;


        };
        widgetMessageChannelsRef.current.set(widgetRegistration, widgetMessageChannel);

        const widgetConnection: WidgetConnection = {
          postMessage(message: WidgetMessage) {
            widgetMessageChannel.port1.postMessage(message);
          }
        };
      }

      event.source.postMessage({ type: "CONNECTION/OPENED" }, event.origin, [widgetMessageChannel.port2]);
    }
  }, []);
}