if (typeof global.setImmediate !== 'function') {
  global.setImmediate = function(callback, ...args) {
    return setTimeout(callback, 0, ...args);
  };
}
if (typeof global.clearImmediate !== 'function') {
  global.clearImmediate = clearTimeout;
}