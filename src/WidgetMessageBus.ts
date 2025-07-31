import type OutboundWidgetMessageSubject from "./OutboundWidgetMessageSubject.tsx";
import type {Observable} from "rxjs";
import type {InboundWidgetMessage} from "./InboundWidgetMessage.tsx";
import type InboundWidgetMessageSubject from "./InboundWidgetMessageSubject.ts";
import type {OutboundWidgetMessage} from "./OutboundWidgetMessage.tsx";

export default class WidgetMessageBus {
  private readonly _outboundMessageSubject: OutboundWidgetMessageSubject;
  private readonly _inboundMessageObservable: Observable<InboundWidgetMessage>;

  get inboundMessage$(): Observable<InboundWidgetMessage> {
    return this._inboundMessageObservable;
  }

  constructor(outboundMessageSubject: OutboundWidgetMessageSubject, inboundWidgetMessageSubject: InboundWidgetMessageSubject) {
    this._outboundMessageSubject = outboundMessageSubject;
    this._inboundMessageObservable = inboundWidgetMessageSubject.asObservable();
  }

  publish(outgoingMessage: OutboundWidgetMessage): void {
    this._outboundMessageSubject.next(outgoingMessage);
  }
}