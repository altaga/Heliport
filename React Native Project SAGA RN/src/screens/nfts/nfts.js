import React, { Component } from "react";
import reactAutobind from "react-autobind";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import Renders from "../../assets/logo.png";
import GlobalStyles from "../../styles/styles";
import ContextModule from "../../utils/contextModule";

// Tabs
import AsyncStorage from "@react-native-async-storage/async-storage";
import QRCodeStyled from "react-native-qrcode-styled";
import AppStateListener from "../../utils/appStateListener";

const BaseStateNFTS = {
  qr: false,
  animationActive: false,
  setAvatarActive: false,
  modal: false,
  reset: false,
  address: "",
};

class NFTS extends Component {
  constructor(props) {
    super(props);
    this.state = BaseStateNFTS;
    reactAutobind(this);
    this.animation = new Animated.Value(1);
  }

  static contextType = ContextModule;

  componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);
      this.setState(BaseStateNFTS);
    });
    this.props.navigation.addListener("blur", async () => {
      console.log(this.props.route.name);
      this.setState(BaseStateNFTS);
    });
  }

  async setStateAsync(value) {
    return new Promise((resolve) => {
      this.setState(
        {
          ...value,
        },
        () => resolve()
      );
    });
  }

  async resetCam() {
    await this.setStateAsync({ reset: true });
    await this.setStateAsync({ reset: false });
  }

  async fadeInOut() {
    await this.setStateAsync({ animationActive: true });
    await new Promise((res) => {
      new Animated.timing(this.animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => res());
    });
    await this.setStateAsync({ qr: !this.state.qr });
    await new Promise((res) => {
      new Animated.timing(this.animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => res());
    });
    await this.setStateAsync({ animationActive: false });
  }

  async storeNFTselected(nftSelected) {
    try {
      await AsyncStorage.setItem(
        "nftSelected",
        JSON.stringify({ nftSelected })
      );
    } catch (e) {
      // saving error
    }
  }

  render() {
    const item = this.props.route.params.nft;
    return (
      <>
        <AppStateListener navigation={this.props.navigation} />
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
            <View style={GlobalStyles.headerItem}></View>
            <View style={GlobalStyles.headerItem}>
              <Pressable
                style={GlobalStyles.buttonLogoutStyle}
                onPress={() => {
                  this.props.navigation.navigate("Main");
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
          <ScrollView
            style={[
              GlobalStyles.mainComplete,
              { width: Dimensions.get("window").width },
            ]}
            contentContainerStyle={{
              justifyContent: "space-evenly",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 24,
                fontWeight: "bold",
                flexShrink: 1,
                textAlign: "center",
                textAlignVertical: "center",
                height: Dimensions.get("window").height * 0.08,
              }}
            >
              {item.name}
            </Text>
            <Pressable
              disabled={this.state.animationActive}
              onPress={() => this.fadeInOut()}
            >
              <Animated.View
                ref={this.animation}
                style={{
                  opacity: this.animation,
                }}
              >
                <View style={[this.state.qr ? {} : { height: 0 }, {alignItems:"center"}]}>
                  <QRCodeStyled
                    maxSize={Dimensions.get("screen").width * 0.72}
                    data={JSON.stringify({
                      nftAddress: item.address,
                      address: this.context.value.publicKey.toString(),
                    })}
                    style={[
                      {
                        backgroundColor: "white",
                        borderRadius: 10,
                        transform: this.state.qr ? [] : [{ scale: 0 }],
                      },
                    ]}
                    errorCorrectionLevel="H"
                    padding={16}
                    pieceBorderRadius={4}
                    isPiecesGlued
                    color={"black"}
                  />
                </View>
                <View style={[!this.state.qr ? {} : { height: 0 }, {alignItems:"center"}]}>
                  <Image
                    style={{
                      width: Dimensions.get("window").width * 0.8,
                      height: Dimensions.get("window").width * 0.8,
                      transform: !this.state.qr ? [] : [{ scale: 0 }],
                    }}
                    resizeMode="contain"
                    source={{
                      uri: item.image,
                    }}
                  />
                </View>
              </Animated.View>
            </Pressable>
            <Text
              style={{
                color: "gray",
                fontSize: 18,
                fontWeight: "bold",
                marginTop: "4%",
              }}
            >
              {this.state.qr ? "Click to Show NFT" : "Click to Show QR"}
            </Text>
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                justifyContent: "space-evenly",
                alignItems: "center",
                marginTop: Dimensions.get("window").height * 0.04,
              }}
            >
              <Pressable
                style={[
                  GlobalStyles.buttonStyle,
                  { width: Dimensions.get("window").width * 0.45 },
                ]}
                onPress={async () => {
                  await this.storeNFTselected(item.image);
                  this.context.setValue({
                    nftSelected: item.image,
                  });
                  ToastAndroid.show(
                    capitalizeFirstLetter("New Avatar Ready!"),
                    ToastAndroid.LONG
                  );
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
                >
                  Set Avatar
                </Text>
              </Pressable>
              <Pressable
                style={[
                  GlobalStyles.buttonStyle,
                  { width: Dimensions.get("window").width * 0.45 },
                ]}
                onPress={() =>
                  this.props.navigation.navigate("NFTsend", { nft: item })
                }
              >
                <Text
                  style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
                >
                  Send
                </Text>
              </Pressable>
            </View>
            <View style={{ width: "90%" }}>
              <Text
                style={{
                  color: "#777",
                  fontSize: 24,
                  fontWeight: "bold",
                  flexShrink: 1,
                }}
              >
                Description
              </Text>
              <Text
                style={{
                  color: "white",
                  fontSize: 18,
                  fontWeight: "bold",
                  flexShrink: 1,
                }}
              >
                {item.description}
              </Text>
            </View>
          </ScrollView>
        </View>
      </>
    );
  }
}

export default NFTS;
