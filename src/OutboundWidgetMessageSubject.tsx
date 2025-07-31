import {Subject} from "rxjs";
import type {OutboundWidgetMessage} from "./OutboundWidgetMessage.tsx";

export default class OutboundWidgetMessageSubject extends Subject<OutboundWidgetMessage> {
}