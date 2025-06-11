import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// PATCH GLOBAL POUR ACTIVITYINDICATOR
import { ActivityIndicator } from 'react-native';

// Sauvegarder la fonction originale
const originalCreate = React.createElement;

// Override React.createElement pour intercepter ActivityIndicator  size prop
React.createElement = function(type, props, ...children) {
  if (type === ActivityIndicator && props && typeof props.size === 'string') {
    const newProps = { ...props };
    if (newProps.size === 'large') newProps.size = 40;
    if (newProps.size === 'small') newProps.size = 20;
    return originalCreate(type, newProps, ...children);
  }
  return originalCreate(type, props, ...children);
};

AppRegistry.registerComponent(appName, () => App); 