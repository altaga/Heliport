// Basic Imports
import React, { Component } from "react";
import { Pressable, Text, View } from "react-native";
// Styles
import GlobalStyles from "../../styles/styles";
// Utils
import reactAutobind from "react-autobind";
import ContextModule from "../../utils/contextModule";
// Solana
import ReactNativeBiometrics from "react-native-biometrics";
import EncryptedStorage from "react-native-encrypted-storage";
import Icon from "react-native-vector-icons/Entypo";

class CreateBiometrics extends Component {
  constructor(props) {
    super(props);
    this.state = {
      biometrics: false,
    };
    reactAutobind(this);
  }

  static contextType = ContextModule;

  async componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);
    });
    this.props.navigation.addListener("blur", async () => {});
  }

  async setBiometrics(value) {
    if (!value) {
      await EncryptedStorage.setItem("biometrics", JSON.stringify({ value }));
      return false;
    } // Check if false
    return new Promise(async (resolve) => {
      const rnBiometrics = new ReactNativeBiometrics();
      rnBiometrics
        .simplePrompt({ promptMessage: "Confirm fingerprint" })
        .then(async (resultObject) => {
          const { success } = resultObject;
          if (success) {
            await EncryptedStorage.setItem(
              "biometrics",
              JSON.stringify({ value })
            );
            resolve(true);
          } else {
            console.log("user cancelled biometric prompt");
            await EncryptedStorage.setItem(
              "biometrics",
              JSON.stringify({ value: false })
            );
            resolve(false);
          }
        })
        .catch(async () => {
          console.log("biometrics failed");
          await EncryptedStorage.setItem(
            "biometrics",
            JSON.stringify({ value: false })
          );
          resolve(false);
        });
    });
  }

  async setValueAsync(value) {
    return new Promise((resolve) => {
      this.context.setValue(
        {
          ...value,
        },
        () => resolve()
      );
    });
  }

  render() {
    return (
      <View style={GlobalStyles.container}>
        <>
          <View
            style={{
              height: "74%",
              justifyContent: "space-evenly",
              alignItems: "center",
            }}
          >
            <Text style={GlobalStyles.title}>Protect with Biometrics</Text>
            <Icon
              name="fingerprint"
              size={200}
              color={"white"}
              style={{
                marginVertical: "20%",
              }}
            />
          </View>

          <View
            style={{
              height: "30%",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical:10
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {[
                ...Array(this.context.value.biometricsAvailable ? 4 : 3).keys(),
              ].map((item, index) => (
                <Text
                  key={"dot:" + index}
                  style={{
                    color:
                      this.context.value.step >= index ? "white" : "#a3a3a3",
                    marginHorizontal: 20,
                    fontSize: 38,
                  }}
                >
                  {this.context.value.step >= index ? "•" : "·"}
                </Text>
              ))}
            </View>
            <Pressable
              disabled={this.state.loading}
              style={[
                GlobalStyles.buttonStyle,
                {
                  backgroundColor: this.state.loading ? "#00e59977" : "#00e599",
                },
              ]}
              onPress={async () => {
                this.setState({
                  loading: true,
                });
                setTimeout(async () => {
                  await this.setBiometrics(true);
                  await this.setValueAsync({
                    step: 3,
                  });
                  this.props.navigation.navigate("FinishSetup");
                }, 100);
              }}
            >
              <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                {this.state.loading ? "Setting Biometrics" : "Set Biometrics"}
              </Text>
            </Pressable>
            <Pressable
              disabled={this.state.loading}
              style={[
                GlobalStyles.buttonStyle,
                {
                  backgroundColor: this.state.loading ? "#db00ff77" : "#db00ff",
                },
              ]}
              onPress={async () => {
                await this.setBiometrics(false);
                await this.setValueAsync({
                  step: 3,
                });
                this.props.navigation.navigate("FinishSetup");
              }}
            >
              <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                Skip
              </Text>
            </Pressable>
          </View>
        </>
      </View>
    );
  }
}

export default CreateBiometrics;
