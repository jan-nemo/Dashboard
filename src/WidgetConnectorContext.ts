import type {WidgetId} from "./WidgetId.tsx";
import {createContext} from "react";
import type WidgetMessageBus from "./WidgetMessageBus.ts";

type WidgetConnector = {
  connect: (id: WidgetId, window: Window, origin: string) => () => void;
  messageBus: WidgetMessageBus
};

export default createContext<WidgetConnector | null>(null);