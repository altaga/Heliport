import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AccountLayout,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import { BigNumber, ethers } from "ethers";
import React, { Component } from "react";
import reactAutobind from "react-autobind";
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "react-native-form-component";
import IconIonIcons from "react-native-vector-icons/Ionicons";
import IconFeatherIcons from "react-native-vector-icons/Feather";
import checkMark from "../../assets/checkMark.png";
import Renders from "../../assets/logo.png";
import { abiERC20 } from "../../contractsETH/erc20";
import GlobalStyles from "../../styles/styles";
import { EVMs, Solana } from "../../utils/constants";
import ContextModule from "../../utils/contextModule";
import Cam from "./components/cam";
import CryptoSign from "./components/cryptoSign";
import CryptoSignETH from "./components/cryptoSignETH";
import KeyboardAwareScrollViewComponent from "./components/keyboardAvoid";
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

const SendNetworks = [Solana].concat(EVMs).map((item) => {
  return {
    ...item,
    value: item.rpc,
    label: item.network,
  };
});

const SendBaseState = {
  crosschain: false,
  address: "", // ""
  amount: "", // ""
  networks: SendNetworks,
  networkSelected: SendNetworks[0],
  tokenSelected: setTokens(SendNetworks[0].tokens)[0],
  transaction: {},
  transactionDisplay: {
    kind: "solana_signTransaction",
    name: setTokens(SendNetworks[0].tokens)[0].symbol,
    decimals: setTokens(SendNetworks[0].tokens)[0].decimals,
    amount: 0,
    gas: 0,
  },
  stage: 0,
  hash: "", // ""
  check: "Check",
  modal: false,
  explorerURL: "",
  status: "Processing...",
  errorText: "",
  maxSelected: false,
  maxLoading: false,
};

class Send extends Component {
  constructor(props) {
    super(props);
    this.state = SendBaseState;
    reactAutobind(this);
    this.mount = true;
    this.connection = new Connection(
      clusterApiUrl("mainnet-beta"),
      "confirmed"
    );
    this.provider;
  }

  static contextType = ContextModule;

  componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);
      this.mount = true;
      this.mount && this.setState(SendBaseState);
    });
    this.props.navigation.addListener("blur", async () => {
      this.mount && this.setState(SendBaseState);
      this.mount = false;
    });
  }

  componentWillUnmount() {}

  async setStateAsync(value) {
    return new Promise((resolve) => {
      this.setState(
        {
          ...value,
        },
        () => resolve()
      );
    });
  }

  async signSolana(e) {
    this.mount &&
      this.setState({
        status: "Processing...",
        stage: 3,
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
      this.mount &&
        this.setState({
          stage: 0,
          explorerURL: "",
          transaction: {},
          check: "Check",
          loading: false,
          modal: false,
          status: "Processing...",
          errorText: "",
        });
    }
  }

  async signEthereum(signedTx) {
    this.mount &&
      this.setState({
        status: "Processing...",
        stage: 3,
        explorerURL: "",
      });
    try {
      const { hash } = await this.provider.sendTransaction(signedTx);
      await this.provider.waitForTransaction(hash);
      this.mount &&
        this.setState({
          explorerURL: `${this.state.networkSelected.blockExplorer}tx/${hash}`,
          status: "Confirmed",
        });
    } catch (e) {
      console.log(e);
      this.mount &&
        this.setState({
          stage: 0,
          explorerURL: "",
          transaction: {},
          check: "Check",
          loading: false,
          modal: false,
          status: "Processing...",
          errorText: "",
        });
    }
  }

  async solanaTransfer() {
    let errorText = "";
    try {
      this.mount &&
        this.setState({
          loading: true,
          check: "Checking...",
        });
      const destinationAddress = new PublicKey(this.state.address);
      let amount = Math.round(LAMPORTS_PER_SOL * parseFloat(this.state.amount));
      const balance = await this.connection.getBalance(
        this.context.value.publicKey
      );
      const balance2 = await this.connection.getBalance(destinationAddress);
      const minBalance =
        await this.connection.getMinimumBalanceForRentExemption(0);
      if (balance2 < minBalance && amount < minBalance) {
        amount = minBalance;
      }
      // Transaction MessageV0
      const instructions = [
        SystemProgram.transfer({
          fromPubkey: this.context.value.publicKey,
          toPubkey: new PublicKey(this.state.address),
          lamports: amount,
        }),
      ];
      const recentBlockhash = (await this.connection.getLatestBlockhash())
        .blockhash;
      // Transaction Legacy
      let transaction = new Transaction().add(instructions[0]);
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = this.context.value.publicKey;
      const gasFee = await transaction.getEstimatedFee(this.connection);
      const check = balance - (gasFee + amount) >= minBalance;
      if (!check) {
        errorText = `Not enough to keep the minimum balance, you need ${
          Math.abs(minBalance - (balance - (gasFee + amount))) /
          LAMPORTS_PER_SOL
        } SOL to complete transaction`;
      }
      const check2 = balance >= gasFee + amount;
      if (!check2) {
        errorText = `Not enough balance, you need ${Math.abs(
          Math.abs(balance - (gasFee + amount)) / LAMPORTS_PER_SOL
        )} SOL to complete transaction`;
      }
      this.mount &&
        this.setState({
          transactionDisplay: {
            kind: "solana_signTransaction",
            name: setTokens(SendNetworks[0].tokens)[0].symbol,
            decimals: setTokens(SendNetworks[0].tokens)[0].decimals,
            amount: amount / LAMPORTS_PER_SOL,
            gas: gasFee / LAMPORTS_PER_SOL,
          },
          amount: (amount / LAMPORTS_PER_SOL).toString(),
          transaction,
          check: check && check2 ? "Check" : "Check Again",
          loading: false,
          modal: check && check2,
          errorText,
        });
    } catch (err) {
      console.log(err);
      this.setState({
        stage: 0,
        explorerURL: "",
        transaction: {},
        check: "Check Again",
        loading: false,
        modal: false,
        status: "Processing...",
        errorText,
        maxSelected: false,
      });
    }
  }

  async solanaTokenTransfer() {
    let errorText = "";
    try {
      this.mount &&
        this.setState({
          loading: true,
          check: "Checking...",
        });
      const BigInt = require("big-integer");
      const mintAddress = new PublicKey(this.state.tokenSelected.contract);
      const destinationAddress = new PublicKey(this.state.address);
      const info = await this.connection.getParsedAccountInfo(mintAddress);
      const decimals = info.value.data.parsed.info.decimals;
      const amount = BigInt(
        parseFloat(this.state.amount) * Math.pow(10, decimals)
      );
      // From address Data
      const balance = BigInt(
        await this.connection.getBalance(this.context.value.publicKey)
      );
      const tokenAccount = await this.connection.getTokenAccountsByOwner(
        this.context.value.publicKey,
        { mint: mintAddress },
        "finalized"
      );
      const minBalance =
        await this.connection.getMinimumBalanceForRentExemption(0);
      //const rentExcept = await this.connection.getMinimumBalanceForRentExemption(165);
      let tokenBalance = 0;
      try {
        tokenBalance = BigInt(
          parseInt(
            AccountLayout.decode(tokenAccount.value[0].account.data).amount
          )
        );
      } catch (error) {
        errorText = `Not enough token balance, you need ${
          Math.abs(amount - tokenBalance) / Math.pow(10, decimals)
        } ${this.state.tokenSelected.symbol} to complete transaction`;
      }
      // To Address
      const tokenAccount2 = await getAssociatedTokenAddress(
        mintAddress,
        destinationAddress,
        (allowOwnerOffCurve = false),
        (programId = TOKEN_PROGRAM_ID),
        (associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID)
      );
      let isTokenAccountAlreadyMade = false;
      try {
        await getAccount(
          this.connection,
          tokenAccount2,
          "confirmed",
          TOKEN_PROGRAM_ID
        );
        isTokenAccountAlreadyMade = true;
      } catch {
        // Nothing
      }
      const recentBlockhash = (await this.connection.getLatestBlockhash())
        .blockhash;
      // Legacy for Gas
      let transaction = new Transaction();
      if (!isTokenAccountAlreadyMade) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.context.value.publicKey,
            tokenAccount2,
            destinationAddress,
            mintAddress,
            TOKEN_PROGRAM_ID
          )
        );
      }
      transaction.add(
        createTransferInstruction(
          tokenAccount.value[0].pubkey,
          tokenAccount2,
          this.context.value.publicKey,
          amount
        )
      );
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = this.context.value.publicKey;
      // next
      const gasFee =
        BigInt(await transaction.getEstimatedFee(this.connection));
      const check = balance + gasFee > minBalance;
      if (!check) {
        errorText = `Not enough to keep the minimum balance, you need ${
          Math.abs(minBalance - (balance - (gasFee + amount))) /
          LAMPORTS_PER_SOL
        } SOL to complete transaction`;
      }
      const check2 = tokenBalance >= amount;
      if (!check2) {
        errorText = `Not enough token balance, you need ${
          Math.abs(amount - tokenBalance) / Math.pow(10, decimals)
        } ${this.state.tokenSelected.symbol} to complete transaction`;
      }
      const check3 = balance >= gasFee;
      if (!check3) {
        errorText = `Not enough balance, you need ${Math.abs(
          Math.abs(balance - gasFee) / LAMPORTS_PER_SOL
        )} SOL to complete transaction`;
      }
      this.mount &&
        this.setState({
          transactionDisplay: {
            kind: "solana_signTransaction",
            name: this.state.tokenSelected.symbol,
            decimals,
            amount: parseFloat(this.state.amount),
            gas: gasFee / LAMPORTS_PER_SOL,
          },
          transaction,
          check: check && check2 && check3 ? "Check" : "Check Again",
          loading: false,
          modal: check && check2 && check3,
          errorText,
        });
    } catch (err) {
      console.log(err)
      this.setState({
        stage: 0,
        explorerURL: "",
        transaction: {},
        check: "Check Again",
        loading: false,
        modal: false,
        status: "Processing...",
        errorText,
        maxSelected: false,
      });
    }
  }

  async ethTransfer() {
    let errorText = "";
    try {
      let { rpc, chainId } = this.state.networkSelected;
      this.mount &&
        this.setState({
          loading: true,
          check: "Checking...",
        });
      this.provider = new ethers.providers.JsonRpcProvider(rpc);
      const balance = await this.provider.getBalance(
        this.context.value.ethPublicKey
      );
      const gasPrice = await this.provider.getGasPrice();
      const nonce = await this.provider.getTransactionCount(
        this.context.value.ethPublicKey
      );
      let transaction = {
        chainId,
        to: this.state.address,
        value: ethers.utils.parseUnits(this.state.amount, "ether"),
        gasPrice,
        nonce,
      };
      const gas = await this.provider.estimateGas(transaction);
      let value;
      if (this.state.maxSelected) {
        value = ethers.utils
          .parseEther(this.state.amount)
          .sub(gas.mul(gasPrice));
        transaction = {
          ...transaction,
          gasLimit: gas,
          value,
        };
      } else {
        value = ethers.utils.parseEther(this.state.amount);
        transaction = {
          ...transaction,
          gasLimit: gas,
        };
      }
      const check = balance.gte(value.add(gas.mul(gasPrice)));
      if (!check) {
        errorText = `Not enough balance, you need ${ethers.utils.formatEther(
          value.add(gas.mul(gasPrice)).sub(balance).abs()
        )} ${this.state.tokenSelected.symbol} to complete transaction`;
        throw "Not enough balance";
      }
      const displayAmount = ethers.utils.formatEther(value);
      const displayGas = ethers.utils.formatEther(gas.mul(gasPrice));
      this.mount &&
        this.setState({
          transactionDisplay: {
            kind: "eth_signTransaction",
            name: this.state.tokenSelected.symbol,
            decimals: 18,
            amount: epsilonRound(displayAmount, 8),
            gas: epsilonRound(displayGas, 8),
          },
          transaction,
          check: check ? "Check" : "Check Again",
          loading: false,
          modal: check,
          errorText,
        });
    } catch (err) {
      console.log(err);
      this.setState({
        stage: 0,
        explorerURL: "",
        transaction: {},
        check: "Check",
        loading: false,
        modal: false,
        status: "Processing...",
        errorText,
        maxSelected: false,
      });
    }
  }

  async ethTokenTransfer() {
    let errorText = "";
    try {
      let { rpc, chainId } = this.state.networkSelected;
      this.mount &&
        this.setState({
          loading: true,
          check: "Checking...",
        });
      this.provider = new ethers.providers.JsonRpcProvider(rpc);
      const tokenContract = new ethers.Contract(
        this.state.tokenSelected.contract,
        abiERC20,
        this.provider
      );
      let encoder = new ethers.utils.Interface(abiERC20);
      const balance = await this.provider.getBalance(
        this.context.value.ethPublicKey
      );
      const tokenBalance = await tokenContract.balanceOf(
        this.context.value.ethPublicKey
      );
      const tokenDecimals = await tokenContract.decimals();
      const amount = BigInt(
        parseFloat(this.state.amount) * Math.pow(10, tokenDecimals)
      );
      const gasPrice = await this.provider.getGasPrice();
      const nonce = this.provider.getTransactionCount(
        this.context.value.ethPublicKey
      );
      let transaction = {
        chainId,
        from: this.context.value.ethPublicKey,
        to: this.state.tokenSelected.contract,
        data: encoder.encodeFunctionData("transfer", [
          this.state.address,
          amount,
        ]),
        gasPrice,
        nonce,
      };
      let gas = 0;
      let check2 = false;
      try {
        gas = await this.provider.estimateGas(transaction);
        transaction = {
          ...transaction,
          gasLimit: gas,
        };
        check2 = true;
      } catch (e) {
        errorText = `Not enough token balance, you need ${Math.abs(
          parseFloat(this.state.amount) -
            tokenBalance * Math.pow(10, -tokenDecimals)
        )} ${this.state.tokenSelected.symbol} to complete transaction`;
      }
      const checkGas = parseFloat(ethers.utils.formatEther(gas * gasPrice));
      const checkBalance = parseFloat(ethers.utils.formatEther(balance));
      const check = checkBalance >= checkGas;
      if (!check) {
        errorText = `Not enough balance, you need ${Math.abs(
          checkGas - checkBalance
        )} ${this.state.networkSelected.token} to complete transaction`;
      }
      this.mount &&
        this.setState({
          transactionDisplay: {
            kind: "eth_signTransaction",
            name: this.state.tokenSelected.symbol,
            decimals: 18,
            amount: parseFloat(this.state.amount),
            gas: epsilonRound(
              parseFloat(ethers.utils.formatEther(gas * gasPrice).toString()),
              8
            ),
          },
          transaction,
          check: check && check2 ? "Check" : "Check Again",
          loading: false,
          modal: check && check2,
          errorText,
        });
    } catch (err) {
      console.log(err);
      this.setState({
        stage: 0,
        explorerURL: "",
        transaction: {},
        check: "Check Again",
        loading: false,
        modal: false,
        status: "Processing...",
        errorText,
      });
    }
  }

  async solanaMaxTransfer() {
    this.setState({
      maxLoading: true,
    });
    try {
      const balance = await this.connection.getBalance(
        this.context.value.publicKey
      );
      const minBalance =
        await this.connection.getMinimumBalanceForRentExemption(0);
      const instructions = [
        SystemProgram.transfer({
          fromPubkey: this.context.value.publicKey,
          toPubkey: new PublicKey(
            "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
          ), // Test Account for Gas Calculation
          lamports: "0",
        }),
      ];
      const recentBlockhash = (await this.connection.getLatestBlockhash())
        .blockhash;
      let transaction = new Transaction().add(instructions[0]);
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = this.context.value.publicKey;
      const gasFee = await transaction.getEstimatedFee(this.connection);
      let checkTotal = (balance - minBalance - gasFee) / LAMPORTS_PER_SOL;
      if (checkTotal < 0) {
        checkTotal = 0.0;
      }
      this.mount &&
        this.setState({
          maxSelected: true,
          maxLoading: false,
          amount: checkTotal.toString(),
        });
    } catch (err) {
      this.setState({
        maxLoading: false,
        amount: "0",
      });
    }
  }

  async solanaMaxTokenTransfer() {
    this.setState({
      maxLoading: true,
    });
    try {
      const mintAddress = new PublicKey(this.state.tokenSelected.contract);
      const info = await this.connection.getParsedAccountInfo(mintAddress);
      const decimals = info.value.data.parsed.info.decimals;
      const tokenAccount = await this.connection.getTokenAccountsByOwner(
        this.context.value.publicKey,
        { mint: mintAddress },
        "finalized"
      );
      const tokenBalance = BigNumber.from(
        AccountLayout.decode(tokenAccount.value[0].account.data).amount
      );
      const amount = epsilonRound(
        tokenBalance * Math.pow(10, -decimals),
        decimals
      );
      this.mount &&
        this.setState({
          maxSelected: true,
          maxLoading: false,
          amount: amount.toString(),
        });
    } catch (err) {
      this.setState({
        maxLoading: false,
        amount: "0",
      });
    }
  }

  async ethMaxTransfer() {
    this.setState({
      maxLoading: true,
    });
    try {
      let { rpc, chainId } = this.state.networkSelected;
      this.provider = new ethers.providers.JsonRpcProvider(rpc);
      const balance = await this.provider.getBalance(
        this.context.value.ethPublicKey
      );
      const gasPrice = await this.provider.getGasPrice();
      const nonce = this.provider.getTransactionCount(
        this.context.value.ethPublicKey
      );
      let transaction = {
        chainId,
        to: "0x0000000000000000000000000000000000000000", // Test Account to Gas Calculation
        value: "0x0",
        gasPrice,
        nonce,
      };
      const gas = await this.provider.estimateGas(transaction);
      transaction = {
        ...transaction,
        gasLimit: gas,
      };
      const checkGas = parseFloat(ethers.utils.formatEther(gas * gasPrice));
      const checkBalance = parseFloat(ethers.utils.formatEther(balance));
      let checkTotal = checkBalance - checkGas;
      if (checkTotal < 0) {
        checkTotal = 0.0;
      }
      this.mount &&
        this.setState({
          maxSelected: true,
          maxLoading: false,
          amount: checkTotal.toString(),
        });
    } catch (err) {
      console.log(err);
      this.setState({
        maxLoading: false,
        amount: "0",
      });
    }
  }

  async ethMaxTokenTransfer() {
    this.setState({
      maxLoading: true,
    });
    try {
      let { rpc } = this.state.networkSelected;
      this.provider = new ethers.providers.JsonRpcProvider(rpc);
      const tokenContract = new ethers.Contract(
        this.state.tokenSelected.contract,
        abiERC20,
        this.provider
      );
      const tokenBalance = await tokenContract.balanceOf(
        this.context.value.ethPublicKey
      );
      const tokenDecimals = await tokenContract.decimals();
      const amount = tokenBalance * Math.pow(10, -tokenDecimals);
      this.mount &&
        this.setState({
          maxSelected: true,
          maxLoading: false,
          amount: amount.toString(),
        });
    } catch (err) {
      console.log(err);
      this.setState({
        maxLoading: false,
        amount: "0",
      });
    }
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
                {this.state.transactionDisplay.gas}{" "}
                {this.state.networkSelected.token}
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
                        if (this.state.networkSelected.network === "Solana") {
                          this.mount &&
                            this.setState({
                              stage: 1,
                            });
                        } else {
                          this.mount &&
                            this.setState({
                              stage: 2,
                            });
                        }
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
                          this.mount && this.setState({ stage: 4 })
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
                      items={this.state.networks}
                      selectedValue={this.state.networkSelected.value}
                      label=" Network"
                      onSelection={(item) => {
                        this.mount &&
                          this.setState({
                            networkSelected: item,
                            tokenSelected: setTokens(item.tokens)[0],
                          });
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
                      items={setTokens(this.state.networkSelected.tokens)}
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
                          if (this.state.networkSelected.network === "Solana") {
                            if (this.state.tokenSelected.symbol === "SOL") {
                              console.log("Sol Transfer");
                              this.solanaMaxTransfer();
                            } else {
                              console.log("Sol Token Transfer");
                              this.solanaMaxTokenTransfer();
                            }
                          } else {
                            if (
                              this.state.tokenSelected.symbol ===
                              this.state.networkSelected.token
                            ) {
                              console.log("EVM Transfer");
                              this.ethMaxTransfer();
                            } else {
                              console.log("EVM Token Transfer");
                              this.ethMaxTokenTransfer();
                            }
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
                    {/*
<View
                      style={{
                        width: Dimensions.get("screen").width,
                        flexDirection: "row",
                        justifyContent: "space-around",
                        alignItems: "center",
                        marginTop: 20,
                      }}
                    >
                      <View style={{ width: "80%" }}>
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "bold",
                            color: "white",
                            textAlign: "center",
                          }}
                        >
                          EVMs Crosschain
                        </Text>
                      </View>
                      <View style={{ width: "20%" }}>
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "bold",
                            color: "white",
                            textAlign: "center",
                          }}
                        >
                          <Switch
                            onChange={() => {
                              let network;
                              let tokens;
                              if (!this.state.crosschain) {
                                networks = EVMs.map((item) => {
                                  return {
                                    ...item,
                                    value: item.rpc,
                                    label: item.network,
                                    tokens: item.tokens.slice(1).map((item) => {
                                      return {
                                        ...item,
                                        value: item.contract,
                                        label: item.symbol,
                                      };
                                    }),
                                  };
                                });
                                console.log(networks)
                                this.setState({
                                  crosschain: !this.state.crosschain,
                                  networks,
                                  networkSelected: networks[0],
                                  tokenSelected: networks[0].tokens[0],
                                });
                              } else {
                                this.setState({
                                  crosschain: !this.state.crosschain,
                                  networks: [Solana].concat(EVMs).map((item) => {
                                    return {
                                      ...item,
                                      value: item.rpc,
                                      label: item.network,
                                    };
                                  }),
                                  networkSelected: {
                                    ...Solana,
                                    value: Solana.rpc,
                                    label: Solana.network,
                                  },
                                  tokenSelected: Solana.tokens.map((item) => {
                                    return {
                                      ...item,
                                      value: item.contract,
                                      label: item.symbol,
                                    };
                                  })[0],
                                });
                              }
                            }}
                            value={this.state.crosschain}
                            thumbColor={
                              this.state.crosschain ? "#00ffa9" : "#008055"
                            }
                            trackColor={"#00e59955"}
                          />
                        </Text>
                      </View>
                    </View>
                      */}
                  </View>
                  {this.state.check === "Check Again" && (
                    <Text
                      style={{
                        fontSize: 20,
                        color: "#F00",
                        fontWeight: "bold",
                        textAlign: "center",
                        paddingHorizontal: 20,
                      }}
                    >
                      {this.state.errorText}
                    </Text>
                  )}
                  <Pressable
                    disabled={this.state.loading}
                    style={
                      this.state.loading
                        ? GlobalStyles.buttonStyleDisabled
                        : GlobalStyles.buttonStyle
                    }
                    onPress={() => {
                      if (this.state.networkSelected.network === "Solana") {
                        if (this.state.tokenSelected.symbol === "SOL") {
                          console.log("Sol Transfer");
                          this.solanaTransfer();
                        } else {
                          console.log("Sol Token Transfer");
                          this.solanaTokenTransfer();
                        }
                      } else {
                        if (
                          this.state.tokenSelected.symbol ===
                          this.state.networkSelected.token
                        ) {
                          console.log("EVM Transfer");
                          this.ethTransfer();
                        } else {
                          console.log("EVM Token Transfer");
                          this.ethTokenTransfer();
                        }
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
                    this.mount &&
                    this.setState({
                      stage: 0,
                      explorerURL: "",
                      transaction: {},
                      check: "Check",
                      loading: false,
                      modal: false,
                      status: "Processing...",
                      errorText: "",
                    })
                  }
                  signSolana={(e) => this.signSolana(e)}
                />
              ) : (
                <CryptoSignSeedVault
                  transaction={this.state.transaction}
                  cancelTrans={() =>
                    this.mount &&
                    this.setState({
                      stage: 0,
                      explorerURL: "",
                      transaction: {},
                      check: "Check",
                      loading: false,
                      modal: false,
                      status: "Processing...",
                      errorText: "",
                    })
                  }
                  signSolana={(e) => this.signSolana(e)}
                />
              )}
            </View>
          )}
          {this.state.stage === 2 && (
            <View style={GlobalStyles.mainComplete}>
              <CryptoSignETH
                transaction={this.state.transaction}
                cancelTrans={(e) =>
                  this.mount &&
                  this.setState({
                    stage: 0,
                    explorerURL: "",
                    transaction: {},
                    check: "Check",
                    loading: false,
                    modal: false,
                    status: "Processing...",
                    errorText: "",
                  })
                }
                signEthereum={(e) => this.signEthereum(e)}
              />
            </View>
          )}
          {this.state.stage === 3 && (
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
                        {this.state.networkSelected.network}
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
                    onPress={() => this.setState(SendBaseState)}
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
          {this.state.stage === 4 && (
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
                  callbackAddressETH={(e) => {
                    this.mount &&
                      this.setState({
                        address: e,
                        stage: 0,
                        networks: SendNetworks,
                        networkSelected: SendNetworks[1],
                        tokenSelected: setTokens(SendNetworks[1].tokens)[0],
                        transaction: {},
                        transactionDisplay: {
                          kind: "eth_signTransaction",
                          name: setTokens(SendNetworks[1].tokens)[0].symbol,
                          decimals: setTokens(SendNetworks[1].tokens)[0]
                            .decimals,
                          amount: 0,
                          gas: 0,
                        },
                      });
                  }}
                  callbackAddress={(e) => {
                    this.mount &&
                      this.setState({
                        address: e,
                        stage: 0,
                        networks: SendNetworks,
                        networkSelected: SendNetworks[0],
                        tokenSelected: setTokens(SendNetworks[0].tokens)[0],
                        transaction: {},
                        transactionDisplay: {
                          kind: "eth_signTransaction",
                          name: setTokens(SendNetworks[0].tokens)[0].symbol,
                          decimals: setTokens(SendNetworks[0].tokens)[0]
                            .decimals,
                          amount: 0,
                          gas: 0,
                        },
                      });
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </>
    );
  }
}

export default Send;
