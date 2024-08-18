/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { vexo } from 'vexo-analytics';

// You may want to wrap this with `if (!__DEV__) { ... }` to only run Vexo in production.
vexo('707528fb-5be6-49d1-9a78-5afe749580cc');
AppRegistry.registerComponent(appName, () => App);
