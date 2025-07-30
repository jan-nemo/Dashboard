import type {FrameMessage} from "./FrameMessage";

export default class Frame {
  private _window: Window;
  private _origin: string;

  public connected: boolean;

  get origin() {
    return this._origin;
  }

  constructor(window: Window, origin: string) {
    this._window = window;
    this._origin = origin;

    this.connected = false;
  }

  postMessage<T extends FrameMessage>(message: T): void {
    this._window.postMessage(message, this._origin);
  }
}