import {Subject} from "rxjs";
import type {InboundWidgetMessage} from "./InboundWidgetMessage.tsx";

export default class InboundWidgetMessageSubject extends Subject<InboundWidgetMessage> {
}
