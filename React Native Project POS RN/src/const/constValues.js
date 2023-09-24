import { Image } from "react-native";
import solana from "../assets/solana-token.png"
import usdc from "../assets/usdc-token.png"
import usdt from "../assets/usdt-token.png"
import { PublicKey } from "@solana/web3.js";

const logoSize = 24

export const splTokens = [
    {
      value: null,
      label: "SOL",
      publicKey: "",
      icon: <Image style={{ width: logoSize, height: logoSize }} source={solana} />
    },
    {
      value: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
      label: "USDC",
      publicKey: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      icon: <Image style={{ width: logoSize, height: logoSize }} source={usdc} />
    },
    {
      value: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
      label: "USDT",
      publicKey: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      icon: <Image style={{ width: logoSize, height: logoSize }} source={usdt} />
    },
  ]