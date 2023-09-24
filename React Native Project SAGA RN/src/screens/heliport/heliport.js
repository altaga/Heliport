import React, { Component } from "react";
import reactAutobind from "react-autobind";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Renders from "../../assets/logo.png";
import GlobalStyles from "../../styles/styles";
import ContextModule from "../../utils/contextModule";
import IconIonIcons from "react-native-vector-icons/Ionicons";
// Tabs
import AppStateListener from "../../utils/appStateListener";
import KeyboardAwareScrollViewComponent from "./components/keyboardAvoid";
import { Picker } from "react-native-form-component";
import { Solana } from "../../utils/constants";
import Cam from "./components/cam";
import { LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import CryptoSign from "./components/cryptoSign";
import CryptoSignSeedVault from "./components/cryptoSignSeedVault";
import checkMark from "../../assets/checkMark.png";

function setTokens(array) {
  return array.map((item) => {
    return {
      ...item,
      value: item.contract,
      label: item.symbol,
    };
  });
}

const BaseStateHeliport = {
  stage: 0,
  tokenSelected: setTokens(Solana.tokens)[0],
  address: "", // ""
  amount: "", // ""
  transaction: {},
  transactionDisplay: {
    kind: "heliport_signTransaction",
    name: setTokens(Solana.tokens)[0].symbol,
    amount: 0,
    gas: 0,
  },
  check: "Get blockhash",
  loading: false,
  status: "Processing...",
  blockhash: "",
  modal: false,
};

class Heliport extends Component {
  constructor(props) {
    super(props);
    this.state = BaseStateHeliport;
    reactAutobind(this);
    this.mount = true;
  }

  static contextType = ContextModule;

  componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);
      this.mount = true;
      this.setState(BaseStateHeliport);
      await this.resetCam();
    });
    this.props.navigation.addListener("blur", async () => {
      this.setState(BaseStateHeliport);
      await this.resetCam();
      this.mount = false;
    });
  }

  async signSolana(e) {
    this.setState({
      stage:2,
    })
    this.props.method("0001", "0003", "sendTransaction", [e])
  }

  async prepareTransaction() {
    let amount = Math.round(LAMPORTS_PER_SOL * parseFloat(this.state.amount));
    const instructions = [
      SystemProgram.transfer({
        fromPubkey: this.context.value.publicKey,
        toPubkey: new PublicKey(this.state.address),
        lamports: amount,
      }),
    ];
    // Transaction Legacy
    let transaction = new Transaction().add(instructions[0]);
    transaction.recentBlockhash = this.state.blockhash;
    transaction.feePayer = this.context.value.publicKey;
    this.setState({
      transaction,
      transactionDisplay: {
        kind: "heliport_signTransaction",
        name: this.state.tokenSelected.symbol,
        amount: parseFloat(this.state.amount),
        gas: 0,
      },
      modal: true,
    });
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

  async resetCam() {
    await this.setStateAsync({ reset: true });
    await this.setStateAsync({ reset: false });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.fail !== this.props.fail && this.props.fail !== null) {
      // Detect RPC Found
      this.setState(BaseStateHeliport);
    }
    if (
      prevProps.methodResponse !== this.props.methodResponse &&
      this.props.methodResponse !== null
    ) {
      // Detect Data
      let temp = this.props.methodResponse;
      console.log(temp)
      if (temp === "ok") {
        this.setState({
          status:"Confirmed"
        });
        this.props.startScan();
      } else {
        this.setState({
          stage: 0,
          loading: false,
          check: "Send",
          blockhash: temp,
        });
      }
    }
  }

  render() {
    const modalScale = 0.5;
    return (
      <>
        <AppStateListener navigation={this.props.navigation} />
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
            <View style={GlobalStyles.headerItem}></View>
            <View style={GlobalStyles.headerItem}>
              <Pressable
                style={GlobalStyles.buttonLogoutStyle}
                onPress={() => {
                  this.props.navigation.navigate("Main");
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
          <Modal
            visible={this.state.modal}
            transparent={true}
            animationType="slide"
          >
            <View
              style={{
                alignSelf: "center",
                backgroundColor: "#1E2423",
                width: Dimensions.get("window").width * 0.94,
                height: Dimensions.get("window").height * modalScale,
                marginTop:
                  Dimensions.get("window").height * (0.99 - modalScale),
                borderWidth: 2,
                borderColor: `#00e599`,
                padding: 20,
                borderRadius: 25,
                justifyContent: "space-around",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 30,
                  width: "80%",
                }}
              >
                Transaction
              </Text>
              <View
                style={{
                  backgroundColor: `#00e599`,
                  height: 1,
                  width: "90%",
                  marginVertical: 10,
                }}
              />
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 26,
                  width: "100%",
                }}
              >
                {this.state.transactionDisplay.kind}
              </Text>
              <View
                style={{
                  backgroundColor: `#00e599`,
                  height: 1,
                  width: "90%",
                  marginVertical: 10,
                }}
              />
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 20,
                  width: "100%",
                }}
              >
                Amount:
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 24,
                  width: "100%",
                }}
              >
                {`${epsilonRound(this.state.transactionDisplay.amount, 8)}`}{" "}
                {this.state.transactionDisplay.name}
              </Text>
              <View
                style={{
                  backgroundColor: `#00e599`,
                  height: 1,
                  width: "90%",
                  marginVertical: 10,
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <Pressable
                  style={[
                    GlobalStyles.singleModalButton,
                    {
                      width: "45%",
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      borderRightColor: "black",
                      borderRightWidth: 2,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                  onPress={async () => {
                    await this.setStateAsync({
                      modal: false,
                    });
                    await this.setStateAsync({
                      stage: 1,
                    });
                  }}
                >
                  <Text style={[GlobalStyles.singleModalButtonText]}>
                    Accept
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    GlobalStyles.singleModalButton,
                    {
                      width: "45%",
                      alignItems: "center",
                      justifyContent: "center",
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    },
                  ]}
                  onPress={() =>
                    this.mount &&
                    this.setState(BaseStateHeliport)
                  }
                >
                  <Text style={[GlobalStyles.singleModalButtonText]}>
                    Reject
                  </Text>
                </Pressable>
              </View>
            </View>
          </Modal>
          {this.state.stage === 0 && (
            <KeyboardAwareScrollViewComponent>
              <View style={GlobalStyles.mainComplete}>
                <View
                  style={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <View
                    style={{
                      alignItems: "center",
                    }}
                  >
                    <View style={{ marginTop: 20 }} />
                    <Text
                      style={{
                        fontSize: 24,
                        color: "#FFF",
                        fontWeight: "bold",
                      }}
                    >
                      Address
                    </Text>
                    <View
                      style={{
                        width: Dimensions.get("screen").width,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ width: "90%" }}>
                        <TextInput
                          style={[GlobalStyles.input, { fontSize: 12 }]}
                          keyboardType="default"
                          value={this.state.address}
                          onChangeText={(value) =>
                            this.mount && this.setState({ address: value })
                          }
                        />
                      </View>
                      <Pressable
                        onPress={() =>
                          this.mount && this.setState({ stage: 3 })
                        }
                        style={{ width: "10%" }}
                      >
                        <IconIonIcons
                          name="qr-code"
                          size={30}
                          color={"white"}
                        />
                      </Pressable>
                    </View>
                    <Picker
                      isRequired
                      buttonStyle={[
                        GlobalStyles.inputSelector,
                        { width: Dimensions.get("screen").width * 0.9 },
                      ]}
                      labelStyle={[GlobalStyles.inputSelectorLabel]}
                      itemLabelStyle={[GlobalStyles.inputSelectorText]}
                      selectedValueStyle={[GlobalStyles.inputSelectorText]}
                      items={[setTokens(Solana.tokens)[0]]}
                      label="Token"
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
                    <View
                      style={{
                        width: Dimensions.get("screen").width,
                        flexDirection: "row",
                        justifyContent: "space-around",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ width: "80%" }}>
                        <TextInput
                          style={[GlobalStyles.input]}
                          keyboardType="decimal-pad"
                          value={this.state.amount}
                          onChangeText={(value) =>
                            this.mount && this.setState({ amount: value })
                          }
                        />
                      </View>
                      <Pressable
                        disabled={this.state.maxLoading}
                        style={{ width: "20%", alignItems: "center" }}
                        onPress={() => {
                          if (this.state.tokenSelected.symbol === "SOL") {
                            console.log("Sol Transfer");
                            this.solanaMaxTransfer();
                          } else {
                            console.log("Sol Token Transfer");
                            this.solanaMaxTokenTransfer();
                          }
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "bold",
                            color: "white",
                          }}
                        >
                          {this.state.maxLoading ? (
                            <IconFeatherIcons
                              name="loader"
                              size={24}
                              color="white"
                            ></IconFeatherIcons>
                          ) : (
                            "Max"
                          )}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  <Pressable
                    disabled={this.state.loading}
                    style={
                      this.state.loading
                        ? GlobalStyles.buttonStyleDisabled
                        : GlobalStyles.buttonStyle
                    }
                    onPress={() => {
                      if (this.state.check === "Send") {
                        this.prepareTransaction();
                      } else {
                        this.setState({
                          loading: true,
                          check: "Getting blockhash...",
                          stage: 0,
                        });
                        this.props.method("0002", "0003", "getBlock", []);
                      }
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 24,
                        fontWeight: "bold",
                      }}
                    >
                      {this.state.check}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </KeyboardAwareScrollViewComponent>
          )}
          {this.state.stage === 1 && (
            <View style={GlobalStyles.mainComplete}>
              {this.context.value.kind === 0 ? (
                <CryptoSign
                  transaction={this.state.transaction}
                  cancelTrans={() =>
                    this.mount && this.setState(BaseStateHeliport)
                  }
                  signSolana={(e) => this.signSolana(e)}
                />
              ) : (
                <CryptoSignSeedVault
                  transaction={this.state.transaction}
                  cancelTrans={() =>
                    this.mount && this.setState(BaseStateHeliport)
                  }
                  signSolana={(e) => this.signSolana(e)}
                />
              )}
            </View>
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
                      this.state.status === "Confirmed" ? "#00e599" : "#d820f9",
                  }}
                >
                  {this.state.status}
                </Text>
                <View
                  style={[
                    GlobalStyles.network,
                    { width: Dimensions.get("screen").width * 0.9 },
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
                        {Solana.network}
                      </Text>
                      <Text style={{ fontSize: 14, color: "white" }}>
                        {this.state.transactionDisplay.kind}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      marginHorizontal: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View style={{ marginHorizontal: 10 }}>
                      {this.state.tokenSelected.icon}
                    </View>
                    <Text>
                      {`${epsilonRound(parseFloat(this.state.amount), 6)}`}{" "}
                      {this.state.tokenSelected.label}
                    </Text>
                  </View>
                </View>
                <View>
                  <Pressable
                    style={
                      this.state.status !== "Confirmed"
                        ? GlobalStyles.buttonStyleDisabled
                        : GlobalStyles.buttonStyle
                    }
                    onPress={() => this.props.navigation.navigate("Main")}
                    disabled={this.state.status !== "Confirmed"}
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
          {this.state.stage === 3 && (
            <View
              style={[
                GlobalStyles.mainComplete,
                { justifyContent: "space-evenly", alignItems: "center" },
              ]}
            >
              <View>
                <Text style={{ color: "white", fontSize: 28 }}>Scan QR</Text>
              </View>
              <View
                style={{
                  height: Dimensions.get("screen").height * 0.6,
                  width: Dimensions.get("screen").width * 0.8,
                  marginVertical: 20,
                  borderColor: "#00e599",
                  borderWidth: 5,
                  borderRadius: 10,
                }}
              >
                <Cam
                  callbackAddress={(e) => {
                    this.mount &&
                      this.setState({
                        address: e,
                        stage: 0,
                        tokenSelected: setTokens(Solana.tokens)[0],
                        transaction: {},
                        transactionDisplay: {
                          kind: "heliport_signTransaction",
                          name: setTokens(Solana.tokens)[0].symbol,
                          decimals: setTokens(Solana.tokens)[0].decimals,
                          amount: 0,
                          gas: 0,
                        },
                      });
                  }}
                />
              </View>
              <Pressable
                style={
                  this.state.explorerURL === ""
                    ? GlobalStyles.buttonStyleDisabled
                    : GlobalStyles.buttonStyle
                }
                onPress={async () => {
                  await this.resetCam();
                  await this.setStateAsync(BaseStateHeliport);
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
          )}
        </View>
      </>
    );
  }
}

export default Heliport;
