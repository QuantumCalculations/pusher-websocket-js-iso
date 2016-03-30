import * as App from "node/app";
import RequestHooks from "./request_hooks";
import Ajax from "./ajax";
import {default as EventsDispatcher} from "../events/dispatcher";
import Status from "./status";

const MAX_BUFFER_LENGTH = 256*1024;

export default class HTTPRequest extends EventsDispatcher {
  hooks: RequestHooks;
  method: string;
  url: string;
  position: number;
  xhr: Ajax;
  unloader: Function;

  constructor(hooks : RequestHooks, method : string, url : string) {
    super();
    this.hooks = hooks;
    this.method = method;
    this.url = url;
  }

  start(payload?: any) {
    var self = this;

    self.position = 0;
    self.xhr = self.hooks.getRequest(self);

    self.unloader = function() {
      self.close();
    };
    App.addUnloadListener(self.unloader);

    self.xhr.open(self.method, self.url, true);
    self.xhr.send(payload);
  }

  close() {
    if (this.unloader) {
      App.removeUnloadListener(this.unloader);
      this.unloader = null;
    }
    if (this.xhr) {
      this.hooks.abortRequest(this.xhr);
      this.xhr = null;
    }
  }

  onChunk(status : Status, data : any) {
    while (true) {
      var chunk = this.advanceBuffer(data);
      if (chunk) {
        this.emit("chunk", { status: status, data: chunk });
      } else {
        break;
      }
    }
    if (this.isBufferTooLong(data)) {
      this.emit("buffer_too_long");
    }
  }

  advanceBuffer(buffer : any[]) : any {
    var unreadData = buffer.slice(this.position);
    var endOfLinePosition = unreadData.indexOf("\n");

    if (endOfLinePosition !== -1) {
      this.position += endOfLinePosition + 1;
      return unreadData.slice(0, endOfLinePosition);
    } else {
      // chunk is not finished yet, don't move the buffer pointer
      return null;
    }
  }

  isBufferTooLong(buffer : any) : boolean {
    return this.position === buffer.length && buffer.length > MAX_BUFFER_LENGTH;
  }
}
