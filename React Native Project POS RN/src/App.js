// In App.js in a new project

import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StatusBar} from 'react-native';
// Utils
import {ContextProvider} from './utils/contextModule';
// Screens
import Login from './screens/login/screen';
import Main from './screens/main/screen';
import SolanaPay from './screens/solanaPay/screen';
import DepositCrypto from './screens/cryptoPayments/screen';
import DepositFiat from './screens/fiatPayments/screen';
import PrintTicket from './screens/printTicket/screen';

const Stack = createNativeStackNavigator();

class App extends React.Component {
  render() {
    return (
      <React.Fragment>
        <ContextProvider>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" />
            <Stack.Navigator
              initialRouteName="Login" // Login
              screenOptions={{
                headerShown: false,
              }}>
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Main" component={Main} />
              <Stack.Screen name="SolanaPay" component={SolanaPay} />
              <Stack.Screen name="CryptoPay" component={DepositCrypto} />
              <Stack.Screen name="FiatPay" component={DepositFiat} />
              <Stack.Screen name="PrintTicket" component={PrintTicket} />
            </Stack.Navigator>
          </NavigationContainer>
        </ContextProvider>
      </React.Fragment>
    );
  }
}

export default App;
