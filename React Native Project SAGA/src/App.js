
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { Component } from 'react'
import { StatusBar } from 'react-native';
import DW from './screens/dw';
import Login from './screens/login';
import Main from './screens/main';
// Development
import Test from './components/test';
// Utils
import { ContextProvider } from "./utils/contextModule";
import Cam from './utils/cam';
import { useBLE } from './utils/bleHOC';

const Stack = createNativeStackNavigator();

class App extends Component {
  render() {
    return (
      <ContextProvider>
        <NavigationContainer>
          <StatusBar barStyle="default" />
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              //animation: 'none'
            }}
          >
            {
              // Login
            }
            <Stack.Screen name="Login" component={Login} />
            {
              // Main
            }
            <Stack.Screen name="Main">
              {(props) => <Main {...this.props} {...props} />}
            </Stack.Screen>

            {
              // DW
            }
            <Stack.Screen name="DW">
              {(props) => <DW {...this.props} {...props} />}
            </Stack.Screen>
            {
              // Cam
            }
            <Stack.Screen name="Cam" component={Cam} />
            {
              // Test
            }
            <Stack.Screen name="Test" component={Test} />
          </Stack.Navigator>
        </NavigationContainer>
      </ContextProvider>
    );
  }
}

export default useBLE(App, "1101")