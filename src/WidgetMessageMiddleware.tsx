import type {Observable} from "rxjs";
import type {InboundWidgetMessage} from "./InboundWidgetMessage.tsx";
import type {OutboundWidgetMessage} from "./OutboundWidgetMessage.tsx";

export type WidgetMessageMiddleware = (message$: Observable<InboundWidgetMessage>) => Observable<OutboundWidgetMessage>;