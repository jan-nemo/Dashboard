import {useEffect, useState} from "react";
import Frame from "./Frame.tsx";
import FrameRegistryProvider from "./FrameRegistryProvider.tsx";
import FrameMessageListener from "./FrameMessageListener.tsx";
import frameMessageBus from "./frameMessageBus.ts";
import useFrameRegistryContext from "./useFrameRegistryContext.ts";

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
  const { getFrames } = useFrameRegistryContext();

  type BroadcastFrameMessage = { type: `BROADCAST/${string}`; [key: string]: unknown };

  useEffect(() => frameMessageBus.subscribe(
    (message): message is BroadcastFrameMessage => message.type.startsWith('BROADCAST'),
    (message, sender) => {
      for (const otherFrame of getFrames()) {
        if (otherFrame === sender)
          continue;

        otherFrame.postMessage({
          ...message,
          type: 'BROADCASTED/' + message.type.substring('BROADCAST/'.length),
        });
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
      <FrameMessageListener>
        <ConnectionFrameMessageHandler />
        <BroadcastFrameMessageHandler />
        <div>
          {widgets.map((widget, index) => {
            return (
              <div key={index}>
                <Frame url={widget.url} style={{ width: widget.size.width, height: widget.size.height }} />
              </div>
            );
          })}
        </div>
      </FrameMessageListener>
    </FrameRegistryProvider>
  );
}

export default App
