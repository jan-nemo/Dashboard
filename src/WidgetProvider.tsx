import {type ReactNode, useCallback, useEffect, useMemo, useRef} from "react";
import FrameRegistryContext from "./FrameRegistryContext";
import {type WidgetMessage, isWidgetMessage} from "./WidgetMessage.ts";
import frameMessageBus from "./frameMessageBus.ts";


type WidgetRegistrationId = string;

class WidgetRegistration {
  readonly id: WidgetRegistrationId;
  readonly origin: string;

  constructor(id: WidgetRegistrationId, origin: string) {
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

interface WidgetConnection {
  publish(message: WidgetMessage): void;
  subscribe(handler: (message: WidgetMessage) => void): void;
}

type Props = {
  children: ReactNode;
  onAdded: (widget: WidgetConnection) => void;
  onRemoved: (frame: WidgetConnection) => void;
  onMessage: (message: WidgetMessage, sender: WidgetConnection) => void;
};

const WidgetConnector = ({ children, onAdded, onRemoved, onMessage }: Props) => {
  const widgetRegistrationsRef = useRef<Map<Window, WidgetRegistration>>(new Map());
  const widgetMessageChannelsRef = useRef<Map<WidgetRegistrationId, WidgetMessageChannel>>(new Map());
  const widgetConnectionsRef = useRef<Map<WidgetRegistrationId, WidgetConnection>>(new Map());

  const connect = useCallback((id: string, window: Window, origin: string) => {
    const widgetRegistration = new WidgetRegistration(id, origin);

    widgetRegistrationsRef.current.set(window, widgetRegistration);

    return () => {
      widgetMessageChannelsRef.current.get(widgetRegistration.id)?.close();
      widgetMessageChannelsRef.current.delete(widgetRegistration.id);

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
        const widgetConnection: WidgetConnection = {
          publish(message: WidgetMessage) {
          },
          subscribe(handler: (message: WidgetMessage) => void) {
          }
        };
        widgetMessageChannel = new WidgetMessageChannel();
        widgetMessageChannel.port1.onmessage = event => {
          if (!isWidgetMessage(event.data))
            return;


        };

        widgetMessageChannelsRef.current.set(widgetRegistration.id, widgetMessageChannel);
      }

      event.source.postMessage({ type: "CONNECTION/OPENED" }, event.origin, [widgetMessageChannel.port2]);
    }
  }, []);
}