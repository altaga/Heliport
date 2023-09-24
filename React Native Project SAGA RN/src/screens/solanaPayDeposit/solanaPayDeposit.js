import React, { Component } from "react";
import reactAutobind from "react-autobind";
import {
  View,
  Image,
  Pressable,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Linking,
} from "react-native";
import Renders from "../../assets/logo.png";
import GlobalStyles from "../../styles/styles";
import ContextModule from "../../utils/contextModule";
import KeyboardAwareScrollViewComponent from "./components/keyboardAvoid";
import { FormItem, Picker } from "react-native-form-component";
import { splTokens } from "../../utils/constants";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { encodeURL, findReference } from "@solana/pay";
import QRCodeStyled from "react-native-qrcode-styled";
import checkMark from "../../assets/checkMark.png";

const SolanaPayDepositBaseState = {
  qr: "", //
  qrImage: "",
  splToken: splTokens[0],
  amount: "",
  label: "",
  message: "",
  memo: "",
  paymentStatus: "Pending...",
  signature: "",
  stage: 0,
  printData: "",
  loading: false,
  publish: {
    message: "",
    topic: "",
  },
  explorerURL: "",
};

class SolanaPayDeposit extends Component {
  constructor(props) {
    super(props);
    this.state = SolanaPayDepositBaseState;
    reactAutobind(this);
    this.interval;
    this.connection = new Connection(
      clusterApiUrl("mainnet-beta"),
      "confirmed"
    );
  }

  static contextType = ContextModule;

  componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);
    });
    this.props.navigation.addListener("blur", async () => {
      clearInterval(this.interval);
    });
  }

  componentWillUnmount() {
    //clearInterval(this.interval);
  }

  async setStateAsyncDelay(value, delay) {
    return new Promise((resolve) => {
      this.setState(
        {
          ...value,
        },
        () =>
          setTimeout(() => {
            resolve();
          }, delay)
      );
    });
  }

  async createTransaction() {
    const recipient = new PublicKey(this.context.value.publicKey);
    const splToken = this.state.splToken.value;
    const amount = new BigNumber(parseFloat(this.state.amount));
    const reference = new Keypair().publicKey;
    const label = this.state.label;
    const message = this.state.message;
    const memo = this.state.memo;
    const url =
      this.state.splToken.label === "SOL"
        ? encodeURL({ recipient, amount, reference, label, message, memo })
        : encodeURL({
            recipient,
            amount,
            reference,
            label,
            message,
            memo,
            splToken,
          });
    this.setState({
      qr: url.toString(),
      loading: false,
      paymentStatus: "Pending...",
      stage: 1,
    });
    let signatureInfo;
    const { signature } = await new Promise((resolve) => {
      this.interval = setInterval(async () => {
        try {
          console.log(".");
          signatureInfo = await findReference(this.connection, reference, {
            finality: "confirmed",
          });
          clearInterval(this.interval);
          resolve(signatureInfo);
        } catch (error) {
          //console.log(error);
        }
      }, 2000);
    });
    this.setState({
      paymentStatus: "Confirmed",
      signature,
      explorerURL: `https://solana.fm/tx/${signature}?cluster=mainnet-solanafmbeta`,
      qr: null,
      stage: 2,
    });
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
                    items={splTokens}
                    label=" SPL Token"
                    selectedValue={this.state.splToken.value}
                    onSelection={(item) => {
                      this.setState({
                        splToken: item,
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
                    onChangeText={(value) => this.setState({ amount: value })}
                  />
                  <FormItem
                    style={styles.input}
                    textInputStyle={styles.inputText}
                    labelStyle={[styles.inputText, { color: "white" }]}
                    label="Label"
                    value={this.state.label}
                    onChangeText={(value) => this.setState({ label: value })}
                  />
                  <FormItem
                    style={styles.input}
                    textInputStyle={styles.inputText}
                    labelStyle={[styles.inputText, { color: "white" }]}
                    label="Message"
                    value={this.state.message}
                    onChangeText={(value) => this.setState({ message: value })}
                  />
                  <FormItem
                    style={[styles.input]}
                    textInputStyle={styles.inputText}
                    labelStyle={[styles.inputText, { color: "white" }]}
                    label="Memo"
                    value={this.state.memo}
                    onChangeText={(value) => this.setState({ memo: value })}
                  />
                  <Pressable
                    disable={this.state.loading}
                    style={
                      this.state.loading
                        ? GlobalStyles.buttonStyleDisabled
                        : GlobalStyles.buttonStyle
                    }
                    onPress={async () => {
                      await this.setStateAsyncDelay(
                        {
                          loading: true,
                        },
                        100
                      );
                      this.createTransaction();
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 24,
                        fontWeight: "bold",
                      }}
                    >
                      {this.state.loading ? "Creating..." : "Create Payment QR"}
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
                      this.props.navigation.goBack();
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
                      {this.state.splToken.label === "SOL"
                        ? "Receive Solana (SOL)"
                        : "Receive " + this.state.splToken.label + " Token"}
                    </Text>
                  </View>
                  <QRCodeStyled
                    maxSize={Dimensions.get("screen").width * 0.85}
                    data={this.state.qr}
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
                        this.state.paymentStatus === "Pending..."
                          ? "#d820f9"
                          : "#00e599",
                      paddingVertical: 5,
                    }}
                  >
                    {this.state.paymentStatus}
                  </Text>
                  <Pressable
                    style={GlobalStyles.buttonStyle}
                    onPress={() => {
                      this.setState(SolanaPayDepositBaseState);
                      this.interval && clearInterval(this.interval);
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
              <View style={GlobalStyles.mainComplete}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: "column",
                    justifyContent: "space-around",
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
                        this.state.paymentStatus === "Pending..."
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
                        justifyContent: "space-evenly",
                      }}
                    >
                      <View>
                        <Text style={{ fontSize: 20, color: "white" }}>
                          Solana
                        </Text>
                        <Text style={{ fontSize: 14, color: "white" }}>
                          Solana Pay
                        </Text>
                      </View>
                    </View>
                    <View>{this.state.splToken.icon}</View>
                    <Text>
                      {this.state.amount} {this.state.splToken.label}
                    </Text>
                  </View>
                  <View>
                    <Pressable
                      style={[GlobalStyles.buttonStyle]}
                      onPress={() => Linking.openURL(this.state.explorerURL)}
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
                      style={GlobalStyles.buttonStyle}
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
              </View>
            )}
          </View>
        </View>
      </>
    );
  }
}

export default SolanaPayDeposit;
