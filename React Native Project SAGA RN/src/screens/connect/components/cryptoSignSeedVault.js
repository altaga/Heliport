// Basic Imports
import React, { Component } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
// Styles
import GlobalStyles from "../../../styles/styles";
// Utils
import reactAutobind from "react-autobind";
import ContextModule from "../../../utils/contextModule";
// Solana
import ReactNativeBiometrics from "react-native-biometrics";
import EncryptedStorage from "react-native-encrypted-storage";
import Icon from "react-native-vector-icons/Entypo";
import VirtualKeyboard from "react-native-virtual-keyboard";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { APP_IDENTITY } from "../../../utils/constants";

class CryptoSignSeedVault extends Component {
  constructor(props) {
    super(props);
    this.state = {
      biometrics: false,
      clear: false,
      text: "",
    };
    reactAutobind(this);
  }

  static contextType = ContextModule;

  async signTransaction() {
    transact(async (wallet) => {
      try {
        const auth_token = await this.retrieveAuthToken();
        const authorizationResult = await wallet.reauthorize({
          auth_token,
          identity: APP_IDENTITY,
        });
        const [signature] = await wallet.signTransactions({
          transactions: [this.props.transaction],
        });
        this.props.signSolana(signature.serialize());
      } catch (err) {
        console.log(err);
        try {
          const { auth_token } = await wallet.authorize({
            cluster: "mainnet-beta",
            identity: APP_IDENTITY,
          });
          await this.storeAuthToken(auth_token);
          const [signature] = await wallet.signTransactions({
            transactions: [this.props.transaction],
          });
          this.props.signSolana(signature.serialize());
        } catch (err) {
          console.log(err);
        }
      }
    });
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

  async retrieveAuthToken() {
    try {
      const session = await EncryptedStorage.getItem("auth_token");
      if (session) {
        return JSON.parse(session).auth_token;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async checkPin(pin) {
    return new Promise(async (resolve) => {
      const session = await EncryptedStorage.getItem("pin");
      if (session) {
        if (JSON.parse(session).pin === pin) {
          resolve(true);
        }
        resolve(false);
      } else {
        resolve(false);
      }
    });
  }

  async checkBiometrics() {
    return new Promise(async (resolve) => {
      const rnBiometrics = new ReactNativeBiometrics();
      rnBiometrics
        .simplePrompt({ promptMessage: "Confirm fingerprint" })
        .then((resultObject) => {
          const { success } = resultObject;
          if (success) {
            this.signTransaction();
            resolve(true);
          } else {
            console.log("user cancelled biometric prompt");
            resolve(false);
          }
        })
        .catch(() => {
          console.log("biometrics failed");
          resolve(false);
        });
    });
  }

  async changeText(val) {
    if (val.length < 4) {
      this.setState({
        text: val,
      });
    }
    if (val.length === 4) {
      const flag = await this.checkPin(val);
      flag ? this.signTransaction() : await this.resetKeyboard();
    }
  }

  resetKeyboard() {
    return new Promise((resolve, reject) => {
      this.setState(
        {
          clear: true,
        },
        () =>
          this.setState(
            {
              clear: false,
              text: "",
            },
            () => resolve("ok")
          )
      );
    });
  }

  render() {
    return (
      <View
        style={{
          height: "100%",
          justifyContent: "space-evenly",
          alignItems: "center",
        }}
      >
        <Text style={GlobalStyles.title}>
          Sign with PIN{"\n"} or Biometrics
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          {[...Array(4).keys()].map((item, index) => (
            <Text
              key={"pin:" + index}
              style={{
                color: "white",
                width: Dimensions.get("window").width * 0.2,
                textAlign: "center",
                fontSize: 24,
              }}
            >
              {this.state.text.substring(index, index + 1) !== "" ? "•" : "·"}
            </Text>
          ))}
        </View>
        <VirtualKeyboard
          rowStyle={{
            width: Dimensions.get("window").width,
          }}
          cellStyle={{
            height: Dimensions.get("window").height / 10,
            borderWidth: 0,
            margin: 1,
          }}
          colorBack={"black"}
          color="white"
          pressMode="string"
          onPress={(val) => this.changeText(val)}
          clear={this.state.clear}
        />
        {this.context.value.biometrics && (
          <Pressable
            onPress={() => {
              this.checkBiometrics();
            }}
          >
            <Icon name="fingerprint" size={100} color={"white"} />
          </Pressable>
        )}
      </View>
    );
  }
}

export default CryptoSignSeedVault;
