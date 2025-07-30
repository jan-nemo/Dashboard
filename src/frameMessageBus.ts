import type {FrameMessage} from "./WidgetMessage.ts";
import type Frame from "./Frame";

type Handler<T extends FrameMessage = FrameMessage> = (message: T, sender: Frame) => void;

type Predicate<T extends FrameMessage = FrameMessage> = (message: FrameMessage) => message is T;

type Unsubscribe = () => void;

class FrameMessageBus {
  private handlers = new Map<Predicate, Handler>();

  subscribe<T extends FrameMessage>(predicate: Predicate<T>, handler: Handler<T>): Unsubscribe {
    this.handlers.set(predicate, handler as Handler);

    return () => this.handlers.delete(predicate);
  }

  publish(message: FrameMessage, sender: Frame): void {
    for (const [predicate, handler] of this.handlers) {
      if (predicate(message))
        handler(message, sender);
    }
  }
}

const frameMessageBus = new FrameMessageBus();

export default frameMessageBus;