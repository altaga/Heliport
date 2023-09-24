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

class CreatePin extends Component {
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

  async componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);
      const biometrics = new ReactNativeBiometrics();
    });
    this.props.navigation.addListener("blur", async () => {});
  }

  async storePIN() {
    try {
      await EncryptedStorage.setItem(
        "pin",
        JSON.stringify({
          pin: this.state.text,
        })
      );
    } catch (error) {
      // There was an error on the native side
    }
  }

  async changeText(val) {
    if (val.length <= 4) {
      this.setState({
        text: val,
      });
    } else {
      await this.resetKeyboard();
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
              height: "75%",
              justifyContent: "space-evenly",
              alignItems: "center",
              paddingTop: "10%",
            }}
          >
            <Text style={GlobalStyles.title}>Protect with a PIN</Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                paddingTop: "10%",
              }}
            >
              <Text
                style={{
                  color: "white",
                  width: Dimensions.get("window").width * 0.2,
                  textAlign: "center",
                  fontSize: 24,
                }}
              >
                {this.state.text.substring(0, 1) !== ""
                  ? this.state.text.substring(0, 1)
                  : "•"}
              </Text>
              <Text
                style={{
                  color: "white",
                  width: Dimensions.get("window").width * 0.2,
                  textAlign: "center",
                  fontSize: 24,
                }}
              >
                {this.state.text.substring(1, 2) !== ""
                  ? this.state.text.substring(1, 2)
                  : "•"}
              </Text>
              <Text
                style={{
                  color: "white",
                  width: Dimensions.get("window").width * 0.2,
                  textAlign: "center",
                  fontSize: 24,
                }}
              >
                {this.state.text.substring(2, 3) !== ""
                  ? this.state.text.substring(2, 3)
                  : "•"}
              </Text>
              <Text
                style={{
                  color: "white",
                  width: Dimensions.get("window").width * 0.2,
                  textAlign: "center",
                  fontSize: 24,
                }}
              >
                {this.state.text.substring(3, 4) !== ""
                  ? this.state.text.substring(3, 4)
                  : "•"}
              </Text>
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
          </View>
          <View
            style={{
              height: "25%",
              justifyContent:"space-around",
              alignItems:"center",
              paddingVertical:0
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
              disabled={this.state.loading || this.state.text.length !== 4}
              style={[
                GlobalStyles.buttonStyle,
                {
                  backgroundColor:
                    this.state.loading || this.state.text.length !== 4
                      ? "#00e59977"
                      : "#00e599",
                },
              ]}
              onPress={async () => {
                this.setState({
                  loading: true,
                });
                setTimeout(async () => {
                  await this.storePIN();
                  await this.setValueAsync({
                    step: 2,
                  });
                  this.context.value.biometricsAvailable
                    ? this.props.navigation.navigate("CreateBiometric")
                    : this.props.navigation.navigate("FinishSetup");
                }, 100);
              }}
            >
              <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                {this.state.loading ? "Setting Pin..." : "Set Pin"}
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
                this.props.navigation.navigate("Setup");
              }}
            >
              <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </>
      </View>
    );
  }
}

export default CreatePin;
