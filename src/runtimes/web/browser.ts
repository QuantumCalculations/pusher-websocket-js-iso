import AbstractRuntime from "shared/abstract_runtime";
import {ScriptReceiverFactory} from './dom/script_receiver_factory';
import ScriptRequest from './dom/script_request';
import JSONPRequest from './dom/jsonp_request';

interface Browser extends AbstractRuntime {
  // for jsonp auth
  nextAuthCallbackID: number;
  auth_callbacks: any;
  ScriptReceivers: ScriptReceiverFactory;
  DependenciesReceivers: ScriptReceiverFactory;
  onDocumentBody(callback : Function);

  createJSONPRequest(url : string, data : any) : JSONPRequest;
  createScriptRequest(src : string) : ScriptRequest;
}

export default Browser;
