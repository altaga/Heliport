// Basic Imports
import React from 'react'
import reactAutobind from 'react-autobind';
import bs58 from 'bs58';
import { Keypair, Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import solana from "../assets/solana-token.png"
import usdc from "../assets/usdc-token.png"
import usdt from "../assets/usdt-token.png"
import { Image } from 'react-native';

function StringToUint8Array(params) {
  let b = bs58.decode(params);
  return new Uint8Array(b.buffer, b.byteOffset, b.byteLength / Uint8Array.BYTES_PER_ELEMENT);
}

const logoSize = 24

const ContextModule = React.createContext()

// Context Provider Component

class ContextProvider extends React.Component {
  // define all the values you want to use in the context
  constructor(props) {
    super(props);
    this.state = {
      value: {
        // General
        biometrics: false,
        pin: null,
        // Transaction Data
        to:"", // ""
        // Crypto
        connection: new Connection("https://solana-mainnet.g.alchemy.com/v2/vfFzXAyNI8zcPqNyr8ICHXb3994JbtRa", 'confirmed'),
        wallet: null,
        effisendWallet:"GoKEL4nB9HddWpCxpp8BesG4d9QNzns6jR4o2x2KQ2hP",
        cryptoBalances: {
          sol: 0,
          usdc: 0,
          usdt: 0,
        },
        cryptoAccounts: {
          sol: "",
          usdc: "",
          usdt: "",
        },
        lastBlockTime: 0,
        splTokens: [
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
      }
    }
    reactAutobind(this);
  }



  // Method to update manually the context state, this method isn't used in this example

  setValue = (value) => {
    this.setState({
      value: {
        ...this.state.value,
        ...value,
      }
    })
  }

  render() {
    const { children } = this.props
    const { value } = this.state
    // Fill this object with the methods you want to pass down to the context
    const { setValue } = this

    return (
      <ContextModule.Provider
        // Provide all the methods and values defined above
        value={{
          value,
          setValue
        }}
      >
        {children}
      </ContextModule.Provider>
    )
  }
}

// Dont Change anything below this line

export { ContextProvider }
export const ContextConsumer = ContextModule.Consumer
export default ContextModule