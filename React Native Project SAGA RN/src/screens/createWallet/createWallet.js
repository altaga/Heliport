// Basic Imports
import React, { Component } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
// Styles
import GlobalStyles from "../../styles/styles";
// Assets
// Utils
import reactAutobind from "react-autobind";
import ContextModule from "../../utils/contextModule";
// Solana
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Keypair } from "@solana/web3.js";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { Wallet } from "ethers";
import EncryptedStorage from "react-native-encrypted-storage";
import ReactNativeBiometrics from "react-native-biometrics";
import { EVMs, Solana } from "../../utils/constants";

class CreateWallet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stage: 0,
      mnemonic: "",
      loading: false,
      biometrics: false,
    };
    reactAutobind(this);
    this.biometrics = null;
  }

  static contextType = ContextModule;

  async createWallet() {
    const mnemonic = generateMnemonic();
    this.setState({
      mnemonic,
    });
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

  async saveWallet() {
    const wallet = Wallet.fromMnemonic(this.state.mnemonic);
    const seed = mnemonicToSeedSync(this.state.mnemonic, "");
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
    this.biometrics = new ReactNativeBiometrics();
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);
      this.createWallet();
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
      <View style={GlobalStyles.container}>
        <View
          style={{
            height: "70%",
            justifyContent: "space-evenly",
            alignItems: "center",
          }}
        >
          <Text style={GlobalStyles.title}>Secret Recovery Phrase</Text>
          <Text style={GlobalStyles.description}>
            This is the only way you will be able to recover your wallet. Please
            store it somewhere safe!
          </Text>
          <View
            style={{
              flexWrap: "wrap",
              flexDirection: "row",
              justifyContent: "space-evenly",
              alignItems: "stretch",
            }}
          >
            {this.state.mnemonic.split(" ").map((item, index) => (
              <React.Fragment key={"seed:" + index}>
                <View
                  style={{
                    backgroundColor: "black",
                    width: Dimensions.get("screen").width * 0.3,
                    marginVertical: 10,
                    alignItems: "flex-start",
                    borderRadius: 10,
                    borderColor: "white",
                    borderWidth: 0.5,
                  }}
                >
                  <Text style={{ margin: 10, fontSize: 15 }}>
                    {`${index + 1} | `}
                    {item}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
        <View
          style={{
            height: "30%",
            justifyContent: "space-evenly",
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
            disabled={this.state.loading}
            style={[
              GlobalStyles.buttonStyle,
              {
                backgroundColor: this.state.loading ? "#00e59977" : "#00e599",
                marginVertical: 0,
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
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
              {this.state.loading ? "Encrypting..." : "Continue"}
            </Text>
          </Pressable>
          <Pressable
            disabled={this.state.loading}
            style={[
              GlobalStyles.buttonStyle,
              {
                backgroundColor: this.state.loading ? "#db00ff77" : "#db00ff",
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

export default CreateWallet;
