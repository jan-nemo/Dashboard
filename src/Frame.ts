export default class Frame {
  private readonly _url: URL;

  get url(): URL {
    return this._url;
  }

  constructor(url: URL) {
    this._url = url;
  }
}