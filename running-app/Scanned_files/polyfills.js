function setImmediatePolyfill(fn, ...args) {
    return setTimeout(fn, 0, ...args);
  }
  
  if (!global.setImmediate) {
    global.setImmediate = setImmediatePolyfill;
  }
  
  if (!global.clearImmediate) {
    global.clearImmediate = clearTimeout;
  }

