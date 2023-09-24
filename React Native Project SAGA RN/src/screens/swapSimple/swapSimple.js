import React, { Component } from "react";
import reactAutobind from "react-autobind";
import {
  Dimensions,
  Image,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
  Modal,
  ToastAndroid,
} from "react-native";
import Renders from "../../assets/logo.png";
import GlobalStyles from "../../styles/styles";
import ContextModule from "../../utils/contextModule";
import KeyboardAwareScrollViewComponent from "./components/keyboardAvoid";
import { Picker } from "react-native-form-component";
import { Solana } from "../../utils/constants";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  VersionedTransaction,
  clusterApiUrl,
} from "@solana/web3.js";
import { AccountLayout } from "@solana/spl-token";
import { BigNumber, ethers } from "ethers";
import CryptoSign from "./components/cryptoSign";
import checkMark from "../../assets/checkMark.png";
import CryptoSignSeedVault from "./components/cryptoSignSeedVault";

function setTokens(array) {
  return array.map((item) => {
    return {
      ...item,
      value: item.contract,
      label: item.symbol,
    };
  });
}

const tokens = setTokens(Solana.tokens);

const SwapSimpleBaseState = {
  stage: 0,
  amount: "0",
  amountOut: "0",
  tokenFrom: tokens[0],
  tokenTo: tokens[1],
  data: {},
  transaction: {},
  transactionDisplay: {
    kind: "solana_signTransaction",
    name: tokens[0].symbol,
    value: 0,
    gas: 0,
  },
  explorerURL: "",
  check: "Check",
  loading: false,
  modal: false,
  status: "Processing...",
  errorText: "",
};

class SwapSimple extends Component {
  constructor(props) {
    super(props);
    this.state = SwapSimpleBaseState;
    reactAutobind(this);
    this.connection = new Connection(
      clusterApiUrl("mainnet-beta"),
      "confirmed"
    );
    this.mount = true;
  }

  static contextType = ContextModule;

  async signSolana(e) {
    this.mount &&
      this.setState({
        status: "Processing...",
        stage: 2,
        explorerURL: "",
      });
    try {
      const txnSignature = await this.connection.sendRawTransaction(e, {
        maxRetries: 2,
      });
      this.mount &&
        this.setState({
          explorerURL: `https://solana.fm/tx/${txnSignature}?cluster=mainnet-solanafmbeta`,
          status: "Confirmed",
        });
    } catch (e) {
      console.log(e);
      this.mount &&
        this.setState({
          stage: 0,
          explorerURL: "",
          transaction: {},
          check: "Check Again",
          loading: false,
          modal: false,
          status: "Processing...",
          errorText: "There was an error signing the transaction",
        });
    }
  }

  componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      this.mount = true;
      this.mount && this.setState(SwapSimpleBaseState);
    });
    this.props.navigation.addListener("blur", async () => {
      this.mount && this.setState(SwapSimpleBaseState);
      this.mount = false;
    });
  }

  componentWillUnmount() {
    this.mount && this.setState(SwapSimpleBaseState);
    this.mount = false;
  }

  async checkBalances() {
    try {
      const { amount, tokenFrom } = this.state;
      if (tokenFrom.contract === "") {
        const amountFrom = LAMPORTS_PER_SOL * parseFloat(amount);
        const balance = await this.connection.getBalance(
          this.context.value.publicKey
        );
        const minBalance =
          await this.connection.getMinimumBalanceForRentExemption(0);
        return amountFrom >= balance - minBalance;
      } else {
        const mintAddress = new PublicKey(tokenFrom.contract);
        const tokenAccount = await this.connection.getTokenAccountsByOwner(
          this.context.value.publicKey,
          { mint: mintAddress },
          "finalized"
        );
        const tokenBalance = BigNumber.from(
          AccountLayout.decode(tokenAccount.value[0].account.data).amount
        );
        const amountFrom = BigNumber.from(
          parseFloat(amount) * Math.pow(10, tokenFrom.decimals)
        );
        return tokenBalance.lt(amountFrom);
      }
    } catch (err) {
      return true;
    }
  }

  async getSwapOptions() {
    this.setState({
      loading: true,
    });
    const { amount, tokenFrom, tokenTo } = this.state;
    const flag = await this.checkBalances();
    if (flag) {
      this.mount &&
        this.setState({
          stage: 0,
          explorerURL: "",
          transaction: {},
          check: "Check Again",
          loading: false,
          modal: false,
          status: "Processing...",
        });
      ToastAndroid.show(
        capitalizeFirstLetter(`Insufficient ${tokenFrom.symbol} balance`),
        ToastAndroid.LONG
      );
    } else {
      const myHeaders = new Headers();
      const params = new URLSearchParams();
      const solContract = "So11111111111111111111111111111111111111112";
      const inputMint =
        tokenFrom.contract === "" ? solContract : tokenFrom.contract;
      const outputMint =
        tokenTo.contract === "" ? solContract : tokenTo.contract;
      const mult =
        tokenFrom.contract === ""
          ? LAMPORTS_PER_SOL
          : Math.pow(10, tokenFrom.decimals);
      const amountIn = parseFloat(amount) * mult;
      myHeaders.append("accept", "application/json");
      params.set("inputMint", inputMint);
      params.set("outputMint", outputMint);
      params.set("amount", `${amountIn}`);
      params.set("swapMode", "ExactIn");
      params.set("slippageBps", "50"); // Slippage 0.5%
      params.set("feeBps", "30"); // 0.3% fee
      //params.set("onlyDirectRoutes", "false");
      //params.set("asLegacyTransaction", "false");

      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      fetch(`https://quote-api.jup.ag/v4/quote?${params}`, requestOptions)
        .then((response) => response.json())
        .then((result) => {
          const data = result.data.reduce((prev, current) =>
            BigNumber.from(prev.outAmount).gt(BigNumber.from(current.outAmount))
              ? prev
              : current
          );
          let amountOut = ethers.utils.formatUnits(
            BigNumber.from(data.outAmount).toString(),
            tokenTo.decimals
          );
          console.log(data);
          this.setState({
            data,
            amountOut,
            loading: false,
            check: "Swap",
          });
        })
        .catch((error) => {
          console.log("error", error);
          this.mount &&
            this.setState({
              stage: 0,
              explorerURL: "",
              transaction: {},
              check: "Check Again",
              loading: false,
              modal: false,
              status: "Processing...",
            });
          ToastAndroid.show(
            capitalizeFirstLetter(`Failed to quote transaction`),
            ToastAndroid.LONG
          );
        });
    }
  }

  async getSwapTransaction() {
    this.setState({
      loading: true,
    });
    const { data, tokenTo } = this.state;
    const myHeaders = new Headers();
    myHeaders.append("accept", "application/json");
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      route: data,
      userPublicKey: this.context.value.publicKey.toString(),
      wrapUnwrapSOL: true,
      feeAccount: tokenTo.feePubKey,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch("https://quote-api.jup.ag/v4/swap", requestOptions)
      .then((response) => response.json())
      .then(async (result) => {
        const { amount, tokenFrom } = this.state;
        const { swapTransaction } = result;
        const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
        let transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        const res = await this.connection.getFeeForMessage(transaction.message);
        console.log(res.value);
        this.setState({
          transaction,
          transactionDisplay: {
            kind: "solana_signTransaction",
            name: tokenFrom.symbol,
            value: amount,
            gas: res.value / LAMPORTS_PER_SOL,
          },
          modal: true,
        });
      })
      .catch((error) => {
        console.log(error);
        this.mount &&
          this.setState({
            stage: 0,
            explorerURL: "",
            transaction: {},
            check: "Check Again",
            loading: false,
            modal: false,
            status: "Processing...",
          });
        ToastAndroid.show(
          capitalizeFirstLetter(`Failed to create transaction`),
          ToastAndroid.LONG
        );
      });
  }

  render() {
    const modalScale = 0.5;
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
                {this.state.transactionDisplay.value}{" "}
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
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 20,
                  width: "100%",
                }}
              >
                Gas:
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 24,
                  width: "100%",
                }}
              >
                {`${this.state.transactionDisplay.gas}`}
                {" SOL"}
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
                  onPress={() =>
                    this.mount &&
                    this.setState(
                      {
                        modal: false,
                      },
                      () => {
                        this.setState({
                          stage: 1,
                        });
                      }
                    )
                  }
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
                    this.setState({
                      transaction: {},
                      check: "Check",
                      loading: false,
                      modal: false,
                    })
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
              <View
                style={[
                  GlobalStyles.mainComplete,
                  { justifyContent: "space-between", alignItems: "center" },
                ]}
              >
                <View
                  style={{
                    justifyContent: "space-between",
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
                    {"   "}Amount
                  </Text>
                  <View style={{ width: Dimensions.get("window").width }}>
                    <TextInput
                      style={[GlobalStyles.input]}
                      keyboardType="decimal-pad"
                      value={this.state.amount}
                      onChangeText={(value) => {
                        this.mount &&
                          this.setState({
                            amount: value,
                            check: "Check",
                            amountOut: "0",
                            data: {},
                          });
                      }}
                    />
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
                    items={tokens}
                    selectedValue={this.state.tokenFrom.value}
                    label="   From Token"
                    onSelection={(item) => {
                      const { tokenTo } = this.state;
                      if (
                        tokenTo.contract === "" &&
                        tokenTo.contract === item.contract
                      ) {
                        this.mount &&
                          this.setState({
                            tokenTo: tokens[1],
                            tokenFrom: item,
                            check: "Check",
                            amountOut: "0",
                            data: {},
                          });
                      } else if (
                        tokenTo.contract !== "" &&
                        tokenTo.contract === item.contract
                      ) {
                        this.mount &&
                          this.setState({
                            tokenTo: tokens[0],
                            tokenFrom: item,
                            check: "Check",
                            amountOut: "0",
                            data: {},
                          });
                      } else {
                        this.mount &&
                          this.setState({
                            tokenFrom: item,
                            check: "Check",
                            amountOut: "0",
                            data: {},
                          });
                      }
                    }}
                  />
                  <Picker
                    isRequired
                    buttonStyle={[
                      GlobalStyles.inputSelector,
                      { width: Dimensions.get("screen").width * 0.9 },
                    ]}
                    labelStyle={[GlobalStyles.inputSelectorLabel]}
                    itemLabelStyle={[GlobalStyles.inputSelectorText]}
                    selectedValueStyle={[GlobalStyles.inputSelectorText]}
                    items={tokens}
                    selectedValue={this.state.tokenTo.value}
                    label="   To Token"
                    onSelection={(item) => {
                      const { tokenFrom } = this.state;
                      if (
                        tokenFrom.contract === "" &&
                        tokenFrom.contract === item.contract
                      ) {
                        this.mount &&
                          this.setState({
                            tokenFrom: tokens[1],
                            tokenTo: item,
                            check: "Check",
                            amountOut: "0",
                            data: {},
                          });
                      } else if (
                        tokenFrom.contract !== "" &&
                        tokenFrom.contract === item.contract
                      ) {
                        this.mount &&
                          this.setState({
                            tokenFrom: tokens[0],
                            tokenTo: item,
                            check: "Check",
                            amountOut: "0",
                            data: {},
                          });
                      } else {
                        this.mount &&
                          this.setState({
                            tokenTo: item,
                            check: "Check",
                            amountOut: "0",
                            data: {},
                          });
                      }
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 24,
                      color: "#FFF",
                      fontWeight: "bold",
                      marginTop: 10,
                    }}
                  >
                    Amount to receive
                  </Text>
                  <Text
                    style={{
                      fontSize: 24,
                      color: "#FFF",
                      fontWeight: "bold",
                      marginTop: 20,
                    }}
                  >
                    {`${this.state.amountOut} ${this.state.tokenTo.symbol}`}
                  </Text>
                </View>
                <View>
                  <Pressable
                    disabled={this.state.loading}
                    style={[
                      this.state.loading
                        ? GlobalStyles.buttonStyleDisabled
                        : GlobalStyles.buttonStyle,
                      { alignSelf: "center" },
                    ]}
                    onPress={() => {
                      this.state.check === "Swap"
                        ? this.getSwapTransaction()
                        : this.getSwapOptions();
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
                  <Pressable
                    disabled={this.state.loading}
                    style={[
                      this.state.loading
                        ? GlobalStyles.buttonStyleDisabled
                        : GlobalStyles.buttonStyle,
                      { alignSelf: "center" },
                    ]}
                    onPress={() => {
                      this.props.navigation.navigate("Main");
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
            <>
              {this.context.value.kind === 0 ? (
                <CryptoSign
                  transaction={this.state.transaction}
                  cancelTrans={() => {
                    this.mount &&
                      this.setState({
                        stage: 0,
                        explorerURL: "",
                        transaction: {},
                        check: "Check Again",
                        loading: false,
                        modal: false,
                        status: "Processing...",
                      });
                    ToastAndroid.show(
                      capitalizeFirstLetter(`Error signing transaction`),
                      ToastAndroid.LONG
                    );
                  }}
                  signSolana={(e) => this.signSolana(e)}
                />
              ) : (
                <CryptoSignSeedVault
                  transaction={this.state.transaction}
                  cancelTrans={() => {
                    this.mount &&
                      this.setState({
                        stage: 0,
                        explorerURL: "",
                        transaction: {},
                        check: "Check Again",
                        loading: false,
                        modal: false,
                        status: "Processing...",
                      });
                    ToastAndroid.show(
                      capitalizeFirstLetter(`Error signing transaction`),
                      ToastAndroid.LONG
                    );
                  }}
                  signSolana={(e) => this.signSolana(e)}
                />
              )}
            </>
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
                        Solana
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
                      {this.state.tokenFrom.icon}
                    </View>
                    <Text>
                      {this.state.amount} {this.state.tokenFrom.symbol}
                    </Text>
                  </View>
                </View>
                <View>
                  <Pressable
                    style={[
                      this.state.explorerURL === ""
                        ? GlobalStyles.buttonStyleDisabled
                        : GlobalStyles.buttonStyle,
                      { marginBottom: 10 },
                    ]}
                    onPress={() => Linking.openURL(this.state.explorerURL)}
                    disabled={this.state.explorerURL === ""}
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
                    style={
                      this.state.explorerURL === ""
                        ? GlobalStyles.buttonStyleDisabled
                        : GlobalStyles.buttonStyle
                    }
                    onPress={() => this.setState(SwapSimpleBaseState)}
                    disabled={this.state.explorerURL === ""}
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
      </>
    );
  }
}

export default SwapSimple;
