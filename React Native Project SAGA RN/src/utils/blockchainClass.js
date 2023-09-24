import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { abiERC20 } from "../contractsETH/erc20";
import { Contract, providers, utils } from "ethers";
import { SolanaRPCs, USDfeed, icons, iconsS } from "./constants";
import { Image } from "react-native-elements";
import tokenBase from "../assets/logos/tokenBase.png";
import { AccountLayout } from "@solana/spl-token";

const tokenSize = 40;
const tokenSubSize = 15;

export function getUSDTokens(array) {
  return new Promise((resolve, reject) => {
    var myHeaders = new Headers();
    myHeaders.append("accept", "application/json");
    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
    fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${array.toString()}&vs_currencies=usd`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => {
        resolve(result);
      })
      .catch((error) => resolve(0));
  });
}

async function getBalance(address) {
  // Solution with public RPC Providers
  try {
    let res = await new Promise(async (resolve) => {
      let balance = 0;
      for (let i = 0; i < SolanaRPCs.length; i++) {
        try {
          const connection = new Connection(SolanaRPCs[i], "confirmed");
          balance = await connection.getBalance(address);
          break;
        } catch (e) {
          console.log(`error detected: ${e}`);
          continue;
        }
      }
      resolve(balance);
    });
    return res;
  } catch (e) {
    console.log(e);
    return 0;
  }
}

async function getParsedAccountInfo(address) {
  // Solution with public RPC Providers
  try {
    let res = await new Promise(async (resolve) => {
      let result = {};
      for (let i = 0; i < SolanaRPCs.length; i++) {
        try {
          const connection = new Connection(SolanaRPCs[i], "confirmed");
          result = await connection.getParsedAccountInfo(address);
          break;
        } catch (e) {
          console.log(`error detected: ${e}`);
          continue;
        }
      }
      resolve(result);
    });
    return res;
  } catch (e) {
    console.log(e);
    return {};
  }
}

async function getTokenAccountsByOwner(one, two, three) {
  // Solution with public RPC Providers
  try {
    let res = await new Promise(async (resolve) => {
      let result = {};
      for (let i = 0; i < SolanaRPCs.length; i++) {
        try {
          const connection = new Connection(SolanaRPCs[i], "confirmed");
          result = await connection.getTokenAccountsByOwner(one, two, three);
          break;
        } catch (e) {
          console.log(`error detected: ${e}`);
          continue;
        }
      }
      resolve(result);
    });
    return res;
  } catch (e) {
    console.log(e);
    return {};
  }
}

export class TokenSolana {
  constructor(rpc, contract, symbol, decimals, balance, usd) {
    this.contract = contract;
    this.symbol = symbol;
    this.icon = icons[symbol.toLowerCase()] ?? (
      <Image
        source={tokenBase}
        style={{ width: tokenSize, height: tokenSize }}
      />
    );
    this.subIcon = iconsS[symbol.toLowerCase()] ?? (
      <Image
        source={tokenBase}
        style={{ width: tokenSubSize, height: tokenSubSize }}
      />
    );
    this.decimals = decimals;
    this.balance = balance;
    this.usd = usd;
    this.rpc = rpc;
  }

  balanceUSD() {
    return this.balance * this.usd;
  }

  setBalance(balance) {
    this.balance = balance;
    return this.balance;
  }
  setUSD(usd) {
    this.usd = usd;
    return this.usd;
  }

  async getBalance(address) {
    if (this.contract === "") {
      const balance = await getBalance(address);
      this.balance = balance / LAMPORTS_PER_SOL;
      return balance / LAMPORTS_PER_SOL;
    } else {
      const mintAddress = new PublicKey(this.contract);
      const info = await getParsedAccountInfo(mintAddress);
      const decimals = info.value.data.parsed.info.decimals;
      let tokenBalance;
      const tokenAccount = await getTokenAccountsByOwner(
        address,
        { mint: mintAddress },
        "finalized"
      );
      try {
        tokenBalance = parseFloat(
          AccountLayout.decode(tokenAccount.value[0].account.data).amount
        );
      } catch (error) {
        this.balance = 0;
        return 0;
      }
      this.balance = tokenBalance / Math.pow(10, decimals);
      return tokenBalance / Math.pow(10, decimals);
    }
  }
}

export class TokenETH {
  constructor(
    rpc,
    contract,
    symbol,
    decimals,
    balance,
    usd,
    iconSymbol = null
  ) {
    this.contract = contract;
    this.symbol = symbol;
    this.icon = icons[iconSymbol ?? symbol.toLowerCase()] ?? (
      <Image
        source={tokenBase}
        style={{ width: tokenSize, height: tokenSize }}
      />
    );
    this.subIcon = iconsS[symbol.toLowerCase()] ?? (
      <Image
        source={tokenBase}
        style={{ width: tokenSubSize, height: tokenSubSize }}
      />
    );
    this.decimals = decimals;
    this.balance = balance;
    this.usd = usd;
    this.rpc = rpc;
  }

  balanceUSD() {
    return this.balance * this.usd;
  }

  setBalance(balance) {
    this.balance = balance;
    return this.balance;
  }
  setUSD(usd) {
    this.usd = usd;
    return this.usd;
  }

  async getBalance(address) {
    const provider = new providers.StaticJsonRpcProvider(this.rpc);
    if (this.contract === "") {
      const balance = await provider.getBalance(address);
      this.balance = utils.formatEther(balance);
      return utils.formatEther(balance);
    } else {
      return new Promise(async (resolve) => {
        const contract = new Contract(this.contract, abiERC20, provider);
        const res = await contract.balanceOf(address);
        const decimals = await contract.decimals();
        this.balance = res / Math.pow(10, decimals);
        this.decimals = decimals;
        resolve(res / Math.pow(10, decimals));
      });
    }
  }
}

export class SolanaNetwork {
  constructor(network, token, rpc, blockExplorer, tokens) {
    this.network = network;
    this.token = token;
    this.rpc = rpc;
    this.blockExplorer = blockExplorer;
    this.tokens = tokens;
  }

  addToken(contract, symbol, decimals, balance, usd) {
    const temp = [
      ...this.tokens,
      new TokenSolana(contract, symbol, decimals, balance, usd),
    ];
    this.tokens = temp;
    return this.tokens;
  }
}

export class Network {
  constructor(network, token, rpc, chainId, blockExplorer, iconSymbol, tokens) {
    this.network = network;
    this.token = token;
    this.rpc = rpc;
    this.chainId = chainId;
    this.blockExplorer = blockExplorer;
    this.iconSymbol = iconSymbol;
    this.tokens = tokens;
  }

  addToken(contract, symbol, decimals, balance, usd) {
    const temp = [
      ...this.tokens,
      TokenETH(contract, symbol, decimals, balance, usd),
    ];
    this.tokens = temp;
    return this.tokens;
  }
}
