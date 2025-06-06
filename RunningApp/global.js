
if (typeof global.setImmediate !== 'function') {
  global.setImmediate = setTimeout;
}
if (typeof global.clearImmediate !== 'function') {
  global.clearImmediate = clearTimeout;
}