import { Connection, clusterApiUrl } from "@solana/web3.js";
import SwapRouterABIV2 from "@uniswap/swap-router-contracts/artifacts/contracts/SwapRouter02.sol/SwapRouter02.json";
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import IUniswapV3Factory from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json";
import QuoterV2 from "@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json";
import { FeeAmount, computePoolAddress } from "@uniswap/v3-sdk";
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
  ToastAndroid,
  View,
} from "react-native";
import { Picker } from "react-native-form-component";
import checkMark from "../../assets/checkMark.png";
import Renders from "../../assets/logo.png";
import { abiERC20 } from "../../contractsETH/erc20";
import { abiWERC20 } from "../../contractsETH/werc20";
import GlobalStyles from "../../styles/styles";
import { EVMs } from "../../utils/constants";
import ContextModule from "../../utils/contextModule";
import CryptoSignETH from "./components/cryptoSignETH";
import KeyboardAwareScrollViewComponent from "./components/keyboardAvoid";
import IconMCU from "react-native-vector-icons/MaterialCommunityIcons";

function setTokens(array) {
  return array.map((item) => {
    return {
      ...item,
      value: item.contract,
      label: item.symbol,
    };
  });
}

const SendNetworks = [...EVMs].splice(0, 5).map((item) => {
  return {
    ...item,
    value: item.rpc,
    label: item.network,
  };
});

const SwapETHSimpleBaseState = {
  stage: 0,
  amount: "0",
  amountOut: "0",
  network: SendNetworks[0],
  tokenFrom: setTokens(SendNetworks[0].tokens)[0],
  tokenTo: setTokens(SendNetworks[0].tokens)[1],
  data: {},
  transaction: {},
  transactionDisplay: {
    kind: "eth_signTransaction",
    name: setTokens(SendNetworks[0].tokens)[0].symbol,
    value: 0,
    gas: 0,
  },
  explorerURL: "",
  check: "Check",
  loading: false,
  modal: false,
  status: "Processing...",
  errorText: "",
  multiple: false,
};

class SwapETHSimple extends Component {
  constructor(props) {
    super(props);
    this.state = SwapETHSimpleBaseState;
    reactAutobind(this);
    this.connection = new Connection(
      clusterApiUrl("mainnet-beta"),
      "confirmed"
    );
    this.mount = true;
    this.provider = null;
    this.flag = false;
    this.interval;
  }

  static contextType = ContextModule;

  componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);
      this.mount = true;
      this.mount && this.setState(SwapETHSimpleBaseState);
    });
    this.props.navigation.addListener("blur", async () => {
      this.mount && this.setState(SwapETHSimpleBaseState);
      this.interval && clearInterval(this.interval);
      this.mount = false;
    });
  }

  componentWillUnmount() {
    this.mount && this.setState(SwapETHSimpleBaseState);
    this.interval && clearInterval(this.interval);
    this.mount = false;
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
          explorerURL: `${this.state.network.blockExplorer}tx/${hash}`,
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

  async signMultipleEthereum(signedTx) {
    this.mount &&
      this.setState({
        status: "Processing...",
        stage: 2,
      });
    try {
      const { hash } = await this.provider.sendTransaction(signedTx);
      await this.provider.waitForTransaction(hash);
      this.flag = true;
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

  async swapTokens() {
    this.mount &&
      this.setState({
        stage: 2,
      });
    const { tokenFrom, tokenTo, network } = this.state;
    try {
      const nativeFrom = tokenFrom.contract ?? tokenFrom.uniswap.address;
      const nativeTo = tokenTo.contract ?? tokenTo.uniswap.address;
      const tokenContract = new ethers.Contract(
        nativeFrom,
        abiERC20,
        this.provider
      );
      const allowance = await tokenContract.allowance(
        this.context.value.ethPublicKey,
        network.swapRouter
      );
      const encoderToken = new ethers.utils.Interface(abiERC20);
      let gasPrice = await this.provider.getGasPrice();
      let nonce = await this.provider.getTransactionCount(
        this.context.value.ethPublicKey
      );
      let gas = 0;
      let transaction;
      if (
        allowance.toBigInt() <
        ethers.utils
          .parseUnits(this.state.amount, tokenFrom.decimals)
          .toBigInt()
      ) {
        transaction = {
          chainId: network.chainId,
          from: this.context.value.ethPublicKey,
          to: nativeFrom,
          data: encoderToken.encodeFunctionData("approve", [
            network.swapRouter,
            ethers.utils.parseUnits(this.state.amount, tokenFrom.decimals),
          ]),
          gasPrice,
          nonce,
        };
        gas = 0;
        try {
          gas = await this.provider.estimateGas(transaction);
          transaction = {
            ...transaction,
            gasLimit: gas
              .mul(BigNumber.from((125).toString()))
              .div(BigNumber.from((100).toString())),
          };
        } catch (e) {
          throw "approve";
        }
        console.log(transaction);
        this.mount &&
          this.setState({
            transactionDisplay: {
              kind: "eth_allowance",
              name: tokenFrom.symbol,
              value: this.state.amount,
              gas: epsilonRound(
                ethers.utils.formatEther(gas.mul(gasPrice).toString()),
                8
              ),
            },
            transaction,
            modal: true,
          });
        this.interval = await new Promise((resolve) =>
          setInterval(() => {
            if (this.flag) {
              clearInterval(this.interval);
              resolve("ok");
            } else {
              console.log(".");
            }
          }, 2500)
        );
      }
      gasPrice = await this.provider.getGasPrice();
      nonce = await this.provider.getTransactionCount(
        this.context.value.ethPublicKey
      );
      const encoder = new ethers.utils.Interface(SwapRouterABIV2.abi);
      const params = {
        tokenIn: nativeFrom,
        tokenOut: nativeTo,
        fee: FeeAmount.MEDIUM,
        recipient: this.context.value.ethPublicKey,
        amountIn: ethers.utils.parseUnits(
          this.state.amount,
          tokenFrom.decimals
        ),
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };
      const paramsArray = Object.keys(params).map((item) => params[item]);
      transaction = {
        chainId: network.chainId,
        from: this.context.value.ethPublicKey,
        to: network.swapRouter,
        data: encoder.encodeFunctionData("exactInputSingle", [paramsArray]),
        gasPrice,
        nonce,
      };
      gas = 0;
      try {
        gas = await this.provider.estimateGas(transaction);
        transaction = {
          ...transaction,
          gasLimit: gas
            .mul(BigNumber.from((125).toString()))
            .div(BigNumber.from((100).toString())),
        };
      } catch (e) {
        throw "swap";
      }
      console.log(transaction);
      this.mount &&
        this.setState({
          transactionDisplay: {
            kind: "eth_swapTokens",
            name: tokenFrom.symbol,
            value: this.state.amount,
            gas: epsilonRound(
              ethers.utils.formatEther(gas.mul(gasPrice).toString()),
              8
            ),
          },
          transaction,
          modal: true,
          multiple: false,
        });
    } catch (err) {
      console.log(err);
      if (err === "approve") {
        ToastAndroid.show(
          capitalizeFirstLetter(`${tokenFrom.symbol} approval Error`),
          ToastAndroid.LONG
        );
      } else {
        ToastAndroid.show(
          capitalizeFirstLetter(
            `${tokenFrom.symbol}:${tokenTo.symbol} swap error`
          ),
          ToastAndroid.LONG
        );
      }
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
    }
  }

  async swapTokensFromNative() {
    this.mount &&
      this.setState({
        stage: 2,
      });
    const { tokenFrom, tokenTo, network } = this.state;
    try {
      let gasPrice = await this.provider.getGasPrice();
      let nonce = await this.provider.getTransactionCount(
        this.context.value.ethPublicKey
      );
      let gas = 0;
      const encoderWToken = new ethers.utils.Interface(abiWERC20);
      let transaction = {
        chainId: network.chainId,
        from: this.context.value.ethPublicKey,
        to: tokenFrom.uniswap.address,
        data: encoderWToken.encodeFunctionData("deposit", []),
        gasPrice,
        nonce,
        value: ethers.utils.parseEther(this.state.amount),
      };
      gas = 0;
      try {
        gas = await this.provider.estimateGas(transaction);
        transaction = {
          ...transaction,
          gasLimit: gas
            .mul(BigNumber.from((125).toString()))
            .div(BigNumber.from((100).toString())),
        };
      } catch (e) {
        throw "wrapping";
      }
      this.mount &&
        this.setState({
          transactionDisplay: {
            kind: "eth_wrappingToken",
            name: tokenFrom.symbol,
            value: this.state.amount,
            gas: epsilonRound(
              ethers.utils.formatEther(gas.mul(gasPrice).toString()),
              8
            ),
          },
          transaction,
          modal: true,
        });
      await new Promise((resolve) => {
        this.interval = setInterval(() => {
          if (this.flag) {
            clearInterval(this.interval);
            this.flag = false;
            resolve("ok");
          } else {
            console.log(".");
          }
        }, 2500);
      });
      const tokenContract = new ethers.Contract(
        tokenFrom.uniswap.address,
        abiERC20,
        this.provider
      );
      const allowance = await tokenContract.allowance(
        this.context.value.ethPublicKey,
        network.swapRouter
      );
      gasPrice = await this.provider.getGasPrice();
      nonce = await this.provider.getTransactionCount(
        this.context.value.ethPublicKey
      );
      if (
        allowance.toBigInt() <
        ethers.utils
          .parseUnits(this.state.amount, tokenFrom.decimals)
          .toBigInt()
      ) {
        const encoderToken = new ethers.utils.Interface(abiERC20);
        transaction = {
          chainId: network.chainId,
          from: this.context.value.ethPublicKey,
          to: tokenFrom.uniswap.address,
          data: encoderToken.encodeFunctionData("approve", [
            network.swapRouter,
            ethers.utils.parseUnits(this.state.amount, tokenFrom.decimals),
          ]),
          gasPrice,
          nonce,
        };
        gas = 0;
        try {
          gas = await this.provider.estimateGas(transaction);
          transaction = {
            ...transaction,
            gasLimit: gas
              .mul(BigNumber.from((125).toString()))
              .div(BigNumber.from((100).toString())),
          };
        } catch (e) {
          throw "approve";
        }
        this.mount &&
          this.setState({
            transactionDisplay: {
              kind: "eth_allowance",
              name: tokenFrom.symbol,
              value: this.state.amount,
              gas: epsilonRound(
                ethers.utils.formatEther(gas.mul(gasPrice).toString()),
                8
              ),
            },
            transaction,
            modal: true,
          });
        await new Promise((resolve) => {
          this.interval = setInterval(() => {
            if (this.flag) {
              clearInterval(this.interval);
              this.flag = false;
              resolve("ok");
            } else {
              console.log(".");
            }
          }, 2500);
        });
      }
      gasPrice = await this.provider.getGasPrice();
      nonce = await this.provider.getTransactionCount(
        this.context.value.ethPublicKey
      );
      const encoder = new ethers.utils.Interface(SwapRouterABIV2.abi);
      const params = {
        tokenIn: tokenFrom.uniswap.address,
        tokenOut: tokenTo.uniswap.address,
        fee: FeeAmount.MEDIUM,
        recipient: this.context.value.ethPublicKey,
        amountIn: ethers.utils.parseUnits(
          this.state.amount,
          tokenFrom.decimals
        ),
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };
      const paramsArray = Object.keys(params).map((item) => params[item]);
      transaction = {
        chainId: network.chainId,
        from: this.context.value.ethPublicKey,
        to: network.swapRouter,
        data: encoder.encodeFunctionData("exactInputSingle", [paramsArray]),
        gasPrice,
        nonce,
      };
      gas = 0;
      try {
        gas = await this.provider.estimateGas(transaction);
        transaction = {
          ...transaction,
          gasLimit: gas
            .mul(BigNumber.from((125).toString()))
            .div(BigNumber.from((100).toString())),
        };
      } catch (e) {
        throw "swap";
      }
      console.log(transaction);
      this.mount &&
        this.setState({
          transactionDisplay: {
            kind: "eth_swapTokens",
            name: tokenFrom.symbol,
            value: this.state.amount,
            gas: epsilonRound(
              ethers.utils.formatEther(gas.mul(gasPrice).toString()),
              8
            ),
          },
          transaction,
          modal: true,
          multiple: false,
        });
    } catch (err) {
      console.log(err);
      if (err === "wrapping") {
        ToastAndroid.show(
          capitalizeFirstLetter(`${tokenFrom.symbol} wrapping Error`),
          ToastAndroid.LONG
        );
      } else if (err === "approve") {
        ToastAndroid.show(
          capitalizeFirstLetter(`${tokenFrom.symbol} approve Error`),
          ToastAndroid.LONG
        );
      } else {
        ToastAndroid.show(
          capitalizeFirstLetter(
            `${tokenFrom.symbol}:${tokenTo.symbol} swap error`
          ),
          ToastAndroid.LONG
        );
      }
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
    }
  }

  async swapTokensToNative() {
    this.mount &&
      this.setState({
        stage: 2,
      });
    const { tokenFrom, tokenTo, network } = this.state;
    try {
      const tokenContract = new ethers.Contract(
        tokenFrom.uniswap.address,
        abiERC20,
        this.provider
      );
      const allowance = await tokenContract.allowance(
        this.context.value.ethPublicKey,
        network.swapRouter
      );
      let gas = 0;
      let transaction;
      let gasPrice = await this.provider.getGasPrice();
      let nonce = await this.provider.getTransactionCount(
        this.context.value.ethPublicKey
      );
      if (
        allowance.toBigInt() <
        ethers.utils
          .parseUnits(this.state.amount, tokenFrom.decimals)
          .toBigInt()
      ) {
        const encoderToken = new ethers.utils.Interface(abiERC20);
        transaction = {
          chainId: network.chainId,
          from: this.context.value.ethPublicKey,
          to: tokenFrom.uniswap.address,
          data: encoderToken.encodeFunctionData("approve", [
            network.swapRouter,
            ethers.utils.parseUnits(this.state.amount, tokenFrom.decimals),
          ]),
          gasPrice,
          nonce,
        };
        gas = 0;
        try {
          gas = await this.provider.estimateGas(transaction);
          transaction = {
            ...transaction,
            gasLimit: gas
              .mul(BigNumber.from((125).toString()))
              .div(BigNumber.from((100).toString())),
          };
        } catch (e) {
          throw "approve";
        }
        this.mount &&
          this.setState({
            transactionDisplay: {
              kind: "eth_allowance",
              name: tokenFrom.symbol,
              value: this.state.amount,
              gas: epsilonRound(
                ethers.utils.formatEther(gas.mul(gasPrice).toString()),
                8
              ),
            },
            transaction,
            modal: true,
          });
        await new Promise((resolve) => {
          this.interval = setInterval(() => {
            if (this.flag) {
              clearInterval(this.interval);
              this.flag = false;
              resolve("ok");
            } else {
              console.log(".");
            }
          }, 2500);
        });
      }
      gasPrice = await this.provider.getGasPrice();
      nonce = await this.provider.getTransactionCount(
        this.context.value.ethPublicKey
      );
      const encoder = new ethers.utils.Interface(SwapRouterABIV2.abi);
      const params = {
        tokenIn: tokenFrom.uniswap.address,
        tokenOut: tokenTo.uniswap.address,
        fee: FeeAmount.MEDIUM,
        recipient: this.context.value.ethPublicKey,
        amountIn: ethers.utils.parseUnits(
          this.state.amount,
          tokenFrom.decimals
        ),
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };
      const paramsArray = Object.keys(params).map((item) => params[item]);
      transaction = {
        chainId: network.chainId,
        from: this.context.value.ethPublicKey,
        to: network.swapRouter,
        data: encoder.encodeFunctionData("exactInputSingle", [paramsArray]),
        gasPrice,
        nonce,
      };
      gas = 0;
      try {
        gas = await this.provider.estimateGas(transaction);
        transaction = {
          ...transaction,
          gasLimit: gas
            .mul(BigNumber.from((125).toString()))
            .div(BigNumber.from((100).toString())),
        };
      } catch (e) {
        throw "swap";
      }
      console.log(transaction);
      this.mount &&
        this.setState({
          transactionDisplay: {
            kind: "eth_swapTokens",
            name: tokenFrom.symbol,
            value: this.state.amount,
            gas: epsilonRound(
              ethers.utils.formatEther(gas.mul(gasPrice).toString()),
              8
            ),
          },
          transaction,
          modal: true,
        });
      await new Promise((resolve) => {
        this.interval = setInterval(() => {
          if (this.flag) {
            clearInterval(this.interval);
            this.flag = false;
            resolve("ok");
          } else {
            console.log(".");
          }
        }, 2500);
      });
      gasPrice = await this.provider.getGasPrice();
      nonce = await this.provider.getTransactionCount(
        this.context.value.ethPublicKey
      );
      const encoderWToken = new ethers.utils.Interface(abiWERC20);
      transaction = {
        chainId: network.chainId,
        from: this.context.value.ethPublicKey,
        to: tokenTo.uniswap.address,
        data: encoderWToken.encodeFunctionData("withdraw", [
          ethers.utils.parseEther(this.state.amount),
        ]),
        gasPrice,
        nonce,
      };
      gas = 0;
      try {
        gas = await this.provider.estimateGas(transaction);
        transaction = {
          ...transaction,
          gasLimit: gas
            .mul(BigNumber.from((125).toString()))
            .div(BigNumber.from((100).toString())),
        };
      } catch (e) {
        throw "unwrapping";
      }
      this.mount &&
        this.setState({
          transactionDisplay: {
            kind: "eth_unwrappingToken",
            name: tokenFrom.symbol,
            value: this.state.amount,
            gas: epsilonRound(
              ethers.utils.formatEther(gas.mul(gasPrice).toString()),
              8
            ),
          },
          transaction,
          modal: true,
          multiple: false,
        });
    } catch (err) {
      console.log(err);
      if (err === "unwrapping") {
        ToastAndroid.show(
          capitalizeFirstLetter(`${tokenFrom.symbol} unwrapping Error`),
          ToastAndroid.LONG
        );
      } else if (err === "approve") {
        ToastAndroid.show(
          capitalizeFirstLetter(`${tokenFrom.symbol} approve Error`),
          ToastAndroid.LONG
        );
      } else {
        ToastAndroid.show(
          capitalizeFirstLetter(
            `${tokenFrom.symbol}:${tokenTo.symbol} swap error`
          ),
          ToastAndroid.LONG
        );
      }
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
    }
  }

  async wrapNativeToken() {
    this.mount &&
      this.setState({
        loading: true,
      });
    const { tokenFrom, tokenTo, network } = this.state;
    try {
      this.provider = new ethers.providers.JsonRpcProvider(network.rpc);
      const gasPrice = await this.provider.getGasPrice();
      const nonce = await this.provider.getTransactionCount(
        this.context.value.ethPublicKey
      );
      const balance = await this.provider.getBalance(
        this.context.value.ethPublicKey
      );
      const encoder = new ethers.utils.Interface(abiWERC20);
      let transaction = {
        chainId: network.chainId,
        from: this.context.value.ethPublicKey,
        to: tokenTo.contract,
        data: encoder.encodeFunctionData("deposit", []),
        gasPrice,
        nonce,
        value: ethers.utils.parseEther(this.state.amount),
      };
      let gas = 0;
      try {
        gas = await this.provider.estimateGas(transaction);
        transaction = {
          ...transaction,
          gasLimit: gas
            .mul(BigNumber.from((125).toString()))
            .div(BigNumber.from((100).toString())),
        };
      } catch (e) {
        throw "balance";
      }
      const checkGas = gas.toBigInt() * gasPrice.toBigInt();
      const checkBalance = balance.toBigInt();
      const check = checkBalance >= checkGas;
      this.mount &&
        this.setState({
          amountOut: this.state.amount,
          transactionDisplay: {
            kind: "eth_wrappingToken",
            name: tokenFrom.symbol,
            value: parseFloat(this.state.amount),
            gas: epsilonRound(
              ethers.utils.formatEther(gas.mul(gasPrice).toString()),
              8
            ),
          },
          transaction,
          check: check ? "Swap" : "Check Again",
          loading: false,
        });
    } catch (err) {
      if (err === "balance") {
        ToastAndroid.show(
          capitalizeFirstLetter(`Insufficient ${network.token} balance`),
          ToastAndroid.LONG
        );
      } else {
        ToastAndroid.show(
          capitalizeFirstLetter(`Insufficient ${tokenFrom.symbol} balance`),
          ToastAndroid.LONG
        );
      }
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
    }
  }

  async unWrapNativeToken() {
    this.mount &&
      this.setState({
        loading: true,
      });
    const { tokenFrom, network } = this.state;
    try {
      this.provider = new ethers.providers.JsonRpcProvider(network.rpc);
      const gasPrice = await this.provider.getGasPrice();
      const nonce = await this.provider.getTransactionCount(
        this.context.value.ethPublicKey
      );
      const balance = await this.provider.getBalance(
        this.context.value.ethPublicKey
      );
      const encoder = new ethers.utils.Interface(abiWERC20);
      let transaction = {
        chainId: network.chainId,
        from: this.context.value.ethPublicKey,
        to: tokenFrom.contract,
        data: encoder.encodeFunctionData("withdraw", [
          ethers.utils.parseEther(this.state.amount),
        ]),
        gasPrice,
        nonce,
      };
      let gas = 0;
      try {
        gas = await this.provider.estimateGas(transaction);
        transaction = {
          ...transaction,
          gasLimit: gas
            .mul(BigNumber.from((125).toString()))
            .div(BigNumber.from((100).toString())),
        };
      } catch (e) {
        throw "balance";
      }
      const checkGas = gas.toBigInt() * gasPrice.toBigInt();
      const checkBalance = balance.toBigInt();
      const check = checkBalance >= checkGas;
      this.mount &&
        this.setState({
          amountOut: this.state.amount,
          transactionDisplay: {
            kind: "eth_unwrappingToken",
            name: tokenFrom.symbol,
            value: this.state.amount,
            gas: epsilonRound(
              ethers.utils.formatEther(gas.mul(gasPrice).toString()),
              8
            ),
          },
          transaction,
          check: check ? "Swap" : "Check Again",
          loading: false,
        });
    } catch (err) {
      console.log(err);
      if (err === "balance") {
        ToastAndroid.show(
          capitalizeFirstLetter(`Insufficient ${network.token} balance`),
          ToastAndroid.LONG
        );
      } else {
        ToastAndroid.show(
          capitalizeFirstLetter(`Insufficient ${tokenFrom.symbol} balance`),
          ToastAndroid.LONG
        );
      }
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
    }
  }

  async getSwapCalc() {
    this.mount &&
      this.setState({
        loading: true,
      });
    const { tokenFrom, tokenTo, network } = this.state;
    try {
      if (parseFloat(this.state.amount) <= 0) throw "amount";
      this.provider = new ethers.providers.JsonRpcProvider(network.rpc);
      const factoryContract = new ethers.Contract(
        network.poolFactoryAddress,
        IUniswapV3Factory.abi,
        this.provider
      );
      const currentPoolAddress = await factoryContract.getPool(
        tokenFrom.uniswap.address,
        tokenTo.uniswap.address,
        FeeAmount.MEDIUM
      );
      if (currentPoolAddress === "0x0000000000000000000000000000000000000000")
        throw "noPool";
      const poolContract = new ethers.Contract(
        currentPoolAddress,
        IUniswapV3PoolABI.abi,
        this.provider
      );
      const [token0, token1, fee] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
      ]);
      const quoterContract = new ethers.Contract(
        network.quoterAddress,
        QuoterV2.abi,
        this.provider
      );
      const [quotedAmountOut] =
        await quoterContract.callStatic.quoteExactInputSingle([
          token0,
          token1,
          ethers.utils.parseUnits(this.state.amount, tokenFrom.decimals),
          fee,
          0,
        ]);
      this.mount &&
        this.setState({
          loading: false,
          amountOut: epsilonRound(
            ethers.utils.formatUnits(quotedAmountOut, tokenTo.decimals),
            8
          ),
          check: "Swap",
          multiple: true,
        });
    } catch (err) {
      if (err === "noPool") {
        ToastAndroid.show(
          capitalizeFirstLetter(
            `No ${tokenFrom.symbol}:${tokenTo.symbol} pool available for exchange`
          ),
          ToastAndroid.LONG
        );
      } else if (err === "amount") {
        ToastAndroid.show(
          capitalizeFirstLetter(`Amount must be greater than 0`),
          ToastAndroid.LONG
        );
      } else {
        ToastAndroid.show(
          capitalizeFirstLetter(`Insufficient ${tokenFrom.symbol} balance`),
          ToastAndroid.LONG
        );
      }
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
    }
  }

  async routeSignTransaction() {
    const { tokenFrom, tokenTo } = this.state;
    if (tokenFrom.contract === "") {
      // MATIC as INPUT
      if (tokenFrom.uniswap.address === tokenTo.uniswap.address) {
        console.log("Wrap Token");
        this.mount &&
          this.setState({
            modal: true,
          });
      } else {
        this.swapTokensFromNative();
      }
    } else {
      // Token as Input
      if (tokenFrom.uniswap.address === tokenTo.uniswap.address) {
        console.log("unWrap Token");
        this.mount &&
          this.setState({
            modal: true,
          });
      } else if (this.state.network.token === tokenTo.symbol) {
        this.swapTokensToNative();
      } else {
        this.swapTokens();
      }
    }
  }

  async routeTransaction() {
    const { tokenFrom, tokenTo } = this.state;
    if (tokenFrom.contract === "") {
      // MATIC as INPUT
      if (tokenFrom.uniswap.address === tokenTo.uniswap.address) {
        console.log("Wrap Token");
        this.wrapNativeToken();
      } else {
        this.getSwapCalc();
      }
    } else {
      // Token as Input
      if (tokenFrom.uniswap.address === tokenTo.uniswap.address) {
        console.log("unWrap Token");
        this.unWrapNativeToken();
      } else {
        this.getSwapCalc();
      }
    }
  }

  render() {
    const modalScale = 0.5;
    //console.log(this.context.value.ethPublicKey);
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
                {`${this.state.transactionDisplay.value}`}
                {` ${this.state.transactionDisplay.name}`}
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
                {` ${this.state.network.token}`}
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
                        this.mount &&
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
                  onPress={() => {
                    this.interval && clearInterval(this.interval);
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
                  }}
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
                  <View style={{ marginTop: 10 }} />
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
                      style={[
                        GlobalStyles.input,
                        { marginTop: 10, marginBottom: 10 },
                      ]}
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
                      {
                        width: Dimensions.get("screen").width * 0.9,
                        marginTop: 10,
                        marginBottom: 10,
                      },
                    ]}
                    labelStyle={[GlobalStyles.inputSelectorLabel]}
                    itemLabelStyle={[GlobalStyles.inputSelectorText]}
                    selectedValueStyle={[GlobalStyles.inputSelectorText]}
                    items={SendNetworks}
                    selectedValue={this.state.network.value}
                    label="   Network"
                    onSelection={(item) => {
                      this.mount &&
                        this.setState({
                          network: item,
                          tokenFrom: setTokens(item.tokens)[0],
                          tokenTo: setTokens(item.tokens)[1],
                          check: "Check",
                          amountOut: "0",
                          data: {},
                        });
                    }}
                  />
                  <Picker
                    isRequired
                    buttonStyle={[
                      GlobalStyles.inputSelector,
                      {
                        width: Dimensions.get("screen").width * 0.9,
                        marginTop: 10,
                        marginBottom: 10,
                      },
                    ]}
                    labelStyle={[GlobalStyles.inputSelectorLabel]}
                    itemLabelStyle={[GlobalStyles.inputSelectorText]}
                    selectedValueStyle={[GlobalStyles.inputSelectorText]}
                    items={setTokens(this.state.network.tokens)}
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
                            tokenTo: setTokens(this.state.network.tokens)[1],
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
                            tokenTo: setTokens(this.state.network.tokens)[0],
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
                      {
                        width: Dimensions.get("screen").width * 0.9,
                        marginTop: 10,
                        marginBottom: 10,
                      },
                    ]}
                    labelStyle={[GlobalStyles.inputSelectorLabel]}
                    itemLabelStyle={[GlobalStyles.inputSelectorText]}
                    selectedValueStyle={[GlobalStyles.inputSelectorText]}
                    items={setTokens(this.state.network.tokens)}
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
                            tokenFrom: setTokens(this.state.network.tokens)[1],
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
                            tokenFrom: setTokens(this.state.network.tokens)[0],
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
                      marginBottom: 10,
                    }}
                  >
                    Amount to receive
                  </Text>
                  <Text
                    style={{
                      fontSize: 24,
                      color: "#FFF",
                      fontWeight: "bold",
                      marginBottom: 10,
                    }}
                  >
                    {`${this.state.amountOut} ${this.state.tokenTo.symbol}`}
                  </Text>
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
                        ? this.routeSignTransaction()
                        : this.routeTransaction();
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
            <CryptoSignETH
              transaction={this.state.transaction}
              cancelTrans={() =>
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
                })
              }
              signEthereum={(e) =>
                this.state.multiple
                  ? this.signMultipleEthereum(e)
                  : this.signEthereum(e)
              }
            />
          )}
          {this.state.stage === 2 && (
            <View style={GlobalStyles.mainComplete}>
              <View
                style={{
                  flex: 1,
                  flexDirection: "column",
                  justifyContent: "space-evenly",
                  alignItems: "center",
                }}
              >
                <IconMCU
                  name="swap-vertical-circle"
                  size={Dimensions.get("screen").width * 0.6}
                  color="#00e599"
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
                <View>
                  <Text
                    style={{
                      textShadowRadius: 1,
                      fontSize: 24,
                      fontWeight: "bold",
                      color: "white",
                      textAlign: "center",
                    }}
                  >
                    From
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
                          {this.state.network.network}
                        </Text>
                        <Text style={{ fontSize: 14, color: "white" }}>
                          eth_signTransaction
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
                  <Text
                    style={{
                      textShadowRadius: 1,
                      fontSize: 24,
                      fontWeight: "bold",
                      color: "white",
                      textAlign: "center",
                    }}
                  >
                    To
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
                          {this.state.network.network}
                        </Text>
                        <Text style={{ fontSize: 14, color: "white" }}>
                          eth_signTransaction
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
                        {this.state.tokenTo.icon}
                      </View>
                      <Text>
                        {this.state.amountOut} {this.state.tokenTo.symbol}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
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
                        {this.state.network.network}
                      </Text>
                      <Text style={{ fontSize: 14, color: "white" }}>
                        eth_signTransaction
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
                      {`${epsilonRound(parseFloat(this.state.amount), 8)}`}{" "}
                      {this.state.tokenFrom.symbol}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    textShadowRadius: 1,
                    fontSize: 24,
                    fontWeight: "bold",
                    color: "white",
                    textAlign: "center",
                  }}
                >
                  To
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
                        {this.state.network.network}
                      </Text>
                      <Text style={{ fontSize: 14, color: "white" }}>
                        eth_signTransaction
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
                      {this.state.tokenTo.icon}
                    </View>
                    <Text>
                      {this.state.amountOut} {this.state.tokenTo.symbol}
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
                    onPress={() => this.setState(SwapETHSimpleBaseState)}
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

export default SwapETHSimple;
