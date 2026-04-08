// Must be the first import: `import` is hoisted above `require()`, so a prior
// `require('./polyfills')` ran after App and @noble/* saw no getRandomValues.
import './src/polyfills';

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
