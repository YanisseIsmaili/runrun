// Import polyfills FIRST, before any other imports
import './polyfills';
// OR
// import './global';

// Then your other imports
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';

function setImmediatePolyfill(fn, ...args) {
    return setTimeout(fn, 0, ...args);
  }
  
  if (!global.setImmediate) {
    global.setImmediate = setImmediatePolyfill;
  }
  
  if (!global.clearImmediate) {
    global.clearImmediate = clearTimeout;
  }

