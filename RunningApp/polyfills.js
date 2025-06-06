// Polyfill pour setImmediate qui peut manquer dans certains environnements React Native
function setImmediatePolyfill(fn, ...args) {
  return setTimeout(fn, 0, ...args);
}

// Vérifier si setImmediate existe déjà
if (typeof global.setImmediate !== 'function') {
  global.setImmediate = setImmediatePolyfill;
}

// Polyfill pour clearImmediate
if (typeof global.clearImmediate !== 'function') {
  global.clearImmediate = clearTimeout;
}

// Polyfill pour requestAnimationFrame si nécessaire
if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = function(callback) {
    return setTimeout(callback, 16); // ~60fps
  };
}

if (typeof global.cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };
}

export default {
  setImmediatePolyfill
};