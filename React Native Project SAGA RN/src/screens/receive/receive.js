import React, { Component } from "react";
import reactAutobind from "react-autobind";
import { Image, Text, View, Pressable } from "react-native";
import GlobalStyles from "../../styles/styles";
import ContextModule from "../../utils/contextModule";
import Renders from "../../assets/logo.png";
import SolanaPay from "../../assets/solanaPay.png"
import WalletConnect from "../../assets/wclogo.png"
import Sol from "../../assets/sol.png"
import Eth from "../../assets/eth.png"

class Receive extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    reactAutobind(this);
  }

  static contextType = ContextModule;

  componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);
    });
  }
  render() {
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
          <View
            style={[
              GlobalStyles.mainComplete,
              { justifyContent: "space-evenly", alignItems: "center" },
            ]}
          >
            <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                Solana Network
              </Text>
            <Pressable
              style={[GlobalStyles.buttonLogoStyle]}
              onPress={async () => {
                this.props.navigation.navigate("SolanaDeposit");
              }}
            >
              <Image
                resizeMode="contain"
                source={Sol}
                alt="Cat"
                style={{
                  width: "60%",
                  height:"70%"
                }}
              />
              <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                Solana Deposit
              </Text>
            </Pressable>
            <Pressable
              style={[GlobalStyles.buttonLogoStyle]}
              onPress={async () => {
                this.props.navigation.navigate("SolanaPayDeposit");
              }}
            >
              <Image
                resizeMode="contain"
                source={SolanaPay}
                alt="Cat"
                style={{
                  width: "60%",
                  height:"70%"
                }}
              />
              <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                Solana Pay
              </Text>
            </Pressable>
            <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                EVM Networks
              </Text>
            <Pressable
              style={[GlobalStyles.buttonLogoStyle]}
              onPress={async () => {
                this.props.navigation.navigate("EthereumDeposit");
              }}
            >
              <Image
                resizeMode="contain"
                source={Eth}
                alt="Cat"
                style={{
                  width: "60%",
                  height:"70%"
                }}
              />
              <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                EVM Deposit
              </Text>
            </Pressable>
            <Pressable
              style={[GlobalStyles.buttonLogoStyle]}
              onPress={async () => {
                this.props.navigation.navigate("WalletConnectDeposit");
              }}
            >
              <Image
                resizeMode="contain"
                source={WalletConnect}
                alt="Cat"
                style={{
                  width: "60%",
                  height:"70%"
                }}
              />
              <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                WalletConnect
              </Text>
            </Pressable>
          </View>
        </View>
      </>
    );
  }
}

export default Receive;
