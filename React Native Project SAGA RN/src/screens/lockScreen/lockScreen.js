// Basic Imports
import React, { Component } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
// Styles
import GlobalStyles from "../../styles/styles";
// Utils
import reactAutobind from "react-autobind";
import ContextModule from "../../utils/contextModule";
// Solana
import ReactNativeBiometrics from "react-native-biometrics";
import EncryptedStorage from "react-native-encrypted-storage";
import VirtualKeyboard from "react-native-virtual-keyboard";
import Icon from "react-native-vector-icons/Entypo";
import RNBootSplash from "react-native-bootsplash";

class LockScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      biometrics: false,
      clear: false,
      text: "",
    };
    reactAutobind(this);
  }

  static contextType = ContextModule;

  async retrieveBiometricsFlag() {
    try {
      const session = await EncryptedStorage.getItem("biometrics");
      if (session) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);
      RNBootSplash.hide({ fade: true });
      const biometrics = new ReactNativeBiometrics();
      const check = await biometrics.isSensorAvailable();
      const check2 = await this.retrieveBiometricsFlag();
      this.setState({
        biometrics: check.available && check2,
      });
    });
    this.props.navigation.addListener("blur", async () => {});
    // Avoid return on lock screen
    this.props.navigation.addListener("beforeRemove", async (e) => {
      e.preventDefault();
    });
  }

  async checkPin(pin) {
    return new Promise(async (resolve) => {
      const session = await EncryptedStorage.getItem("pin");
      if (session) {
        if (JSON.parse(session).pin === pin) {
          resolve(true);
        }
        resolve(false);
      } else {
        resolve(false);
      }
    });
  }

  async checkBiometrics() {
    return new Promise(async (resolve) => {
      const rnBiometrics = new ReactNativeBiometrics();
      rnBiometrics
        .simplePrompt({ promptMessage: "Confirm fingerprint" })
        .then((resultObject) => {
          const { success } = resultObject;
          if (success) {
            resolve(true);
          } else {
            console.log("user cancelled biometric prompt");
            resolve(false);
          }
        })
        .catch(() => {
          console.log("biometrics failed");
          resolve(false);
        });
    });
  }

  async changeText(val) {
    if (val.length < 4) {
      this.setState({
        text: val,
      });
    }
    if (val.length === 4) {
      const flag = await this.checkPin(val);
      flag
        ? this.props.navigation.navigate("Main")
        : await this.resetKeyboard();
    }
  }

  resetKeyboard() {
    return new Promise((resolve, reject) => {
      this.setState(
        {
          clear: true,
        },
        () =>
          this.setState(
            {
              clear: false,
              text: "",
            },
            () => resolve("ok")
          )
      );
    });
  }

  render() {
    return (
      <View style={GlobalStyles.container}>
        <>
          <View
            style={{
              height: "100%",
              justifyContent: "space-evenly",
              alignItems: "center",
              paddingTop: "10%",
            }}
          >
            <Text style={GlobalStyles.title}>
              Unlock with PIN or Biometrics
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                paddingTop: "10%",
              }}
            >
              {[...Array(4).keys()].map((item, index) => (
                <Text
                  key={"pin:" + index}
                  style={{
                    color: "white",
                    width: Dimensions.get("window").width * 0.2,
                    textAlign: "center",
                    fontSize: 24,
                  }}
                >
                  {this.state.text.substring(index, index + 1) !== ""
                    ? "•"
                    : "·"}
                </Text>
              ))}
            </View>
            <VirtualKeyboard
              rowStyle={{
                width: Dimensions.get("window").width,
              }}
              cellStyle={{
                height: Dimensions.get("window").height / 10,
                borderWidth: 0,
                margin: 1,
              }}
              colorBack={"black"}
              color="white"
              pressMode="string"
              onPress={(val) => this.changeText(val)}
              clear={this.state.clear}
            />
            {this.context.value.biometrics && (
              <Pressable
                onPress={async () => {
                  const flag = await this.checkBiometrics();
                  flag && this.props.navigation.navigate("Main");
                }}
              >
                <Icon name="fingerprint" size={100} color={"white"} />
              </Pressable>
            )}
          </View>
        </>
      </View>
    );
  }
}

export default LockScreen;
