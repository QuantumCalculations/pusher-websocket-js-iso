import HTTPFactory from "./http_factory";
import URLLocation from "./url_location";
import State from "./state";
import Socket from "../socket/socket";
import SocketHooks from "./socket_hooks";
import Util from "../util";
import getXHR from './http_xhr_request';
import getXDR from "./http_xdomain_request";
import Ajax from "./ajax";
import HTTPRequest from "./http_request";

var autoIncrement = 1;

class HTTPSocket implements Socket {
    hooks: SocketHooks;
    session: string;
    location: URLLocation;
    readyState: State;
    stream: HTTPRequest;
    factory : HTTPFactory;

    onopen:() => void;
    onerror:(error : any) => void;
    onclose:(closeEvent : any) => void;
    onmessage:(message : any) => void;
    onactivity:() => void;

    constructor(factory : HTTPFactory, hooks : SocketHooks, url : string) {
        this.factory = factory;
        this.hooks = hooks;
        this.session = randomNumber(1000) + "/" + randomString(8);
        this.location = getLocation(url);
        this.readyState = State.CONNECTING;
        this.openStream();
    }

    send(payload : any) {
        return this.sendRaw(JSON.stringify([payload]));
    }

    ping(){
        this.hooks.sendHeartbeat(this);
    }

    close(code : any, reason : any) {
        this.onClose(code, reason, true);
    }

    /** For internal use only */
    sendRaw(payload : any) : boolean {
        if (this.readyState === State.OPEN) {
            try {
            createRequest(
                this.factory, "POST", getUniqueURL(getSendURL(this.location, this.session))
            ).start(payload);
            return true;
            } catch(e) {
            return false;
            }
        } else {
            return false;
        }
    }

    /** For internal use only */
    reconnect() {
        this.closeStream();
        this.openStream();
    };

    /** For internal use only */
    onClose(code, reason, wasClean) {
        this.closeStream();
        this.readyState = State.CLOSED;
        if (this.onclose) {
            this.onclose({
                code: code,
                reason: reason,
                wasClean: wasClean
            });
        }
    }

    /** @private */
    onChunk(chunk) {
      if (chunk.status !== 200) {
        return;
      }
      if (this.readyState === State.OPEN) {
        this.onActivity();
      }

      var payload;
      var type = chunk.data.slice(0, 1);
      switch(type) {
        case 'o':
          payload = JSON.parse(chunk.data.slice(1) || '{}');
          this.onOpen(payload);
          break;
        case 'a':
          payload = JSON.parse(chunk.data.slice(1) || '[]');
          for (var i = 0; i < payload.length; i++){
            this.onEvent(payload[i]);
          }
          break;
        case 'm':
          payload = JSON.parse(chunk.data.slice(1) || 'null');
          this.onEvent(payload);
          break;
        case 'h':
          this.hooks.onHeartbeat(this);
          break;
        case 'c':
          payload = JSON.parse(chunk.data.slice(1) || '[]');
          this.onClose(payload[0], payload[1], true);
          break;
      }
    }

    /** @private */
    onOpen(options) {
      if (this.readyState === State.CONNECTING) {
        if (options && options.hostname) {
          this.location.base = replaceHost(this.location.base, options.hostname);
        }
        this.readyState = State.OPEN;

        if (this.onopen) {
          this.onopen();
        }
      } else {
        this.onClose(1006, "Server lost session", true);
      }
    }

    /** @private */
    onEvent(event) {
      if (this.readyState === State.OPEN && this.onmessage) {
        this.onmessage({ data: event });
      }
    }

    /** @private */
    onActivity() {
      if (this.onactivity) {
        this.onactivity();
      }
    }


    /** @private */
    onError(error) {
      if (this.onerror) {
        this.onerror(error);
      }
    }

    /** @private */
    openStream() {
      var self = this;

      self.stream = createRequest(
        self.factory,
        "POST",
        getUniqueURL(self.hooks.getReceiveURL(self.location, self.session))
      );

      self.stream.bind("chunk", function(chunk) {
        self.onChunk(chunk);
      });
      self.stream.bind("finished", function(status) {
        self.hooks.onFinished(self, status);
      });
      self.stream.bind("buffer_too_long", function() {
        self.reconnect();
      });

      try {
        self.stream.start();
      } catch (error) {
        Util.defer(function() {
          self.onError(error);
          self.onClose(1006, "Could not start streaming", false);
        });
      }
    }

    /** @private */
    closeStream() {
      if (this.stream) {
        this.stream.unbind_all();
        this.stream.close();
        this.stream = null;
      }
    }
}


function getLocation(url) : URLLocation {
  var parts = /([^\?]*)\/*(\??.*)/.exec(url);
  return {
    base: parts[1],
    queryString: parts[2]
  };
}

function getSendURL(url : URLLocation, session : string) : string {
  return url.base + "/" + session + "/xhr_send";
}

function getUniqueURL(url : string) : string {
  var separator = (url.indexOf('?') === -1) ? "?" : "&";
  return url + separator + "t=" + (+new Date()) + "&n=" + autoIncrement++;
}

function replaceHost(url : string, hostname : string) : string {
  var urlParts = /(https?:\/\/)([^\/:]+)((\/|:)?.*)/.exec(url);
  return urlParts[1] + hostname + urlParts[3];
}

function randomNumber(max : number) : number {
  return Math.floor(Math.random() * max);
}

function randomString(length : number) : string {
  var result = [];
  for (var i = 0; i < length; i++) {
    result.push(randomNumber(32).toString(32));
  }
  return result.join('');
}

function createRequest(factory : HTTPFactory, method : string, url : string) : HTTPRequest {
  if (Util.isXHRSupported()) {
    return factory.createXHR(method, url);
  } else if (Util.isXDRSupported(url.indexOf("https:") === 0)) {
    return factory.createXDR(method, url);
  } else {
    throw "Cross-origin HTTP requests are not supported";
  }
}

export default HTTPSocket;
