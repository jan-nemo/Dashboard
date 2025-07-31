import type {WidgetMessage} from "./WidgetMessage.ts";
import {filter, type OperatorFunction} from "rxjs";
import type {InboundWidgetMessage} from "./InboundWidgetMessage.tsx";

export default function<T extends WidgetMessage>(messageTypeGuard: (message: WidgetMessage) => message is T): OperatorFunction<InboundWidgetMessage, InboundWidgetMessage & { message: T }> {
  return source => source.pipe(
    filter((inboundMessage): inboundMessage is InboundWidgetMessage & { message: T } => messageTypeGuard(inboundMessage.message))
  );
}