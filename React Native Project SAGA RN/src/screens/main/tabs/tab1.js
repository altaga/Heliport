import AsyncStorage from "@react-native-async-storage/async-storage";
import { ethers } from "ethers";
import React, { Component } from "react";
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  Image,
} from "react-native";
import IconFontAwesome from "react-native-vector-icons/FontAwesome";
import IconFontAwesome6 from "react-native-vector-icons/FontAwesome6";
import IconIonicons from "react-native-vector-icons/Ionicons";
import { abiDataFeeds } from "../../../contractsETH/dataFeeds";
import GlobalStyles from "../../../styles/styles";
import { dataFeedContractPolygon } from "../../../utils/constants";
import ContextModule from "../../../utils/contextModule";

function arraySum(array) {
  return array.reduce((accumulator, currentValue) => {
    return accumulator + currentValue;
  }, 0);
}

class Tab1 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      refresh: Math.random(),
      refreshing: false,
      heliport: false,
    };
  }
  static contextType = ContextModule;

  async refresh() {
    this.setState({
      refreshing: true,
    });
    try {
      await this.getUSD();
      await this.getBalances();
      await this.storeChains(this.context.value.networks);
    } catch (e) {
      console.log(e);
    }
    this.setState({
      refreshing: false,
      refresh: Math.random(),
    });
  }

  async getBalances() {
    let delay = -500;
    const promises = this.context.value.networks[0].tokens.map((item) => {
      delay += 500;
      return new Promise((resolve) => setTimeout(resolve, delay)).then(
        async () => await item.getBalance(this.context.value.publicKey)
      );
    });
    const promises2 = this.context.value.networks
      .slice(1)
      .map(async (network) => {
        let delayTemp = -500;
        return await Promise.all(
          network.tokens.map((token) => {
            delayTemp += 500;
            return new Promise((resolve) =>
              setTimeout(resolve, delayTemp)
            ).then(
              async () =>
                await token.getBalance(this.context.value.ethPublicKey)
            );
          })
        );
      });
    const Promises = [...promises, ...promises2];
    await Promise.all(Promises);
  }

  async getUSD() {
    const provider = new ethers.providers.JsonRpcProvider(
      "https://polygon.llamarpc.com"
    );
    const dataFeeds = new ethers.Contract(
      dataFeedContractPolygon,
      abiDataFeeds,
      provider
    );
    const feedsUSD = await dataFeeds.getLatestPrices();
    const usdPrices = feedsUSD[0].map(
      (item, index) => parseFloat(item) * Math.pow(10, -feedsUSD[1][index])
    );
    const res = {
      BNB: usdPrices[3],
      WBNB: usdPrices[3],
      DAI: usdPrices[5],
      ETH: usdPrices[8],
      MATIC: usdPrices[10],
      WMATIC: usdPrices[10],
      SOL: usdPrices[11],
      USDT: usdPrices[13],
      USDC: usdPrices[12],
      WETH: usdPrices[8],
      xDAI: usdPrices[5],
    };
    const tokensIDs = this.context.value.networks.map((network) =>
      network.tokens.map((token) => token.symbol)
    );
    let jsonTokens = [];
    let counter = 0;
    tokensIDs.flat().forEach((item) => {
      jsonTokens.push(res[item]);
    });
    this.context.value.networks.forEach((network) => {
      network.tokens.forEach((token) => {
        token.setUSD(jsonTokens[counter++]);
      });
    });
  }

  async storeChains(chains) {
    try {
      await AsyncStorage.setItem("chains", JSON.stringify({ chains }));
    } catch (e) {
      // saving error
    }
  }

  async componentDidMount() {
    const refreshCheck = Date.now();
    const lastRefresh = await this.getLastRefresh();
    if (refreshCheck - lastRefresh >= 1000 * 60 * 2.5) {
      await this.setLastRefresh();
      this.refresh();
    } else {
      console.log(
        `Next refresh Available: ${Math.round(
          (1000 * 60 * 2.5 - (refreshCheck - lastRefresh)) / 1000
        )} Seconds`
      );
    }
  }

  async getLastRefresh() {
    try {
      const session = await AsyncStorage.getItem("lastRefresh");
      if (!session) throw "Set First Date";
      return parseInt(session);
    } catch (err) {
      const lastRefresh = 0;
      await AsyncStorage.setItem("lastRefresh", lastRefresh.toString());
      return lastRefresh;
    }
  }

  async setLastRefresh() {
    const lastRefresh = Date.now();
    await AsyncStorage.setItem("lastRefresh", lastRefresh.toString());
  }

  render() {
    return (
      <View
        style={{
          width: Dimensions.get("window").width,
        }}
        key={this.state.refresh}
      >
        <View
          style={{
            justifyContent: "space-evenly",
            alignItems: "center",
            height: "40%",
          }}
        >
          {this.props.peripheral !== null && (
            <View
              style={{
                position: "absolute",
                right: 10,
                top: 10,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Pressable
                onPress={() => this.props.navigation.navigate("Heliport")}
                style={GlobalStyles.singleButton}
              >
                <IconFontAwesome6
                  name="helicopter-symbol"
                  size={40}
                  color={"white"}
                />
              </Pressable>
              <Text
                style={[GlobalStyles.singleButtonText, { textAlign: "center" }]}
              >{`Heliport\nAvailable`}</Text>
            </View>
          )}
          {this.context.value.nftSelected === "" ? (
            <IconFontAwesome
              style={{
                backgroundColor: `#${this.context.value.ethPublicKey.substring(
                  2,
                  8
                )}77`,
                borderRadius: 100,
              }}
              name="user-circle"
              size={100}
            />
          ) : (
            <Image
              style={{
                width: 100,
                height: 100,
              }}
              resizeMode="contain"
              source={{
                uri: this.context.value.nftSelected,
              }}
            />
          )}
          <Text style={{ fontSize: 38, color: "white" }}>
            ${""}
            {epsilonRound(
              arraySum(
                this.context.value.networks.map((network) =>
                  arraySum(
                    network.tokens.map((token) => token.balance * token.usd)
                  )
                )
              ),
              2
            )}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-evenly",
              alignItems: "center",
              width: "100%",
            }}
          >
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Pressable
                onPress={() => this.props.navigation.navigate("Send")}
                style={GlobalStyles.singleButton}
              >
                <IconIonicons
                  name="arrow-up-outline"
                  size={30}
                  color={"white"}
                />
              </Pressable>
              <Text style={GlobalStyles.singleButtonText}>Send</Text>
            </View>
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Pressable
                onPress={() => this.props.navigation.navigate("Connect")}
                style={GlobalStyles.singleButton}
              >
                <IconIonicons name="qr-code" size={30} color={"white"} />
              </Pressable>
              <Text style={GlobalStyles.singleButtonText}>Connect</Text>
            </View>
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Pressable
                onPress={() => this.props.navigation.navigate("Receive")}
                style={GlobalStyles.singleButton}
              >
                <IconIonicons
                  name="arrow-down-outline"
                  size={30}
                  color={"white"}
                />
              </Pressable>
              <Text style={GlobalStyles.singleButtonText}>Receive</Text>
            </View>
          </View>
        </View>
        <ScrollView
          refreshControl={
            <RefreshControl
              progressBackgroundColor="#00e599"
              refreshing={this.state.refreshing}
              onRefresh={async () => {
                await this.setLastRefresh();
                this.refresh();
              }}
            />
          }
          showsVerticalScrollIndicator={false}
          style={{
            height: "60%",
          }}
          contentContainerStyle={{
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          {this.context.value.networks.map((network, index) =>
            network.tokens.map((token, index2) =>
              token.balance > 0 || token.contract === "" ? (
                <View
                  key={"network:" + index + ":token:" + index2}
                  style={GlobalStyles.network}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-around",
                    }}
                  >
                    <View style={{ marginHorizontal: 20 }}>
                      <View>{token.icon}</View>
                      {token.contract !== "" && (
                        <View
                          style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                          }}
                        >
                          {network.tokens[0].subIcon}
                        </View>
                      )}
                    </View>
                    <View style={{ justifyContent: "center" }}>
                      <Text style={{ fontSize: 18, color: "white" }}>
                        {network.network}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "flex-start",
                        }}
                      >
                        <Text style={{ fontSize: 12 }}>
                          {epsilonRound(token.balance, 6)} {token.symbol}
                        </Text>
                        <Text style={{ fontSize: 12, color: "white" }}>
                          {`  -  ($${epsilonRound(token.usd, 2)} USD)`}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ marginHorizontal: 20 }}>
                    <Text>
                      ${epsilonRound(token.balance * token.usd, 2)} USD
                    </Text>
                  </View>
                </View>
              ) : (
                <React.Fragment
                  key={"network:" + index + ":token:" + index2}
                ></React.Fragment>
              )
            )
          )}
          {/*
            <Pressable
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <IconFeather name="list" size={18} color={"white"} />
              <Text
                style={{
                  fontSize: 18,
                }}
              >
                {"  "}Manage Networks and Tokens PENDING
              </Text>
            </Pressable>
            */}
        </ScrollView>
      </View>
    );
  }
}

export default Tab1;
