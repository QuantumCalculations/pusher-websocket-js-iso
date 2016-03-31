import Browser from "./browser";
import XHR from "./xhr";
import {Dependencies, DependenciesReceivers} from './dom/dependencies';
import {AuthTransport, AuthTransports} from 'shared/auth/auth_transports';
import xhrAuth from 'shared/auth/xhr_auth';
import jsonpAuth from './auth/jsonp_auth';
import TimelineTransport from 'shared/timeline/timeline_transport';
import TimelineSender from 'core/timeline/timeline_sender';
import ScriptRequest from './dom/script_request';
import JSONPRequest from './dom/jsonp_request';
import * as Collections from 'core/utils/collections';
import {ScriptReceivers} from './dom/script_receiver_factory';
import jsonpTimeline from './timeline/jsonp_timeline';
import Transports from './transports/transports';

var Runtime : Browser = {

  // for jsonp auth
  nextAuthCallbackID: 1,
  auth_callbacks: {},
  ScriptReceivers,
  DependenciesReceivers,

  whenReady(callback : Function) : void {
    var initializeOnDocumentBody = ()=> {
        this.onDocumentBody(callback);
    }
    if (!(<any>window).JSON) {
      Dependencies.load("json2", {}, initializeOnDocumentBody);
    } else {
      initializeOnDocumentBody();
    }
  },

  getDocument() : any {
    return document;
  },

  getProtocol() : string {
    return this.getDocument().location.protocol;
  },

  isXHRSupported() : boolean {
    var Constructor = XHR.getAPI();
    return Boolean(Constructor) && (new Constructor()).withCredentials !== undefined;
  },

  isSockJSSupported() : boolean {
    return true;
  },

  isXDRSupported(encrypted?: boolean) : boolean {
    var protocol = encrypted ? "https:" : "http:";
    var documentProtocol = this.getProtocol();
    return Boolean(<any>(window['XDomainRequest'])) && documentProtocol === protocol;
  },

  getGlobal() : any {
    return window;
  },

  getAuthorizers() : AuthTransports {
    return {ajax: xhrAuth, jsonp: jsonpAuth};
  },

  getTimelineTransport(sender: TimelineSender, encrypted : boolean) : TimelineTransport {
    return jsonpTimeline(sender, encrypted);
  },

  onDocumentBody(callback : Function) {
    if (document.body) {
      callback();
    } else {
      setTimeout(()=> {
        this.onDocumentBody(callback);
      }, 0);
    }
  },

  createJSONPRequest(url : string, data : any) : JSONPRequest {
    return new JSONPRequest(url, data);
  },

  createScriptRequest(src : string) : ScriptRequest {
    return new ScriptRequest(src);
  },

  getClientFeatures() : any[] {
    return Collections.keys(
      Collections.filterObject(
        { "ws": Transports.WSTransport },
        function (t) { return t.isSupported({}); }
      )
    );
  },

  getLocalStorage() {
    try {
      return window.localStorage;
    } catch (e) {
      return undefined;
    }
  }
}

export default Runtime;
