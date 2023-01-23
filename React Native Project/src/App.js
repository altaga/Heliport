// In App.js in a new project

import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
// Utils
import { ContextProvider } from "./utils/contextModule";
import Login from './screens/login';
import Main from './screens/main';
import DW from './screens/dw';
import QrScan from './components/qrscan';
import Test from './screens/test';

const Stack = createNativeStackNavigator();

class App extends React.Component {
  render() {
    return (
      <ContextProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" />
          <Stack.Navigator
            initialRouteName="Login" // Login
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Main" component={Main} />
            <Stack.Screen name="DW" component={DW} />
            <Stack.Screen name="ScanQR" component={QrScan} />
          </Stack.Navigator>
        </NavigationContainer>
      </ContextProvider>
    );
  }
}

export default App;