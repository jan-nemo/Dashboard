import type {WidgetId} from "./WidgetId.tsx";
import {createContext} from "react";
import type InboundWidgetMessageSubject from "./InboundWidgetMessageSubject.ts";
import type OutboundWidgetMessageSubject from "./OutboundWidgetMessageSubject.tsx";

type WidgetConnector = {
  connect: (id: WidgetId, window: Window, origin: string) => () => void;
  inboundMessage$: InboundWidgetMessageSubject;
  outboundMessage$: OutboundWidgetMessageSubject;
};

export default createContext<WidgetConnector | null>(null);