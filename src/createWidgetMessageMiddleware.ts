import InboundWidgetMessageSubject from "./InboundWidgetMessageSubject.ts";
import OutboundWidgetMessageSubject from "./OutboundWidgetMessageSubject.tsx";
import type {WidgetMessageMiddleware} from "./WidgetMessageMiddleware.tsx";

type DestroyWidgetMessageMiddleware = () => void;

export default (
  inboundMessage$: InboundWidgetMessageSubject,
  outboundMessage$: OutboundWidgetMessageSubject,
  middleware: WidgetMessageMiddleware
): DestroyWidgetMessageMiddleware => {
  const subscription = middleware(inboundMessage$.asObservable()).subscribe(outboundMessage => {
    outboundMessage$.next(outboundMessage);
  });

  return () => subscription.unsubscribe();
};