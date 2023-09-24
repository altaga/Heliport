/**
 * @format
 */

import "node-libs-react-native/globals.js"
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);