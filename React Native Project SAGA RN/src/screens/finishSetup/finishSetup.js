// Basic Imports
import React, { Component } from "react";
import { View, Pressable, Text, Image } from "react-native";
// Styles
import GlobalStyles from "../../styles/styles";
import logo from "../../assets/logoStroke.png";
// Utils
import reactAutobind from "react-autobind";
import ContextModule from "../../utils/contextModule";
// Solana

class FinishSetup extends Component {
  constructor(props) {
    super(props);
    reactAutobind(this);
  }

  static contextType = ContextModule;

  async componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      console.log(this.props.route.name);

    });
    this.props.navigation.addListener("blur", async () => {});
  }

  render() {
    return (
      <View style={GlobalStyles.container}>
        <View
          style={{
            height: "80%",
            justifyContent: "center",
            alignItems: "center",
            paddingTop:"25%"
          }}
        >
          <Image
            source={logo}
            alt="Cat"
            style={{
              width: 512 * 0.3,
              height: 512 * 0.3,
              marginVertical: 20,
            }}
          />
          <Text style={[GlobalStyles.title, { marginVertical: 20 }]}>
            All Done!
          </Text>
          <Text style={[GlobalStyles.description, { marginVertical: 20 }]}>
            Start your decentralized economy with this wallet
          </Text>
        </View>
        <View
          style={{
            height: "20%",
            justifyContent: "space-evenly",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {[...Array(this.context.value.biometricsAvailable ? 4 : 3)].map(
              (item, index) => (
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
              )
            )}
          </View>
          <Pressable
            style={[
              GlobalStyles.buttonStyle,
              {
                backgroundColor: "#00e599",
              },
            ]}
            onPress={async () => {
              this.props.navigation.navigate("SplashLoading");
            }}
          >
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
              Finish
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

export default FinishSetup;
