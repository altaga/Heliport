import React, { Component } from "react";
import { Image, Pressable, Text, View } from "react-native";
import simple from "../../../assets/jupyter.png";
import simpleETH from "../../../assets/uniswap.png";
import GlobalStyles from "../../../styles/styles";

class Tab3 extends Component {
  render() {
    return (
      <View
        style={{
          width: "100%",
          height: "100%",
          justifyContent: "space-evenly",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
          Solana Network
        </Text>
        <Pressable
          style={[GlobalStyles.buttonLogoStyle]}
          onPress={async () => {
            this.props.navigation.navigate("SwapSimple");
          }}
        >
          <Image
            resizeMode="contain"
            source={simple}
            alt="Cat"
            style={{
              width: "60%",
              height: "70%",
            }}
          />
          <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
          Jupiter Swap
          </Text>
        </Pressable>
        <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
          EVM Networks
        </Text>
        <Pressable
          style={[GlobalStyles.buttonLogoStyle]}
          onPress={async () => {
            this.props.navigation.navigate("SwapETHSimple");
          }}
        >
          <Image
            resizeMode="contain"
            source={simpleETH}
            alt="Cat"
            style={{
              width: "60%",
              height: "70%",
            }}
          />
          <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
          Uniswap Swap
          </Text>
        </Pressable>
      </View>
    );
  }
}

export default Tab3;
