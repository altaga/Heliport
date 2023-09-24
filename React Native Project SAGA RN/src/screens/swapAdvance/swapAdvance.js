import React, { Component } from "react";
import reactAutobind from "react-autobind";
import { View, Image, Pressable, Text, Dimensions } from "react-native";
import GlobalStyles from "../../styles/styles";
import ContextModule from "../../utils/contextModule";
import Renders from "../../assets/logo.png";
import QRCodeStyled from "react-native-qrcode-styled";

class SwapAdvance extends Component {
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
            
          </View>
        </View>
      </>
    );
  }
}

export default SwapAdvance;
