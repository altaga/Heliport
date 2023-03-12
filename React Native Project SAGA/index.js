/**
 * @format
 */
// Solana Setup
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import {Buffer} from '@craftzdog/react-native-buffer';

// General
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

// Setup Buffer
global.Buffer = Buffer;

AppRegistry.registerComponent(appName, () => App);
