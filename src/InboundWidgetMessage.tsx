import type {WidgetMessage} from "./WidgetMessage.ts";
import type {WidgetId} from "./WidgetId.tsx";

export type InboundWidgetMessage = {
  sender: WidgetId;
  message: WidgetMessage;
};