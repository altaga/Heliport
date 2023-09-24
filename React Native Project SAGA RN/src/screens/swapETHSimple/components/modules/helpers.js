import { MixedRouteTrade, Trade as RouterTrade } from "@uniswap/router-sdk";
import { Percent } from "@uniswap/sdk-core";
import { V2Trade } from "@uniswap/v2-sdk";
import {
  Pool,
  TICK_SPACINGS,
  TickMath,
  Trade as V3Trade,
  nearestUsableTick,
} from "@uniswap/v3-sdk";
import { ethers } from "ethers";
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import JSBI from "jsbi";

export async function getPool(tokenA, tokenB, feeAmount, rpc) {
  const provider = new ethers.providers.JsonRpcProvider(rpc);
  const [token0, token1] = tokenA.sortsBefore(tokenB)
    ? [tokenA, tokenB]
    : [tokenB, tokenA];

  const poolAddress = Pool.getAddress(token0, token1, feeAmount);

  const contract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI.abi,
    provider
  );

  let liquidity = await contract.liquidity();

  let { sqrtPriceX96, tick } = await contract.slot0();

  liquidity = JSBI.BigInt(liquidity.toString())
  sqrtPriceX96 = JSBI.BigInt(sqrtPriceX96.toString())

  return new Pool(token0, token1, feeAmount, sqrtPriceX96, liquidity, tick, [
    {
      index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]),
      liquidityNet: liquidity,
      liquidityGross: liquidity,
    },
    {
      index: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]),
      liquidityNet: JSBI.multiply(liquidity, JSBI.BigInt('-1')),
      liquidityGross: liquidity,
    },
  ]);
}

export function swapOptions(options, recipient) {
  return Object.assign(
    {
      slippageTolerance: new Percent(5, 100),
      recipient,
    },
    options
  );
}

export function buildTrade(trades) {
  return new RouterTrade({
    v2Routes: trades
      .filter((trade) => trade instanceof V2Trade)
      .map((trade) => ({
        routev2: trade.route,
        inputAmount: trade.inputAmount,
        outputAmount: trade.outputAmount,
      })),
    v3Routes: trades
      .filter((trade) => trade instanceof V3Trade)
      .map((trade) => ({
        routev3: trade.route,
        inputAmount: trade.inputAmount,
        outputAmount: trade.outputAmount,
      })),
    mixedRoutes: trades
      .filter((trade) => trade instanceof MixedRouteTrade)
      .map((trade) => ({
        mixedRoute: trade.route,
        inputAmount: trade.inputAmount,
        outputAmount: trade.outputAmount,
      })),
    tradeType: trades[0].tradeType,
  });
}
