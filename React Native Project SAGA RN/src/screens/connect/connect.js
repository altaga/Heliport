import { createTransfer, parseURL } from "@solana/pay";
import {
  Connection,
  LAMPORTS_PER_SOL,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import React, { Component } from "react";
import checkMark from "../../assets/checkMark.png";
import reactAutobind from "react-autobind";
import {
  Dimensions,
  Image,
  Pressable,
  Text,
  ToastAndroid,
  View,
  Modal,
  Linking,
} from "react-native";
import Renders from "../../assets/logo.png";
import GlobalStyles from "../../styles/styles";
import { EVMs, splTokens } from "../../utils/constants";
import ContextModule from "../../utils/contextModule";
import Cam from "./components/cam";
import CryptoSign from "./components/cryptoSign";
import CryptoSignETH from "./components/cryptoSignETH";
import { Core } from "@walletconnect/core";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import { formatJsonRpcResult } from "@json-rpc-tools/utils";
import { Web3Wallet } from "@walletconnect/web3wallet";
import { WC_ID } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { abiERC20 } from "../../contractsETH/erc20";
import { ethers, BigNumber } from "ethers";
import CryptoSignSeedVault from "./components/cryptoSignSeedVault";

const WCmethods = [
  "eth_sendTransaction",
  "eth_signTransaction",
  "eth_sign",
  "personal_sign",
  "eth_signTypedData",
];

const WCevents = ["accountsChanged", "chainChanged"];

const ConnectBaseState = {
  stage: 0, // 0
  reset: false,
  loading: false,
  status: "Processing...",
  explorerURL: "",
  transaction: {},
  transactionDisplay: {
    kind: "solanaPay",
    network: "Solana",
    name: "SOL",
    value: 0,
    gas: 0,
    gasName: "SOL",
    label: "",
    message: "",
    memo: "",
    icon: splTokens[0].icon,
    recipient: "",
  },
  // Wallet Connect
  session: {},
  sessionRequest: {},
  sessionRequestTransaction: {},
  network: {},
  metadata: {
    name: "Dapp Name",
    description: "Dapp Description",
    url: `http://dappurl.com/`,
    icons: ["https://i.ibb.co/m4RCzgF/logo-ETHcrop.png"],
  },
  // Signature
  modal: false, // false
};

class Connect extends Component {
  constructor(props) {
    super(props);
    this.state = ConnectBaseState;
    this.mount = true;
    this.core = new Core({
      projectId: WC_ID,
    });
    this.provider;
    this.ercEncoder = new ethers.utils.Interface(abiERC20);
    this.connector = null;
    this.connection = new Connection(
      clusterApiUrl("mainnet-beta"),
      "confirmed"
    );
    reactAutobind(this);
  }

  static contextType = ContextModule;

  componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);
      this.connector = null;
      this.mount = true;
      this.mount && this.setState(ConnectBaseState);
      await this.resetCam();
    });
    this.props.navigation.addListener("blur", async () => {
      this.mount && this.setState(ConnectBaseState);
      this.connector && (await this.disconnectSession());
      await this.clearAsyncStorageWC();
      await this.resetCam();
      delete this.connector
      this.mount = false;
    });
  }

  // Solana Pay

  async signSolana(e) {
    this.mount &&
      this.setState({
        status: "Processing...",
        stage: 6,
        explorerURL: "",
      });
    try {
      const txnSignature = await this.connection.sendRawTransaction(e, {
        maxRetries: 5,
      });
      this.mount &&
        this.setState({
          explorerURL: `https://solana.fm/tx/${txnSignature}?cluster=mainnet-solanafmbeta`,
          status: "Confirmed",
        });
    } catch {
      await this.cancelTransaction();
    }
  }

  async createSolanaPayTransfer(connection, pubkey, object) {
    return new Promise((resolve, reject) => {
      let result = {
        error: false,
        errorString: "",
        tx: null,
      };
      createTransfer(connection, pubkey, object)
        .then((tx) => {
          result.tx = tx;
          resolve(result);
        })
        .catch((error) => {
          result.error = true;
          result.errorString = error.toString();
          resolve(result);
        });
    });
  }

  async solanaPay(e) {
    const { recipient, amount, splToken, reference, label, message, memo } =
      parseURL(e);
    const res = await this.createSolanaPayTransfer(
      this.connection,
      this.context.value.publicKey,
      { recipient, amount, splToken, reference, memo }
    );
    if (res.errorString === "CreateTransferError: recipient not found") {
      ToastAndroid.show(
        capitalizeFirstLetter("Recipient not found"),
        ToastAndroid.LONG
      );
    } else if (res.errorString === "TokenAccountNotFoundError") {
      ToastAndroid.show(
        capitalizeFirstLetter("TokenAccount not found"),
        ToastAndroid.LONG
      );
    } else if (res.error) {
      ToastAndroid.show(
        capitalizeFirstLetter(res.errorString.split(": ")[1]),
        ToastAndroid.LONG
      );
    } else {
      let name = "SOL";
      let icon = splTokens[0].icon;
      if (splToken) {
        name = "TOKEN";
        splTokens.forEach((item) => {
          if (item.publicKey === splToken.toString()) {
            name = item.label;
            icon = item.icon;
          }
        });
      }
      const { tx } = res;
      const gasFee = await tx.getEstimatedFee(this.connection);
      this.mount &&
        this.setState({
          stage: 1,
          transaction: tx,
          transactionDisplay: {
            kind: "solanaPay",
            network: "Solana",
            name,
            value: amount,
            icon,
            gas: gasFee / LAMPORTS_PER_SOL,
            gasName: "SOL",
            label,
            message,
            memo,
            recipient: recipient.toString(),
          },
        });
    }
  }

  // WalletConnect

  async signEthereum(signedTx) {
    this.mount &&
      this.setState({
        status: "Processing...",
        stage: 6,
        explorerURL: "",
      });
    try {
      const { hash } = await this.provider.sendTransaction(signedTx);
      if (this.connector) {
        const { topic, id } = this.state.sessionRequestTransaction;
        const response = formatJsonRpcResult(id, hash);
        await this.connector.respondSessionRequest({
          topic,
          response,
        });
      }
      await this.provider.waitForTransaction(hash);
      this.mount &&
        this.setState({
          explorerURL: `${this.state.network.blockExplorer}tx/${hash}`,
          status: "Confirmed",
        });
    } catch (e) {
      console.log(e);
      this.cancelTransaction();
    }
  }

  async setupConnector(token) {
    this.connector = await Web3Wallet.init({
      core: this.core, // <- pass the shared `core` instance
      metadata: {
        name: "EffiSend Wallet EVM",
        description: "EffiSend Wallet EVM Superapp Connector",
        url: `http://effisend.com/`,
        icons: ["https://i.ibb.co/m4RCzgF/logo-ETHcrop.png"],
      },
    });
    this.connector.on("session_request", async (sessionRequest) => {
      await this.setStateAsync({
        sessionRequestTransaction: sessionRequest,
      });
      if (sessionRequest.params.request.method === "eth_sendTransaction") {
        const chainId = parseInt(sessionRequest.params.chainId.split(":")[1]);
        let network = false;
        EVMs.forEach((item) => {
          if (item.chainId === chainId) {
            network = item;
          }
        });
        if (network) {
          await this.setStateAsync({
            network,
          });
          this.prepareTransaction(sessionRequest.params.request.params[0]);
        }
      }
    });
    // Approval: Using this listener for sessionProposal, you can accept the session
    this.connector.on("session_proposal", async (sessionRequest) => {
      let { metadata } = sessionRequest.params.proposer;
      this.setState({
        metadata,
        sessionRequest,
        stage: 2,
      });
    });
    await this.connector.core.pairing.pair({ uri: token });
  }

  async prepareTransaction(tx) {
    try {
      let transaction = { ...tx };
      this.provider = new ethers.providers.JsonRpcProvider(
        this.state.network.rpc
      );
      let token;
      let decodedData;
      try {
        decodedData = this.ercEncoder.decodeFunctionData(
          "transfer",
          transaction.data
        );
        this.state.network.tokens.forEach((item) => {
          if (item.contract === transaction.to) {
            token = item;
          }
        });
      } catch (e) {
        console.log(e);
      }
      const gasPrice = await this.provider.getGasPrice();
      const balance = await this.provider.getBalance(
        this.context.value.ethPublicKey
      );
      const gasDisplay = await this.provider.estimateGas(transaction);
      const nonce = this.provider.getTransactionCount(
        this.context.value.ethPublicKey
      );
      let gas;
      try {
        gas = BigNumber.from(transaction?.gas) ?? gasDisplay;
        delete transaction.gas;
      } catch (e) {
        ToastAndroid.show(
          capitalizeFirstLetter("Token insufficient funds"),
          ToastAndroid.LONG
        );
        throw "Token insufficient funds";
      }
      const total = parseFloat(
        ethers.utils
          .formatEther(
            BigNumber.from(transaction?.value) ??
              BigNumber.from("0x0") + gas * gasPrice
          )
          .toString()
      );
      const tempBalance = parseFloat(
        ethers.utils.formatEther(balance).toString()
      );
      const gasTotal = epsilonRound(
        parseFloat(ethers.utils.formatEther(gas * gasPrice).toString()),
        6
      ).toString();
      if (total > tempBalance) {
        ToastAndroid.show(
          capitalizeFirstLetter("Insufficient Balance funds"),
          ToastAndroid.LONG
        );
        throw "Insufficient Balance funds";
      }
      // ERC20 transactions
      if (decodedData && token) {
        const contract = new ethers.Contract(
          transaction.to,
          abiERC20,
          this.provider
        );
        const amount = decodedData[1];
        const decimals = await contract.decimals();
        this.setState({
          modal: true,
          transaction: {
            ...transaction,
            gasLimit: gas,
            gasPrice,
            chainId: this.state.network.chainId,
            nonce,
          },
          transactionDisplay: {
            kind: "WalletConnect",
            network: this.state.network.network,
            name: token.symbol,
            value: epsilonRound(amount * Math.pow(10, -decimals), 6).toString(),
            icon: token.icon,
            gas: gasTotal,
            gasName: this.state.network.tokens[0].symbol,
            label: "",
            message: "",
            memo: "",
            recipient: transaction.to,
          },
        });
      }
      // Any Transaction
      else {
        const value = epsilonRound(
          transaction.value * Math.pow(10, -18),
          6
        ).toString();
        const icon = this.state.network.tokens[0].icon;
        this.setState({
          modal: true,
          transaction: {
            ...transaction,
            gasLimit: gas,
            gasPrice,
            chainId: this.state.network.chainId,
            nonce,
          },
          transactionDisplay: {
            kind: "WalletConnect",
            network: this.state.network.network,
            name: this.state.network.tokens[0].symbol,
            value,
            icon,
            gas: gasTotal,
            gasName: this.state.network.tokens[0].symbol,
            label: "",
            message: "",
            memo: "",
            recipient: transaction.to,
          },
        });
      }
    } catch (err) {
      this.cancelTransaction();
    }
  }

  async clearAsyncStorageWC() {
    await AsyncStorage.multiRemove([
      "wc@2:client:0.3//proposal",
      "wc@2:client:0.3//request",
      "wc@2:client:0.3//session",
      "wc@2:core:0.3//expirer",
      "wc@2:core:0.3//history",
      "wc@2:core:0.3//keychain",
      "wc@2:core:0.3//messages",
      "wc@2:core:0.3//pairing",
      "wc@2:core:0.3//subscription",
    ]);
  }

  // General

  async cancelTransactionWC() {
    const { id, topic } = this.state.sessionRequestTransaction;
    const response = {
      id,
      jsonrpc: "2.0",
      error: {
        code: 5000,
        message: "User rejected.",
      },
    };
    await this.connector.respondSessionRequest({
      topic,
      response,
    });
  }

  async cancelTransaction() {
    this.connector && (await this.cancelTransactionWC());
    this.connector && (await this.disconnectSession());
    this.mount && this.setState(ConnectBaseState);
    await this.clearAsyncStorageWC();
    await this.resetCam();
  }

  async disconnectSession() {
    const { topic } = this.state.session;
    await this.connector
      .disconnectSession({
        topic,
        reason: getSdkError("USER_DISCONNECTED"),
      })
      .catch((e) => console.log(e));
    this.mount && this.setState(ConnectBaseState);
    await this.clearAsyncStorageWC();
    await this.resetCam();
  }

  async rejectSession() {
    const { id } = this.state.sessionRequest;
    await this.connector.rejectSession({
      id,
      reason: getSdkError("USER_REJECTED_METHODS"),
    });
    this.mount && this.setState(ConnectBaseState);
    await this.clearAsyncStorageWC();
    await this.resetCam();
  }

  async approveRequest() {
    this.setState({
      loading: true,
    });
    const { id, params } = this.state.sessionRequest;
    const approvedNamespaces = buildApprovedNamespaces({
      proposal: params,
      supportedNamespaces: {
        eip155: {
          chains: EVMs.map((item) => `eip155:${item.chainId}`),
          methods: WCmethods,
          events: WCevents,
          accounts: EVMs.map(
            (item) =>
              `eip155:${item.chainId}:${this.context.value.ethPublicKey}`
          ),
        },
      },
    });
    const session = await this.connector.approveSession({
      id: id,
      namespaces: approvedNamespaces,
    });
    this.setState({
      session,
      stage: 3,
      loading: false,
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

  render() {
    const modalScale = 0.5;
    return (
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
              marginTop: Dimensions.get("window").height * (0.99 - modalScale),
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
              {`${this.state.transactionDisplay.value}`}{" "}
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
              {`${this.state.transactionDisplay.gas}`}{" "}
              {this.state.transactionDisplay.gasName}
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
                      if (this.state.transactionDisplay.kind === "solanaPay") {
                        this.mount &&
                          this.setState({
                            stage: 4,
                          });
                      } else {
                        this.mount &&
                          this.setState({
                            stage: 5,
                          });
                      }
                    }
                  )
                }
              >
                <Text style={[GlobalStyles.singleModalButtonText]}>Accept</Text>
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
                onPress={() => this.cancelTransaction()}
              >
                <Text style={[GlobalStyles.singleModalButtonText]}>Reject</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        {this.state.stage === 0 && (
          <View
            style={[
              GlobalStyles.mainComplete,
              { justifyContent: "space-evenly", alignItems: "center" },
            ]}
          >
            <View>
              <Text
                style={{
                  color: "white",
                  fontSize: 28,
                  textAlign: "center",
                  marginHorizontal: 20,
                }}
              >
                {"Scan WalletConnect \n or Solana Pay QR"}
              </Text>
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
                reset={this.state.reset}
                callbackSolanaPay={(e) => this.solanaPay(e)}
                callbackWC={(e) => this.setupConnector(e)}
              />
            </View>
          </View>
        )}
        {
          // Solana Pay
        }
        {this.state.stage === 1 && (
          <View
            style={[
              GlobalStyles.mainComplete,
              { justifyContent: "space-evenly", alignItems: "center" },
            ]}
          >
            <Text
              style={{
                fontSize: 20,
                textAlign: "center",
                color: "white",
              }}
            >
              You are sending
            </Text>
            <View
              style={[
                GlobalStyles.solanaPayRec,
                { width: Dimensions.get("screen").width * 0.9 },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-evenly",
                }}
              >
                <View style={{ marginHorizontal: 20 }}>
                  <Text style={{ fontSize: 20, color: "white" }}>Amount</Text>
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
                  {this.state.transactionDisplay.icon}
                </View>
                <Text style={{ fontSize: 20, color: "white" }}>
                  {`${this.state.transactionDisplay.value}`}{" "}
                  {this.state.transactionDisplay.name}
                </Text>
              </View>
            </View>
            <Text
              style={{
                fontSize: 20,
                textAlign: "center",
                color: "white",
              }}
            >
              to
            </Text>
            <View
              style={[
                GlobalStyles.solanaPayRec,
                { width: Dimensions.get("screen").width * 0.9 },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-evenly",
                }}
              >
                <View style={{ marginHorizontal: 20 }}>
                  <Text style={{ fontSize: 20, color: "white" }}>Address</Text>
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
                <Text
                  style={{ fontSize: 16, color: "white", textAlign: "center" }}
                >
                  {this.state.transactionDisplay.recipient.substring(0, 22)}
                  {"\n"}
                  {this.state.transactionDisplay.recipient.substring(22)}
                </Text>
              </View>
            </View>
            <Text
              style={{
                fontSize: 20,
                textAlign: "center",
                color: "white",
              }}
            >
              Fee
            </Text>
            <View
              style={[
                GlobalStyles.solanaPayRec,
                { width: Dimensions.get("screen").width * 0.9 },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-evenly",
                }}
              >
                <View style={{ marginHorizontal: 20 }}>
                  <Text style={{ fontSize: 20, color: "white" }}>Gas fees</Text>
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
                  {splTokens[0].icon}
                </View>
                <Text style={{ fontSize: 20, color: "white" }}>
                  {`${this.state.transactionDisplay.gas}`} SOL
                </Text>
              </View>
            </View>
            {this.state.transactionDisplay.label && (
              <>
                <Text
                  style={{
                    fontSize: 20,
                    textAlign: "center",
                    color: "white",
                  }}
                >
                  Label
                </Text>
                <View
                  style={[
                    GlobalStyles.solanaPayRec,
                    {
                      width: Dimensions.get("screen").width * 0.9,
                      justifyContent: "center",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "white",
                      textAlign: "center",
                    }}
                  >
                    {this.state.transactionDisplay.label}
                  </Text>
                </View>
              </>
            )}
            {this.state.transactionDisplay.message && (
              <>
                <Text
                  style={{
                    fontSize: 20,
                    textAlign: "center",
                    color: "white",
                  }}
                >
                  Message
                </Text>
                <View
                  style={[
                    GlobalStyles.solanaPayRec,
                    {
                      width: Dimensions.get("screen").width * 0.9,
                      justifyContent: "center",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "white",
                      textAlign: "center",
                    }}
                  >
                    {this.state.transactionDisplay.message}
                  </Text>
                </View>
              </>
            )}
            <View>
              <Pressable
                disabled={this.state.loading}
                style={
                  this.state.loading
                    ? [GlobalStyles.buttonStyleDisabled, { marginVertical: 0 }]
                    : [GlobalStyles.buttonStyle, { marginVertical: 0 }]
                }
                onPress={() =>
                  this.setState({
                    modal: true,
                    loading: true,
                  })
                }
              >
                <Text
                  style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
                >
                  {this.state.loading ? "Paying..." : "Pay"}
                </Text>
              </Pressable>
              <Pressable
                disabled={this.state.loading}
                style={
                  this.state.loading
                    ? [
                        GlobalStyles.buttonStyleDisabled,
                        { marginVertical: 0, marginTop: "3%" },
                      ]
                    : [
                        GlobalStyles.buttonStyle,
                        { marginVertical: 0, marginTop: "3%" },
                      ]
                }
                onPress={() => this.cancelTransaction()}
              >
                <Text
                  style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
                >
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        {
          // Wallet Connect
        }
        {this.state.stage === 2 && (
          <View
            style={[
              GlobalStyles.mainComplete,
              { justifyContent: "space-evenly", alignItems: "center" },
            ]}
          >
            <View>
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 30,
                  marginHorizontal: 10,
                }}
              >
                Connect to Dapp
              </Text>
            </View>
            <View
              style={{
                borderWidth: 10,
                borderColor: "#00e599",
                borderRadius: 500,
              }}
            >
              <Image
                resizeMode="contain"
                style={{
                  width: Dimensions.get("window").width * 0.6,
                  height: Dimensions.get("window").width * 0.6,
                  borderRadius: 500,
                }}
                alt="Cat"
                source={{
                  uri: this.state.metadata.icons[0],
                }}
              />
            </View>
            <Text
              style={{
                textAlign: "center",
                color: "white",
                fontSize: 30,
                marginHorizontal: 20,
              }}
            >
              {this.state.metadata.name}
            </Text>
            <Text
              style={{
                textAlign: "center",
                color: "white",
                fontSize: 24,
                marginHorizontal: 20,
              }}
            >
              {this.state.metadata.description}
            </Text>
            <View>
              <Pressable
                disabled={this.state.loading}
                style={
                  this.state.loading
                    ? [GlobalStyles.buttonStyleDisabled]
                    : [GlobalStyles.buttonStyle]
                }
                onPress={async () => {
                  await this.approveRequest();
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 24,
                    fontWeight: "bold",
                  }}
                >
                  Accept
                </Text>
              </Pressable>
              <Pressable
                disabled={this.state.loading}
                style={
                  this.state.loading
                    ? [GlobalStyles.buttonStyleDisabled, { marginVertical: 0 }]
                    : [GlobalStyles.buttonStyle, { marginVertical: 0 }]
                }
                onPress={async () => {
                  await this.rejectSession();
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 24,
                    fontWeight: "bold",
                  }}
                >
                  Reject
                </Text>
              </Pressable>
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
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 30,
                  marginHorizontal: 10,
                }}
              >
                Connected to Dapp
              </Text>
            </View>
            <View
              style={{
                borderWidth: 10,
                borderColor: "#00e599",
                borderRadius: 500,
              }}
            >
              <Image
                resizeMode="contain"
                style={{
                  width: Dimensions.get("window").width * 0.6,
                  height: Dimensions.get("window").width * 0.6,
                  borderRadius: 500,
                }}
                alt="Cat"
                source={{
                  uri: this.state.metadata.icons[0],
                }}
              />
            </View>
            <Text
              style={{
                textAlign: "center",
                color: "white",
                fontSize: 30,
                marginHorizontal: 20,
              }}
            >
              {this.state.metadata.name}
            </Text>
            <Pressable
              disabled={this.state.loading}
              style={
                this.state.loading
                  ? [GlobalStyles.buttonStyleDisabled]
                  : [GlobalStyles.buttonStyle]
              }
              onPress={async () => {
                this.disconnectSession()
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 24,
                  fontWeight: "bold",
                }}
              >
                Disconnect
              </Text>
            </Pressable>
          </View>
        )}
        {
          // Signature
        }
        {this.state.stage === 4 && (
          <View style={GlobalStyles.mainComplete}>
            {this.context.value.kind === 0 ? (
                <CryptoSign
                  transaction={this.state.transaction}
                  cancelTrans={() => this.cancelTransaction()}
                  signSolana={(e) => this.signSolana(e)}
                />
              ) : (
                <CryptoSignSeedVault
                  transaction={this.state.transaction}
                  cancelTrans={() => this.cancelTransaction()}
                  signSolana={(e) => this.signSolana(e)}
                />
              )}
          </View>
        )}
        {this.state.stage === 5 && (
          <View style={GlobalStyles.mainComplete}>
            <CryptoSignETH
              transaction={this.state.transaction}
              cancelTrans={() => this.cancelTransaction()}
              signEthereum={(e) => this.signEthereum(e)}
            />
          </View>
        )}
        {
          // Last Screen
        }
        {this.state.stage === 6 && (
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
                  <View>
                    <Text style={{ fontSize: 20, color: "white" }}>
                      {this.state.transactionDisplay.network}
                    </Text>
                    <Text style={{ fontSize: 14, color: "white" }}>
                      {this.state.transactionDisplay.kind}
                    </Text>
                  </View>
                </View>
                <View>{this.state.transactionDisplay.icon}</View>
                <Text>
                  {`${this.state.transactionDisplay.value}`}{" "}
                  {this.state.transactionDisplay.name}
                </Text>
              </View>
              <View>
                <Pressable
                  style={[
                    this.state.explorerURL === ""
                      ? GlobalStyles.buttonStyleDisabled
                      : GlobalStyles.buttonStyle,
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
                  onPress={() => this.props.navigation.navigate("Main")}
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
    );
  }
}

export default Connect;
