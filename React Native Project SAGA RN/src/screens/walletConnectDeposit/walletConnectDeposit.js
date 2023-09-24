import UniversalProvider from "@walletconnect/universal-provider";
import { ethers } from "ethers";
import React, { Component } from "react";
import reactAutobind from "react-autobind";
import {
  Dimensions,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "react-native-form-component";
import QRCodeStyled from "react-native-qrcode-styled";
import checkMark from "../../assets/checkMark.png";
import Renders from "../../assets/logo.png";
import WalletConnect from "../../assets/wclogo.png";
import GlobalStyles from "../../styles/styles";
import { EVMs } from "../../utils/constants";
import ContextModule from "../../utils/contextModule";
import KeyboardAwareScrollViewComponent from "./components/keyboardAvoid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { abiERC20 } from "../../contractsETH/erc20";
import { WC_ID } from "@env";
import { getSdkError } from "@walletconnect/utils";

const WalletConnectDepositNetworks = EVMs.map((item) => {
  return {
    ...item,
    value: item.rpc,
    label: item.network,
  };
});

const WalletConnectDepositBaseState = {
  qr: null,
  networkSelected: WalletConnectDepositNetworks[0],
  tokenSelected: WalletConnectDepositNetworks[0].tokens.map((item) => {
    return {
      ...item,
      value: item.contract,
      label: item.symbol,
    };
  })[0],
  amount: "0",
  account: "",
  paymentStatus: "Processing...",
  signature: "",
  stage: 0,
  loading: false,
};

class WalletConnectDeposit extends Component {
  constructor(props) {
    super(props);
    this.state = WalletConnectDepositBaseState;
    reactAutobind(this);
    this.connector = null;
    this.mount = true;
  }

  static contextType = ContextModule;

  async setupWC() {
    this.connector = await UniversalProvider.init({
      projectId: WC_ID, // REQUIRED your projectId
      metadata: {
        name: "EffiSend App",
        description:
          "EffiSend -Mobile-First wallet, cash out ramp and Point of Sale Superapp",
        url: "http://effisend.com/",
        icons: ["https://i.ibb.co/HpqQFrJ/logo-Stroke.png"],
      },
    });

    this.connector.on("display_uri", (uri) => {
      console.log(uri);
      (this.state.qr === null || this.state.stage === 0) &&
        this.mount &&
        this.setState({
          qr: uri,
          stage: 1,
          loading: false,
        });
    });

    // Subscribe to session ping
    this.connector.on("session_ping", ({ id, topic }) => {
      console.log("session_ping", id, topic);
    });

    // Subscribe to session event
    this.connector.on("session_event", ({ event, chainId }) => {
      console.log("session_event", event, chainId);
    });

    // Subscribe to session update
    this.connector.on("session_update", ({ topic, params }) => {
      console.log("session_update", topic, params);
    });

    // Subscribe to session delete
    this.connector.on("session_delete", ({ id, topic }) => {
      console.log("session_delete", id, topic);
    });

    // session established
    this.connector.on("connect", async (e) => {
      const address = await this.connector.request(
        {
          method: "eth_accounts",
          params: [],
        },
        "eip155:" + this.state.networkSelected.chainId.toString()
      );
      await this.setStateAsync({
        account: address[0],
        stage: 2,
      });
      this.createTransaction();
    });
    // session disconnect
    this.connector.on("disconnect", async (e) => {
      console.log(e);
      console.log("Connection Disconnected");
    });
    this.connector
      .connect({
        namespaces: {
          eip155: {
            methods: ["eth_sendTransaction"],
            chains: ["eip155:" + this.state.networkSelected.chainId.toString()],
            events: ["chainChanged", "accountsChanged"],
            rpcMap: {},
          },
        },
      })
      .then((e) => {
        console.log("Connection OK");
        console.log(e);
      })
      .catch(async (e) => {
        console.log(e);
        console.log("Connection Rejected");
        this.connector && this.cancelAndClearConnection();
        this.mount && this.setState(WalletConnectDepositBaseState);
      });
  }

  async cancelAndClearConnection() {
    const topic = this.state.qr.substring(
      this.state.qr.indexOf("wc:") + 3,
      this.state.qr.indexOf("@")
    );
    await this.connector.client.disconnect({
      topic,
      reason: getSdkError("USER_DISCONNECTED"),
    });
    await this.clearAsyncStorageWC();
    this.connector = null;
    delete this.connector;
  }

  componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);
      this.mount = true;
      this.mount && this.setState(WalletConnectDepositBaseState);
    });
    this.props.navigation.addListener("blur", async () => {
      this.connector && this.cancelAndClearConnection();
      this.mount && this.setState(WalletConnectDepositBaseState);
      this.mount = false;
    });
  }

  async componentWillUnmount() {
    this.connector && this.cancelAndClearConnection();
    this.mount && this.setState(WalletConnectDepositBaseState);
    this.mount = false;
  }

  async setStateAsync(value) {
    return new Promise((resolve) => {
      this.mount &&
        this.setState(
          {
            ...value,
          },
          () => resolve()
        );
    });
  }

  async createTransaction() {
    console.log("Transaction");
    this.mount &&
      this.setState({
        loading: true,
      });
    if (this.state.networkSelected.token === this.state.tokenSelected.label) {
      console.log("transfer");
      this.transfer(
        this.state.amount,
        this.state.account,
        this.context.value.ethPublicKey
      );
    } else {
      console.log("transfer token");
      this.transferToken(
        this.state.amount,
        this.state.account,
        this.context.value.ethPublicKey,
        this.state.tokenSelected.value
      );
    }
  }

  async transfer(amount, from, to) {
    try {
      let { rpc } = this.state.networkSelected;
      const provider = new ethers.providers.JsonRpcProvider(rpc);
      const web3Provider = new ethers.providers.Web3Provider(this.connector);
      const nonce = await provider.getTransactionCount(from, "latest");
      //const gasPrice = await provider.getGasPrice();
      let transaction = {
        from,
        to,
        nonce,
        data: "0x",
        value: ethers.utils.parseUnits(amount, "ether")._hex,
        //gasPrice: gasPrice._hex,
      };
      const gas = await provider.estimateGas(transaction);
      transaction = {
        ...transaction,
        gas: gas._hex,
      };
      const result = await web3Provider.send("eth_sendTransaction", [
        transaction,
      ]);
      console.log(result);
      await provider.waitForTransaction(result);
      this.mount &&
        (await this.setStateAsync({
          paymentStatus: "Confirmed",
          signature: result,
          stage: 2,
          loading: false,
        }));
        console.log("Clear Connection")
        this.connector && await this.cancelAndClearConnection();
    } catch (err) {
      console.log("Error on Transaction")
      console.log(err);
      console.log("Clear Connection")
      this.connector && await this.cancelAndClearConnection();
      this.mount && this.setState(WalletConnectDepositBaseState);
    }
  }

  async transferToken(amountToken, from, to, tokenAddress) {
    try {
      let { rpc } = this.state.networkSelected;
      const provider = new ethers.providers.JsonRpcProvider(rpc);
      const web3Provider = new ethers.providers.Web3Provider(this.connector);
      const tokenContract = new ethers.Contract(
        tokenAddress,
        abiERC20,
        provider
      );
      const tokenDecimals = await tokenContract.decimals();
      const amount = BigInt(
        parseFloat(amountToken) * Math.pow(10, tokenDecimals)
      );
      //const gasPrice = await provider.getGasPrice();
      const nonce = await provider.getTransactionCount(from, "latest");
      let transaction = await tokenContract.populateTransaction.transfer(
        to,
        amount.toString()
      );
      transaction = {
        ...transaction,
        from,
        nonce,
        value: "0x0",
        //gasPrice: gasPrice._hex,
      };
      const gas = await provider.estimateGas(transaction);
      transaction = {
        ...transaction,
        gas: gas._hex,
      };
      const result = await web3Provider.send("eth_sendTransaction", [
        transaction,
      ]);
      await provider.waitForTransaction(result);
      this.mount &&
        (await this.setStateAsync({
          paymentStatus: "Confirmed",
          signature: result,
          stage: 2,
          loading: false,
        }));
    } catch (err) {
      console.log("Error on Transaction")
      console.log(err);
      this.mount && this.setState(WalletConnectDepositBaseState);
    }
    console.log("Clear Connection")
    this.connector && this.cancelAndClearConnection();
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
    const styles = StyleSheet.create({
      input: {
        width: Dimensions.get("window").width * 0.9,
        paddingHorizontal: 12,
        marginBottom: 6,
        marginTop: 6,
        borderRadius: 5,
        borderColor: "#00e599",
        borderWidth: 1,
        backgroundColor: "#fff",
        color: "black",
        fontSize: 24,
        textAlign: "center",
      },
      inputText: {
        fontSize: 24,
        color: "black",
        textAlign: "center",
      },
    });
    return (
      <>
        <View style={GlobalStyles.container}>
          <View
            style={[
              GlobalStyles.header,
              {
                flexDirection: "row",
                justifyContent: "space-between",
                alignContent: "center",
              },
            ]}
          >
            <View style={GlobalStyles.headerItem}>
              <Image
                source={Renders}
                alt="Cat"
                style={{ width: 304 / 6, height: 342 / 6, marginLeft: 20 }}
              />
            </View>
            <View style={GlobalStyles.headerItem} />
            <View style={GlobalStyles.headerItem}>
              <Pressable
                style={GlobalStyles.buttonLogoutStyle}
                onPress={() => {
                  this.props.navigation.goBack();
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 18, fontWeight: "bold" }}
                >
                  Return
                </Text>
              </Pressable>
            </View>
          </View>
          <View
            style={[
              GlobalStyles.mainComplete,
              { justifyContent: "space-evenly", alignItems: "center" },
            ]}
          >
            {this.state.stage === 0 && (
              <KeyboardAwareScrollViewComponent>
                <View
                  style={[
                    GlobalStyles.mainComplete,
                    { justifyContent: "space-evenly", alignItems: "center" },
                  ]}
                >
                  <Image
                    resizeMode="contain"
                    source={WalletConnect}
                    alt="Cat"
                    style={{
                      width: "60%",
                      height: "20%",
                      marginVertical: "10%",
                    }}
                  />
                  <Picker
                    isRequired
                    style={styles.inputText}
                    buttonStyle={[styles.input]}
                    itemLabelStyle={styles.inputText}
                    labelStyle={[styles.inputText, { color: "white" }]}
                    selectedValueStyle={[
                      styles.inputText,
                      { width: "100%", marginLeft: "5%" },
                    ]}
                    items={WalletConnectDepositNetworks}
                    selectedValue={this.state.networkSelected.value}
                    label=" Network"
                    onSelection={(item) => {
                      this.mount &&
                        this.setState({
                          networkSelected: item,
                          tokenSelected: item.tokens.map((item) => {
                            return {
                              ...item,
                              value: item.contract,
                              label: item.symbol,
                            };
                          })[0],
                        });
                    }}
                  />
                  <Picker
                    isRequired
                    style={styles.inputText}
                    buttonStyle={[styles.input]}
                    itemLabelStyle={styles.inputText}
                    labelStyle={[styles.inputText, { color: "white" }]}
                    selectedValueStyle={[
                      styles.inputText,
                      { width: "100%", marginLeft: "5%" },
                    ]}
                    items={this.state.networkSelected.tokens.map((item) => {
                      return {
                        ...item,
                        value: item.contract,
                        label: item.symbol,
                      };
                    })}
                    label="ERC20 Token"
                    selectedValue={this.state.tokenSelected.value}
                    onSelection={(item) => {
                      this.mount &&
                        this.setState({
                          tokenSelected: item,
                        });
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 24,
                      color: "#FFF",
                      fontWeight: "bold",
                    }}
                  >
                    Amount
                  </Text>
                  <TextInput
                    style={[styles.input, { color: "#000" }]}
                    keyboardType="number-pad"
                    value={this.state.amount}
                    onChangeText={(value) =>
                      this.mount && this.setState({ amount: value })
                    }
                  />
                  <View>
                    <Pressable
                      disable={this.state.loading}
                      style={
                        this.state.loading
                          ? GlobalStyles.buttonStyleDisabled
                          : GlobalStyles.buttonStyle
                      }
                      onPress={async () => {
                        this.mount &&
                          this.setState({
                            loading: true,
                          });
                        await this.setupWC();
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 24,
                          fontWeight: "bold",
                        }}
                      >
                        {this.state.loading
                          ? "Creating..."
                          : "Create Payment QR"}
                      </Text>
                    </Pressable>
                    <Pressable
                      disable={this.state.loading}
                      style={
                        this.state.loading
                          ? GlobalStyles.buttonStyleDisabled
                          : GlobalStyles.buttonStyle
                      }
                      onPress={() => {
                        this.props.navigation.navigate("Receive");
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 24,
                          fontWeight: "bold",
                        }}
                      >
                        Cancel
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </KeyboardAwareScrollViewComponent>
            )}
            {this.state.stage === 1 && (
              <SafeAreaView style={GlobalStyles.main}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: "column",
                    justifyContent: "space-evenly",
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Text
                      style={{
                        fontSize: 28,
                        fontWeight: "bold",
                        color: "white",
                        textAlign: "center",
                        marginVertical: 10,
                      }}
                    >
                      Receive {this.state.tokenSelected.label}
                    </Text>
                  </View>
                  <QRCodeStyled
                    maxSize={Dimensions.get("screen").width * 0.85}
                    data={this.state.qr ?? "a"}
                    style={[
                      {
                        backgroundColor: "white",
                        borderRadius: 10,
                      },
                    ]}
                    errorCorrectionLevel="H"
                    padding={16}
                    pieceBorderRadius={4}
                    isPiecesGlued
                    color={"black"}
                  />
                  <Text
                    style={{
                      textShadowRadius: 1,
                      fontSize: 24,
                      fontWeight: "bold",
                      color:
                        this.state.paymentStatus === "Processing..."
                          ? "#d820f9"
                          : "#00e599",
                      paddingVertical: 5,
                    }}
                  >
                    {this.state.paymentStatus}
                  </Text>
                  <Pressable
                    style={GlobalStyles.buttonStyle}
                    onPress={async () => {
                      this.connector && this.cancelAndClearConnection();
                      this.mount && this.setState(WalletConnectDepositBaseState);
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 24,
                        fontWeight: "bold",
                      }}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              </SafeAreaView>
            )}
            {this.state.stage === 2 && (
              <SafeAreaView style={GlobalStyles.main}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={checkMark}
                    alt="check"
                    style={{ width: 200, height: 200 }}
                  />
                  <Text
                    style={{
                      textShadowRadius: 1,
                      fontSize: 28,
                      fontWeight: "bold",
                      color:
                        this.state.paymentStatus === "Processing..."
                          ? "#d820f9"
                          : "#00e599",
                      paddingTop: 10,
                    }}
                  >
                    {this.state.paymentStatus}
                  </Text>
                  <View
                    style={[
                      GlobalStyles.network,
                      {
                        width: Dimensions.get("screen").width * 0.9,
                        justifyContent: "space-around",
                      },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-around",
                      }}
                    >
                      <View style={{ marginHorizontal: 20 }}>
                        <Text style={{ fontSize: 20, color: "white" }}>
                          {this.state.networkSelected.network}
                        </Text>
                        <Text style={{ fontSize: 14, color: "white" }}>
                          WalletConnect
                        </Text>
                      </View>
                    </View>
                    <View>{this.state.tokenSelected.icon}</View>
                    <View
                      style={{
                        marginHorizontal: 20,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text>
                        {this.state.amount} {this.state.tokenSelected.label}
                      </Text>
                    </View>
                  </View>
                  <View>
                    <Pressable
                      disable={this.state.loading}
                      style={
                        this.state.loading
                          ? GlobalStyles.buttonStyleDisabled
                          : GlobalStyles.buttonStyle
                      }
                      onPress={() =>
                        Linking.openURL(
                          this.state.networkSelected.blockExplorer +
                            "tx/" +
                            this.state.signature
                        )
                      }
                    >
                      <Text
                        style={{
                          fontSize: 24,
                          fontWeight: "bold",
                          color: "white",
                          textAlign: "center",
                        }}
                      >
                        View on Explorer
                      </Text>
                    </Pressable>
                    <Pressable
                      disable={this.state.loading}
                      style={
                        this.state.loading
                          ? GlobalStyles.buttonStyleDisabled
                          : GlobalStyles.buttonStyle
                      }
                      onPress={() => this.props.navigation.navigate("Main")}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 24,
                          fontWeight: "bold",
                        }}
                      >
                        Done
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </SafeAreaView>
            )}
          </View>
        </View>
      </>
    );
  }
}

export default WalletConnectDeposit;
