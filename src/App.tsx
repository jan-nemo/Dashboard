import {useEffect, useState} from "react";
import FrameContainer from "./Widget.tsx";
import FrameRegistryProvider from "./FrameRegistryProvider.tsx";
import FrameConnectionHandler from "./FrameConnectionHandler.tsx";
import frameMessageBus from "./frameMessageBus.ts";
import useFrameRegistry from "./useFrameRegistry.ts";

type Widget = {
  url: string;
  size: {
    width: string;
    height: string;
  }
}

const createWidget = (url: string, width: string = '100%', height: string = '300px') : Widget => {
  return {
    url,
    size: {
      width,
      height
    }
  }
};

const WIDGETS: Widget[] = [
  createWidget('http://localhost:5174'),
  createWidget('http://localhost:5175/widget-b'),
  createWidget('http://localhost:5174'),
  createWidget('http://localhost:5176/widget-c'),
];

const ConnectionFrameMessageHandler = () => {
  type ConnectionOpenFrameMessage = { type: "CONNECTION/OPEN" };

  useEffect(() => frameMessageBus.subscribe(
    (message): message is ConnectionOpenFrameMessage => message.type == 'CONNECTION/OPEN',
    (_, sender) => {
      sender.postMessage({
        type: "CONNECTION/OPENED",
        payload: {
          idToken: "<IDTOKEN>",
          version: "1.0.0",
          culture: { name: "en-US" }
        }
      });
      sender.connected = true;
    }
  ), []);

  type ConnectionCloseFrameMessage = { type: "CONNECTION/CLOSE" };

  useEffect(() => frameMessageBus.subscribe(
    (message): message is ConnectionCloseFrameMessage => message.type == 'CONNECTION/CLOSE',
    (_, sender) => {
      sender.connected = false;
    }
  ), []);

  return null;
};

const BroadcastFrameMessageHandler = () => {
  const { getFrames } = useFrameRegistry();

  type BroadcastFrameMessage = { type: `BROADCAST/${string}`; [key: string]: unknown };

  useEffect(() => frameMessageBus.subscribe(
    (message): message is BroadcastFrameMessage => message.type.startsWith('BROADCAST/'),
    (message, sender) => {
      const broadcastedMessage = {
        ...message,
        type: 'BROADCASTED/' + message.type.substring('BROADCAST/'.length),
      };

      for (const frame of getFrames()) {
        if (frame === sender)
          continue;

        if (!frame.connected)
          return;

        frame.postMessage(broadcastedMessage);
      }
    }
  ), [getFrames]);

  return null;
};



function App() {
  const [widgets, setWidgets] = useState<Widget[]>(WIDGETS);

  useEffect(() => {
    const interval = setInterval(() => {
      setWidgets(widgets => widgets.map(widget => ({ ...widget, idToken: crypto.randomUUID() })))
    }, 5000)

    return () => clearInterval(interval);
  }, []);

  return (
    <FrameRegistryProvider>
      <FrameConnectionHandler>
        <ConnectionFrameMessageHandler />
        <BroadcastFrameMessageHandler />
        <div>
          {widgets.map((widget, index) => {
            return (
              <div key={index}>
                <FrameContainer url={widget.url} style={{ width: widget.size.width, height: widget.size.height }} />
              </div>
            );
          })}
        </div>
      </FrameConnectionHandler>
    </FrameRegistryProvider>
  );
}

export default App
