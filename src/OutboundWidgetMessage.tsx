import type {WidgetMessage} from "./WidgetMessage.ts";
import type {WidgetId} from "./WidgetId.tsx";

export abstract class Recipient {
  abstract filter<T>(source: Map<WidgetId, T>): Generator<T, void, unknown>;

  static single(id: WidgetId): Recipient {
    return new SingleRecipient(id);
  }

  static all(excludeIds: WidgetId[] = []): Recipient {
    return new AllRecipients(excludeIds);
  }
}

class SingleRecipient extends Recipient {
  private readonly _id: WidgetId;

  constructor(id: WidgetId) {
    super();

    this._id = id;
  }

  *filter<T>(source: Map<WidgetId, T>): Generator<T, void, unknown> {
    const value = source.get(this._id);
    if (value)
      yield value;
  }
}

class AllRecipients extends Recipient {
  private readonly _excludeIds: WidgetId[];

  constructor(excludeIds: WidgetId[] = []) {
    super();

    this._excludeIds = excludeIds;
  }

  *filter<T>(source: Map<WidgetId, T>): Generator<T, void, unknown> {
    for (const [id, value] of source) {
      if (this._excludeIds.includes(id))
        continue;

      yield value;
    }
  }
}

export type OutboundWidgetMessage = {
  recipient: Recipient;
  message: WidgetMessage;
}