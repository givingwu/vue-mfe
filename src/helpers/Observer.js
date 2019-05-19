/**
 * @class Observer
 * @author VuChan
 * @constructor
 * @see https://github.com/vuchan/fe-utils/blob/master/helpers/Obersver.js
 * @return {Object} Observer Design Pattern Implementation
 */
export default function Observer() {
  this.events = {};
}

/**
 * observer.on('eventName', function listener() {})
 * @param  {string} eventName
 * @param  {Function} listener
 * @return {Array<Function>}
 */
Observer.prototype.on = function(eventName, listener) {
  if (!this.events[eventName]) {
    this.events[eventName] = [ listener ];
  } else {
    this.events[eventName].push(listener);
  }

  return this.events[eventName];
};

/**
 * observer.off('eventName', function listener() {})
 * @param  {string} eventName
 * @param  {Function} listener
 * @return {boolean|null}
 */
Observer.prototype.off = function(eventName, listener) {
  if (eventName) {
    let handlers = this.events[eventName];

    if (handlers && handlers.length) {
      if (listener) {
        return (handlers = handlers.filter((handler) => handler === listener));
      } else {
        delete this.events[eventName];
        return true;
      }
    }
  } else {
    this.events = {};
  }
};

/**
 * observer.emit('eventName', data1, data2, ...dataN)
 * @param  {string} eventName
 * @param  {Array}  data
 * @return {boolean}
 */
Observer.prototype.emit = function(eventName, ...data) {
  const handlers = this.events[eventName];

  if (handlers) {
    handlers.forEach((handler) => handler.apply(null, data));
    return true;
  }
};
