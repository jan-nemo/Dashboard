import type {WidgetMessage} from "./WidgetMessage.ts";
import type {WidgetId} from "./WidgetId.tsx";

export abstract class Recipient {
  abstract filter<T>(source: Map<WidgetId, T>): Generator<T, void, unknown>;

  static single(id: WidgetId): Recipient {
    return {
      *filter(source){
        const value = source.get(id);
        if (value)
          yield value;
      }
    };
  }

  static all(excludeIds: WidgetId[] = []): Recipient {
    return {
      *filter(source) {
        for (const [id, value] of source) {
          if (excludeIds.includes(id))
            continue;

          yield value;
        }
      }
    };
  }
}

export type OutboundWidgetMessage = {
  recipient: Recipient;
  message: WidgetMessage;
}