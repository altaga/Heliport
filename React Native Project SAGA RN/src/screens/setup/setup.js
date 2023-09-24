// Basic Imports
import React, { Component } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";
// Styles
import GlobalStyles from "../../styles/styles";
// Assets
import BackImage from "../../assets/log-back.jpg";
import logo from "../../assets/logoStroke.png";
// Utils
import reactAutobind from "react-autobind";
import ReactNativeBiometrics from "react-native-biometrics";
import DeviceInfo from "react-native-device-info";
import ContextModule from "../../utils/contextModule";
import RNBootSplash from "react-native-bootsplash";

class Setup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
    };
    reactAutobind(this);
    this.biometrics = new ReactNativeBiometrics();
  }

  static contextType = ContextModule;

  async componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      RNBootSplash.hide({ fade: true });
      console.log(this.props.route.name);
      const biometricsAvailable = (await this.biometrics.isSensorAvailable())
        .available;
      this.context.setValue({
        biometricsAvailable,
      });
    });
    this.props.navigation.addListener("blur", async () => {});
  }

  render() {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ImageBackground
          style={[GlobalStyles.containerImage]}
          source={BackImage}
          resizeMode="cover"
        >
          <View
            style={{
              justifyContent: "space-evenly",
              alignItems: "center",
              height: "65%",
            }}
          >
            <Image
              source={logo}
              alt="Cat"
              style={{
                width: Dimensions.get("window").width * 0.5,
              }}
              resizeMode="contain"
            />
            <Text
              style={{
                fontSize: 28,
                textAlign: "center",
                marginHorizontal: 40,
                color: "white",
                fontFamily: "DMSans-Medium",
              }}
            >
              Effisend is a Mobile-First wallet, cash out ramp and Point of Sale
              Superapp.
            </Text>
          </View>
          <View
            style={{
              justifyContent: "space-evenly",
              alignItems: "center",
              height: "35%",
            }}
          >
            <Pressable
              style={[
                GlobalStyles.buttonStyle,
                {
                  marginTop: 0,
                  marginBottom: 0,
                },
              ]}
              onPress={async () => {
                this.props.navigation.navigate("CreateWallet");
              }}
            >
              <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                Create Wallet
              </Text>
            </Pressable>
            <Pressable
              style={[
                GlobalStyles.buttonStyle,
                {
                  backgroundColor: "#47a6cc",
                  marginTop: 0,
                  marginBottom: 0,
                },
              ]}
              onPress={async () => {
                this.props.navigation.navigate("ImportWallet");
              }}
            >
              <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                Import Wallet
              </Text>
            </Pressable>
            {DeviceInfo.getModel() === "Saga" && (
              <Pressable
                style={[
                  GlobalStyles.buttonStyle,
                  { backgroundColor: "#db00ff", marginTop: 0, marginBottom: 0 },
                ]}
                onPress={async () => {
                  this.props.navigation.navigate("ConnectWallet");
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
                >
                  Connect Wallet (SeedVault)
                </Text>
              </Pressable>
            )}
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }
}

export default Setup;
