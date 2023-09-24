// Basic Imports
import React, { Component } from "react";
import { Dimensions, Pressable, SafeAreaView, Text, View } from "react-native";
// Styles
import GlobalStyles, {
  NavigatorBarHeight,
  StatusBarHeight,
} from "../../styles/styles";
// Utils
import reactAutobind from "react-autobind";
import ContextModule from "../../utils/contextModule";
// Solana
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Keypair } from "@solana/web3.js";
import { mnemonicToSeedSync } from "bip39";
import { Wallet } from "ethers";
import EncryptedStorage from "react-native-encrypted-storage";
import { FormItem } from "react-native-form-component";
import KeyboardAwareScrollViewComponent from "./components/keyboardAvoid";
import { EVMs, Solana } from "../../utils/constants";

class ImportWallet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stage: 0,
      mnemonic: ["", "", "", "", "", "", "", "", "", "", "", ""],
      loading: false,
    };
    reactAutobind(this);
  }

  static contextType = ContextModule;

  async saveWallet() {
    const wallet = Wallet.fromMnemonic(
      this.state.mnemonic
        .map((e) => e.replace(" ", ""))
        .join(" ")
        .toLowerCase()
    );
    const seed = mnemonicToSeedSync(
      this.state.mnemonic
        .map((e) => e.replace(" ", ""))
        .join(" ")
        .toLowerCase(),
      ""
    );
    const newAccount = Keypair.fromSeed(seed.slice(0, 32));
    await this.storePublicKey(newAccount.publicKey.toBase58());
    await this.storePrivateKey(newAccount._keypair.secretKey.toString());
    await this.storeETHPublicKey(wallet.address);
    await this.storeETHPrivateKey(wallet._signingKey().privateKey);
    await this.storeKind(0);
    await this.selectedWallet(0);
    await this.storeDefaults([Solana, ...EVMs]);
    await this.storeNFTS([]);
    await this.storeNFTselected("")
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

  async storeNFTS(nfts) {
    try {
      await AsyncStorage.setItem("nfts", JSON.stringify(nfts));
    } catch (e) {
      // saving error
    }
  }
  async storeDefaults(chains) {
    try {
      await AsyncStorage.setItem("chains", JSON.stringify({ chains }));
    } catch (e) {
      // saving error
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

  async storeETHPublicKey(publicKey) {
    try {
      await AsyncStorage.setItem(
        "ethPublicKey",
        JSON.stringify({ publicKey: [publicKey] })
      );
    } catch (e) {
      // saving error
    }
  }

  async storePrivateKey(privateKey) {
    try {
      await EncryptedStorage.setItem(
        "privateKey",
        JSON.stringify({
          privateKey: [privateKey],
        })
      );
    } catch (error) {
      // There was an error on the native side
    }
  }

  async storeETHPrivateKey(privateKey) {
    try {
      await EncryptedStorage.setItem(
        "ethPrivateKey",
        JSON.stringify({
          privateKey: [privateKey],
        })
      );
    } catch (error) {
      // There was an error on the native side
    }
  }

  async storeKind(kind) {
    try {
      await AsyncStorage.setItem("kind", JSON.stringify({ kind }));
    } catch (e) {
      // saving error
    }
  }

  async selectedWallet(selected) {
    try {
      await AsyncStorage.setItem("selected", JSON.stringify({ selected }));
    } catch (e) {
      // saving error
    }
  }

  async componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);
    });
    this.props.navigation.addListener("blur", async () => {});
  }

  async setValueAsync(value) {
    return new Promise((resolve) => {
      this.context.setValue(
        {
          ...value,
        },
        () => resolve()
      );
    });
  }

  render() {
    return (
      <SafeAreaView style={[{ flex: 1 }]}>
        <KeyboardAwareScrollViewComponent
          contentContainerStyle={[
            GlobalStyles.container,
            { paddingTop: StatusBarHeight, paddingBottom: NavigatorBarHeight },
          ]}
        >
          <View
            style={{
              height: "80%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={[GlobalStyles.title]}>Set Secret Recovery Phrase</Text>
            <Text style={[GlobalStyles.description]}>
              Write your 12 words to get your wallet back
            </Text>
            <View
              style={{
                flexWrap: "wrap",
                flexDirection: "row",
                justifyContent: "space-evenly",
                alignItems: "stretch",
              }}
            >
              {[...Array(12).keys()].map((item, index) => (
                <View
                  key={"word:" + index}
                  style={{
                    width: Dimensions.get("screen").width * 0.3,
                  }}
                >
                  <FormItem
                    key={"seed:" + index}
                    style={{
                      backgroundColor: "black",
                      borderRadius: 10,
                      borderColor: "white",
                      borderWidth: 0.5,
                    }}
                    value={this.state.mnemonic[index]}
                    onChangeText={(e) => {
                      let temp = [...this.state.mnemonic];
                      temp[index] = e;
                      this.setState({
                        mnemonic: [...temp],
                      });
                    }}
                    label={`#${index + 1} word `}
                    labelStyle={{
                      color: "white",
                    }}
                    keyboardType="ascii-capable"
                  />
                </View>
              ))}
            </View>
          </View>
          <View
            style={{
              height: "20%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {[...Array(4).keys()].map((item, index) => (
                <Text
                  key={"dot:" + index}
                  style={{
                    color:
                      this.context.value.step >= index ? "white" : "#a3a3a3",
                    marginHorizontal: 20,
                    fontSize: 38,
                  }}
                >
                  {this.context.value.step >= index ? "•" : "·"}
                </Text>
              ))}
            </View>
            <Pressable
              disabled={
                this.state.loading || this.state.mnemonic.some((e) => e === "")
              }
              style={[
                GlobalStyles.buttonStyle,
                {
                  backgroundColor:
                    this.state.loading ||
                    this.state.mnemonic.some((e) => e === "")
                      ? "#00e59977"
                      : "#00e599",
                },
              ]}
              onPress={async () => {
                this.setState({
                  loading: true,
                });
                setTimeout(async () => {
                  await this.saveWallet();
                  await this.setValueAsync({
                    step: 1,
                  });
                  this.props.navigation.navigate("CreatePin");
                }, 100);
              }}
            >
              <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                {this.state.loading ? "Encrypting..." : "Continue"}
              </Text>
            </Pressable>
            <Pressable
              disabled={this.state.loading}
              style={[
                GlobalStyles.buttonStyle,
                {
                  backgroundColor: this.state.loading ? "#db00ff77" : "#db00ff",
                },
              ]}
              onPress={async () => {
                this.props.navigation.navigate("Setup");
              }}
            >
              <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </KeyboardAwareScrollViewComponent>
      </SafeAreaView>
    );
  }
}

export default ImportWallet;
