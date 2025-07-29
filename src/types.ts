export type Frame = {
  origin: string;
  postMessage: <T extends FrameMessage>(message: T) => void;
  connected: boolean
};

export type FrameMessage = {
  type: string;
};

export function isFrameMessage(message: unknown): message is FrameMessage {
  if (!message)
    return false;

  if (typeof message !== 'object')
    return false;

  if (!('type' in message))
    return false;

  return typeof message.type === 'string';
}