// Basic Imports
'use client'; // NextJS 13
import { Connection } from '@solana/web3.js';
import React from 'react';
import reactAutobind from 'react-autobind';
import { FIAT_WALLET, FIAT_BEARER, CONNECTORRPC } from "@env";

const ContextModule = React.createContext();

// Context Provider Component

class ContextProvider extends React.Component {
  // define all the values you want to use in the context
  constructor(props) {
    super(props);
    this.state = {
      value: {
        // Fiat
        fiatWallet: FIAT_WALLET,
        fiatBearer: FIAT_BEARER,
        fiatBalance: 0,
        fiatTransactions: [],
        // Crypto
        connection: new Connection(
          CONNECTORRPC
        ),
        publicKey: '',
        cryptoBalances: {
          sol: 0,
          usdc: 0,
          usdt: 0,
        },
        cryptoAccounts: {
          sol: 0,
          usdc: 0,
          usdt: 0,
        },
        lastBlockTime: 0,
        transactionData: {
          amount:0,
          token:"",
          memo:"",
          signature:""
        },
      },
    };
    reactAutobind(this);
  }

  // Method to update manually the context state, this method isn't used in this example

  setValue = (value, then = () => {}) => {
    this.setState(
      {
        value: {
          ...this.state.value,
          ...value,
        },
      },
      () => then(),
    );
  };

  render() {
    const {children} = this.props;
    const {value} = this.state;
    // Fill this object with the methods you want to pass down to the context
    const {setValue} = this;

    return (
      <ContextModule.Provider
        // Provide all the methods and values defined above
        value={{
          value,
          setValue,
        }}>
        {children}
      </ContextModule.Provider>
    );
  }
}

// Dont Change anything below this line

export {ContextProvider};
export const ContextConsumer = ContextModule.Consumer;
export default ContextModule;
