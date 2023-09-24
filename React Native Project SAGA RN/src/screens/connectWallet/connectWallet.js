// Basic Imports
import React, { Component } from "react";
import { Dimensions, View, Text, Pressable } from "react-native";
// Utils
import reactAutobind from "react-autobind";
import ContextModule from "../../utils/contextModule";
import GlobalStyles from "../../styles/styles";
import { APP_IDENTITY } from "../../utils/constants";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import EncryptedStorage from "react-native-encrypted-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toByteArray } from 'react-native-quick-base64';
import { PublicKey } from "@solana/web3.js";

class ConnectWallet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
    };
    reactAutobind(this);
  }

  static contextType = ContextModule;

  async componentDidMount() {
    this.context.setValue({
      step: -1,
    });
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);
    });
    this.props.navigation.addListener("blur", async () => {});
  }

  async storeAuthToken(auth_token) {
    try {
      await EncryptedStorage.setItem(
        "auth_token",
        JSON.stringify({
          auth_token,
        })
      );
    } catch (error) {
      // There was an error on the native side
    }
  }

  async storePublicKey(publicKey) {
    try {
      await AsyncStorage.setItem(
        "publicKey",
        JSON.stringify({ publicKey: [publicKey] })
      );
    } catch (e) {
      // saving error
    }
  }

  async storeNFTselected(nftSelected) {
    try {
      await AsyncStorage.setItem(
        "nftSelected",
        JSON.stringify({ nftSelected })
      );
    } catch (e) {
      // saving error
    }
  }

  connectWallet() {
    try {
      transact(async (wallet) => {
        const { accounts, auth_token } = await wallet.authorize({
          cluster: "mainnet-beta",
          identity: APP_IDENTITY,
        });
        const firstAccount = accounts[0];
        await this.storeAuthToken(auth_token);
        await this.storePublicKey(new PublicKey(toByteArray(firstAccount.address)).toString());
        await this.storeNFTselected("")
        this.setState({
          connected: true,
        });
      });
    } catch (err) {
      // Error
      console.log(err);
    }
  }

  render() {
    return (
      <View style={GlobalStyles.container}>
        <View
          style={{
            height: "70%",
            justifyContent: "space-evenly",
            alignItems: "center",
          }}
        >
          <Text style={GlobalStyles.title}>
            Connect your{"\n"}SAGA SeedValut
          </Text>
          <Text style={GlobalStyles.description}>
            Press Connect and{"\n"}Authorize Effisend Wallet
          </Text>
          <View
            style={{
              flexWrap: "wrap",
              flexDirection: "row",
              justifyContent: "space-evenly",
              alignItems: "stretch",
            }}
          ></View>
          <Text style={[GlobalStyles.description,{color:"green"}]}>
            {
              this.state.connected ? "Successfully connected to SeedVault" :""
            }
          </Text>
        </View>
        <View
          style={{
            height: "30%",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical:10
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {[
              ...Array(this.context.value.biometricsAvailable ? 4 : 3).keys(),
            ].map((item, index) => (
              <Text
                key={"dot:" + index}
                style={{
                  color: this.context.value.step >= index ? "white" : "#a3a3a3",
                  marginHorizontal: 20,
                  fontSize: 38,
                }}
              >
                {this.context.value.step >= index ? "•" : "·"}
              </Text>
            ))}
          </View>
          <Pressable
            style={[
              GlobalStyles.buttonStyle,
              {
                backgroundColor: "#00e599",
                marginVertical: 0,
              },
            ]}
            onPress={async () => {
              if (!this.state.connected) {
                this.connectWallet();
              } else {
                this.props.navigation.navigate("CreateWalletETH")
              }
            }}
          >
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
              {!this.state.connected ? "Connect" : "Continue"}
            </Text>
          </Pressable>
          <Pressable
            style={[
              GlobalStyles.buttonStyle,
              {
                backgroundColor: "#db00ff",
                marginVertical: 0,
              },
            ]}
            onPress={async () => {
              this.props.navigation.navigate("Setup");
            }}
          >
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

export default ConnectWallet;
