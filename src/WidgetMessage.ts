export type WidgetMessage = {
  type: string;
};

export function isWidgetMessage(message: unknown): message is WidgetMessage {
  if (!message)
    return false;

  if (typeof message !== 'object')
    return false;

  if (!('type' in message))
    return false;

  return typeof message.type === 'string';
}