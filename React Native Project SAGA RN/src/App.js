// In App.js in a new project

import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "react-native";
// Utils
import { ContextProvider } from "./utils/contextModule";
// Screens
import Setup from "./screens/setup/setup";
import Main from "./screens/main/main";
import CreateWallet from "./screens/createWallet/createWallet";
import ConnectWallet from "./screens/connectWallet/connectWallet";
import ImportWallet from "./screens/importWallet/importWallet";
import SplashLoading from "./screens/splash/splashLoading";
import CreatePin from "./screens/createPin/createPin";
import CreateBiometrics from "./screens/createBiometrics/createBiometrics";
import FinishSetup from "./screens/finishSetup/finishSetup";
import LockScreen from "./screens/lockScreen/lockScreen";
import Send from "./screens/send/send";
import Connect from "./screens/connect/connect";
import Receive from "./screens/receive/receive";
import WalletConnectDeposit from "./screens/walletConnectDeposit/walletConnectDeposit";
import SolanaPayDeposit from "./screens/solanaPayDeposit/solanaPayDeposit";
import SolanaDeposit from "./screens/solanaDeposit/solanaDeposit";
import EthereumDeposit from "./screens/ethereumDeposit/ethereumDeposit";
import SwapSimple from "./screens/swapSimple/swapSimple";
import SwapAdvance from "./screens/swapAdvance/swapAdvance";
import SwapETHSimple from "./screens/swapETHSimple/swapETHSimple";
import CreateWalletETH from "./screens/createWalletETH/createWalletETH";
import NFTS from "./screens/nfts/nfts";
import NFTsend from "./screens/nftsSend/nftsSend";
import Heliport from "./screens/heliport/heliport";
import { useBLE } from "./utils/bleHOC";

const Stack = createNativeStackNavigator();

class App extends React.Component {
  render() {
    return (
      <ContextProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" />
          <Stack.Navigator
            initialRouteName="SplashLoading"
            screenOptions={{
              headerShown: false,
            }}
          >
            {
              // Setup All
            }
            <Stack.Screen name="SplashLoading" component={SplashLoading} />
            {
              // Login Screens
            }
            <Stack.Screen name="Setup" component={Setup} />
            <Stack.Screen name="CreateWallet" component={CreateWallet} />
            <Stack.Screen name="ConnectWallet" component={ConnectWallet} />
            <Stack.Screen name="ImportWallet" component={ImportWallet} />
            <Stack.Screen name="CreateWalletETH" component={CreateWalletETH} />
            <Stack.Screen name="CreatePin" component={CreatePin} />
            <Stack.Screen name="CreateBiometric" component={CreateBiometrics} />
            <Stack.Screen name="FinishSetup" component={FinishSetup} />
            {
              // Main Screens
            }
            <Stack.Screen name="LockScreen" component={LockScreen} />
            <Stack.Screen name="Main">
              {(props) => <Main {...this.props} {...props} />}
            </Stack.Screen>
            {
              // NFTS
            }
            <Stack.Screen name="NFTS" component={NFTS} />
            <Stack.Screen name="NFTsend" component={NFTsend} />
            {
              // Send Screens
            }
            <Stack.Screen name="Send" component={Send} />
            <Stack.Screen name="Connect" component={Connect} />
            {
              // Receive Screens
            }
            <Stack.Screen name="Receive" component={Receive} />
            <Stack.Screen name="SolanaDeposit" component={SolanaDeposit} />
            <Stack.Screen
              name="SolanaPayDeposit"
              component={SolanaPayDeposit}
            />
            <Stack.Screen name="EthereumDeposit" component={EthereumDeposit} />
            <Stack.Screen
              name="WalletConnectDeposit"
              component={WalletConnectDeposit}
            />
            {
              // Receive Screens
            }
            <Stack.Screen name="SwapSimple" component={SwapSimple} />
            <Stack.Screen name="SwapETHSimple" component={SwapETHSimple} />
            {
              // Heliport
            }
            <Stack.Screen name="Heliport">
              {(props) => <Heliport {...this.props} {...props} />}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </ContextProvider>
    );
  }
}

export default useBLE(App, "1101"); // 1101 Heliport ID
