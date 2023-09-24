// Basic Imports
import React, { Component } from "react";
import { Dimensions, Image, View } from "react-native";
// Assets
import logo from "../../assets/logoStroke.png";
// Utils
import reactAutobind from "react-autobind";
import ContextModule from "../../utils/contextModule";
// Solana
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PublicKey } from "@solana/web3.js";
import RNBootSplash from "react-native-bootsplash";
import EncryptedStorage from "react-native-encrypted-storage";
import GlobalStyles from "../../styles/styles";
import {
  Network,
  SolanaNetwork,
  TokenETH,
  TokenSolana,
} from "../../utils/blockchainClass";
import { EVMs, Solana } from "../../utils/constants";

//import DeviceInfo from "react-native-device-info";

class SplashLoading extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    reactAutobind(this);
  }

  static contextType = ContextModule;

  async retrieveAuthTokenFlag() {
    try {
      const session = await EncryptedStorage.getItem("auth_token");
      if (session) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async retrievePublicKey(selected) {
    try {
      const session = await AsyncStorage.getItem("publicKey");
      if (session) {
        return JSON.parse(session).publicKey[selected];
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async retrieveETHPublicKey(selected) {
    try {
      const session = await AsyncStorage.getItem("ethPublicKey");
      if (session) {
        return JSON.parse(session).publicKey[selected];
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async retrieveKind(selected) {
    try {
      const session = await AsyncStorage.getItem("kind");
      if (session) {
        return JSON.parse(session).kind;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async retrieveNFT() {
    try {
      const session = await AsyncStorage.getItem("nftSelected");
      if (session) {
        return JSON.parse(session).nftSelected;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async retrieveSelected() {
    try {
      const session = await AsyncStorage.getItem("selected");
      if (session) {
        return JSON.parse(session).selected;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async retrieveNFTS() {
    try {
      const session = await AsyncStorage.getItem("nfts");
      if (session) {
        return JSON.parse(session);
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async retrievePinFlag() {
    try {
      const session = await EncryptedStorage.getItem("pin");
      if (session) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async retrieveBiometricsFlag() {
    try {
      const session = await EncryptedStorage.getItem("biometrics");
      if (session) {
        return JSON.parse(session).value;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async setNetworks() {
    return new Promise(async (resolve) => {
      try {
        //await this.storeDefaults([Solana, ...EVMs]);
        let session = await AsyncStorage.getItem("chains");
        if(JSON.parse(session).chains.length !==[Solana, ...EVMs].length){
          await this.storeDefaults([Solana, ...EVMs]);
          session = await AsyncStorage.getItem("chains");
        }
        if (session) {
          const Solana = JSON.parse(session).chains[0];
          const EVMs = JSON.parse(session).chains.slice(1);
          const SolanaChain = new SolanaNetwork(
            Solana.network,
            Solana.token,
            Solana.rpc,
            Solana.blockExplorer,
            Solana.tokens.map(
              (item) =>
                new TokenSolana(
                  Solana.rpc,
                  item.contract,
                  item.symbol,
                  item.decimals,
                  item.balance,
                  item.usd
                )
            )
          );
          const EVMchains = EVMs.map(
            (chain) =>
              new Network(
                chain.network,
                chain.token,
                chain.rpc,
                chain.chainId,
                chain.blockExplorer,
                chain.iconSymbol,
                chain.tokens.map(
                  (token, index) =>
                    new TokenETH(
                      chain.rpc,
                      token.contract,
                      token.symbol,
                      token.decimals,
                      token.balance,
                      token.usd,
                      index === 0 ? chain.iconSymbol : null
                    )
                )
              )
          );
          resolve([SolanaChain, ...EVMchains]);
        } else {
          resolve(false);
        }
      } catch (error) {
        resolve(false);
      }
    });
  }

  async setAll() {
    const selected = await this.retrieveSelected();
    const [
      publicKey,
      ethPublicKey,
      kind,
      pin,
      networks,
      biometrics,
      auth_token,
      nfts,
      nftSelected
    ] = await Promise.all([
      this.retrievePublicKey(selected),
      this.retrieveETHPublicKey(selected),
      this.retrieveKind(),
      this.retrievePinFlag(),
      this.setNetworks(),
      this.retrieveBiometricsFlag(),
      this.retrieveAuthTokenFlag(),
      this.retrieveNFTS(),
      this.retrieveNFT()
    ]);
    RNBootSplash.hide({ fade: true }); // Delete
    if (publicKey && ethPublicKey && kind === 0 && pin) {
      this.context.setValue(
        {
          publicKey: new PublicKey(publicKey),
          ethPublicKey,
          kind,
          networks,
          biometrics,
          nfts,
          nftSelected
        },
        () => {
          this.props.navigation.navigate("LockScreen")
         }
      );
    } else if (publicKey && ethPublicKey && kind === 1 && auth_token && pin) {
      this.context.setValue(
        {
          publicKey: new PublicKey(publicKey),
          ethPublicKey,
          kind,
          networks,
          biometrics,
          nfts,
          nftSelected
        },
        () => {
          this.props.navigation.navigate("LockScreen") // LockScreen
         } 
      );
    } else {
      this.props.navigation.navigate("Setup"); // Setup
    }
  }

  async componentDidMount() {
    //this.erase() // DEBUG ONLY
    this.setAll();
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);
      this.setAll();
    });
    this.props.navigation.addListener("blur", async () => {
      await this.clearAsyncStorageWC();
    });
  }

  async erase() {
    // Debug Only
    try {
      await EncryptedStorage.clear();
      await AsyncStorage.clear();
    } catch (error) {
      console.log(error);
    }
  }

  async storeDefaults(chains) {
    try {
      await AsyncStorage.setItem("chains", JSON.stringify({ chains }));
    } catch (e) {
      // saving error
    }
  }

  async clearAsyncStorageWC() {
    await AsyncStorage.multiRemove([
      "wc@2:client:0.3//proposal",
      "wc@2:client:0.3//session",
      "wc@2:core:0.3//expirer",
      "wc@2:core:0.3//history",
      "wc@2:core:0.3//keychain",
      "wc@2:core:0.3//messages",
      "wc@2:core:0.3//pairing",
      "wc@2:core:0.3//subscription",
      "wc@2:universal_provider:/namespaces",
      "wc@2:universal_provider:/optionalNamespaces",
      "wc@2:universal_provider:/sessionProperties",
    ]);
  }

  render() {
    return (
      <View
        style={GlobalStyles.container}
      >
        <Image
          resizeMode="contain"
          source={logo}
          alt="Cat"
          style={{
            width: Dimensions.get("window").width * 0.4,
          }}
        />
      </View>
    );
  }
}

export default SplashLoading;
