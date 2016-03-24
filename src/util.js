var XHR = require('pusher-websocket-iso-externals-node/xhr');

module.exports = {
  now: function() {
    if (Date.now) {
      return Date.now();
    } else {
      return new Date().valueOf();
    }
  },

  defer: function(callback) {
    var Timer = require('./utils/timers').Timer;
    return new Timer(0, callback);
  },

  /** Merges multiple objects into the target argument.
   *
   * For properties that are plain Objects, performs a deep-merge. For the
   * rest it just copies the value of the property.
   *
   * To extend prototypes use it as following:
   *   Pusher.Util.extend(Target.prototype, Base.prototype)
   *
   * You can also use it to merge objects without altering them:
   *   Pusher.Util.extend({}, object1, object2)
   *
   * @param  {Object} target
   * @return {Object} the target argument
   */
  extend: function(target) {
    var self = this;
    for (var i = 1; i < arguments.length; i++) {
      var extensions = arguments[i];
      for (var property in extensions) {
        if (extensions[property] && extensions[property].constructor &&
            extensions[property].constructor === Object) {
          target[property] = self.extend(
            target[property] || {}, extensions[property]
          );
        } else {
          target[property] = extensions[property];
        }
      }
    }
    return target;
  },

  stringify: function() {
    var m = ["Pusher"];
    for (var i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] === "string") {
        m.push(arguments[i]);
      } else {
        m.push(JSON.stringify(arguments[i]));
      }
    }
    return m.join(" : ");
  },

  arrayIndexOf: function(array, item) { // MSIE doesn't have array.indexOf
    var nativeIndexOf = Array.prototype.indexOf;
    if (array === null) {
      return -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) {
      return array.indexOf(item);
    }
    for (var i = 0, l = array.length; i < l; i++) {
      if (array[i] === item) {
        return i;
      }
    }
    return -1;
  },

  /** Applies a function f to all properties of an object.
   *
   * Function f gets 3 arguments passed:
   * - element from the object
   * - key of the element
   * - reference to the object
   *
   * @param {Object} object
   * @param {Function} f
   */
  objectApply: function(object, f) {
    for (var key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        f(object[key], key, object);
      }
    }
  },

  /** Return a list of object's own property keys
   *
   * @param {Object} object
   * @returns {Array}
   */
  keys: function(object) {
    var keys = [];
    this.objectApply(object, function(_, key) {
      keys.push(key);
    });
    return keys;
  },

  /** Return a list of object's own property values
   *
   * @param {Object} object
   * @returns {Array}
   */
  values: function(object) {
    var values = [];
    this.objectApply(object, function(value) {
      values.push(value);
    });
    return values;
  },

  /** Applies a function f to all elements of an array.
   *
   * Function f gets 3 arguments passed:
   * - element from the array
   * - index of the element
   * - reference to the array
   *
   * @param {Array} array
   * @param {Function} f
   */
  apply: function(array, f, context) {
    for (var i = 0; i < array.length; i++) {
      f.call(context || global, array[i], i, array);
    }
  },

  /** Maps all elements of the array and returns the result.
   *
   * Function f gets 4 arguments passed:
   * - element from the array
   * - index of the element
   * - reference to the source array
   * - reference to the destination array
   *
   * @param {Array} array
   * @param {Function} f
   */
  map: function(array, f) {
    var result = [];
    for (var i = 0; i < array.length; i++) {
      result.push(f(array[i], i, array, result));
    }
    return result;
  },

  /** Maps all elements of the object and returns the result.
   *
   * Function f gets 4 arguments passed:
   * - element from the object
   * - key of the element
   * - reference to the source object
   * - reference to the destination object
   *
   * @param {Object} object
   * @param {Function} f
   */
  mapObject: function(object, f) {
    var result = {};
    this.objectApply(object, function(value, key) {
      result[key] = f(value);
    });
    return result;
  },

  /** Filters elements of the array using a test function.
   *
   * Function test gets 4 arguments passed:
   * - element from the array
   * - index of the element
   * - reference to the source array
   * - reference to the destination array
   *
   * @param {Array} array
   * @param {Function} f
   */
  filter: function(array, test) {
    test = test || function(value) { return !!value; };

    var result = [];
    for (var i = 0; i < array.length; i++) {
      if (test(array[i], i, array, result)) {
        result.push(array[i]);
      }
    }
    return result;
  },

  /** Filters properties of the object using a test function.
   *
   * Function test gets 4 arguments passed:
   * - element from the object
   * - key of the element
   * - reference to the source object
   * - reference to the destination object
   *
   * @param {Object} object
   * @param {Function} f
   */
  filterObject: function(object, test) {
    var result = {};
    this.objectApply(object, function(value, key) {
      if ((test && test(value, key, object, result)) || Boolean(value)) {
        result[key] = value;
      }
    });
    return result;
  },

  /** Flattens an object into a two-dimensional array.
   *
   * @param  {Object} object
   * @return {Array} resulting array of [key, value] pairs
   */
  flatten: function(object) {
    var result = [];
    this.objectApply(object, function(value, key) {
      result.push([key, value]);
    });
    return result;
  },

  /** Checks whether any element of the array passes the test.
   *
   * Function test gets 3 arguments passed:
   * - element from the array
   * - index of the element
   * - reference to the source array
   *
   * @param {Array} array
   * @param {Function} f
   */
  any: function(array, test) {
    for (var i = 0; i < array.length; i++) {
      if (test(array[i], i, array)) {
        return true;
      }
    }
    return false;
  },

  /** Checks whether all elements of the array pass the test.
   *
   * Function test gets 3 arguments passed:
   * - element from the array
   * - index of the element
   * - reference to the source array
   *
   * @param {Array} array
   * @param {Function} f
   */
  all: function(array, test) {
    for (var i = 0; i < array.length; i++) {
      if (!test(array[i], i, array)) {
        return false;
      }
    }
    return true;
  },

  /** Builds a function that will proxy a method call to its first argument.
   *
   * Allows partial application of arguments, so additional arguments are
   * prepended to the argument list.
   *
   * @param  {String} name method name
   * @return {Function} proxy function
   */
  method: function(name) {
    var boundArguments = Array.prototype.slice.call(arguments, 1);
    return function(object) {
      return object[name].apply(object, boundArguments.concat(arguments));
    };
  },

  getDocument: function() {
    try {
      return document || undefined;
    } catch(e) {
      return undefined;
    }
  },

  getLocalStorage: function() {
    try {
      return window.localStorage;
    } catch (e) {
      return undefined;
    }
  },

  getClientFeatures: function() {
    var WSTransport = require('./transports/transports').WSTransport;
    return this.keys(
      this.filterObject(
        { "ws": WSTransport },
        function (t) { return t.isSupported({}); }
      )
    );
  },

  isXHRSupported: function() {
    return Boolean(XHR) && (new XHR()).withCredentials !== undefined;
  },

  isXDRSupported: function(encrypted) {
    var protocol = encrypted ? "https:" : "http:";
    var documentProtocol = this.getProtocol();
    return Boolean(window.XDomainRequest) && documentProtocol === protocol;
  },

  getProtocol: function(){
    if (this.getDocument() !== undefined){
      return this.getDocument().location.protocol;
    }
    return "http:";
  },

  createXHR: function(){
    if (XHR){
      return new XHR();
    } else {
      return new ActiveXObject("Microsoft.XMLHTTP");
    }
  }
};
