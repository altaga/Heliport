// Basic Imports
import React from 'react'
import reactAutobind from 'react-autobind';
import solana from "../assets/solana-token.png"
import usdc from "../assets/usdc-token.png"
import usdt from "../assets/usdt-token.png"
import { Image } from 'react-native';
import { PublicKey } from '@solana/web3.js';

const ContextModule = React.createContext()

// Context Provider Component

class ContextProvider extends React.Component {
  // define all the values you want to use in the context
  constructor(props) {
    super(props);
    this.state = {
      value: {
        bleRestart:0,
        to: "", // ""
        pubKey: null,
        transaction:["2vrtCLU24YEVeku55kDHmaGu¦×eD·$·0wGHAB77£TV¦e#V5sãCE♠ôãux6çWu$%x45NAERVbKSH3qL","0.001011"], // ["",""]
        cryptoBalances: {
          sol: 0,
          usdc: 0,
          usdt: 0,
        },
        solUSDC: 0,
        splTokens: [
          {
            value: null,
            label: "SOL",
            publicKey: "",
            icon: <Image style={{ width: 36, height: 36 }} source={solana} />
          },
          {
            value: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
            label: "USDC",
            publicKey: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            icon: <Image style={{ width: 36, height: 36 }} source={usdc} />
          },
          {
            value: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
            label: "USDT",
            publicKey: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            icon: <Image style={{ width: 36, height: 36 }} source={usdt} />
          }
        ]
      }
    }
    reactAutobind(this);
  }

  // Method to update manually the context state, this method isn't used in this example

  setValue = (value, then = () => { }) => {
    this.setState({
      value: {
        ...this.state.value,
        ...value,
      }
    }, () => then())
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