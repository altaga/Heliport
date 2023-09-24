import React, { Component } from "react";
import reactAutobind from "react-autobind";
import {
  View,
  Image,
  Pressable,
  Text,
  Dimensions,
  ToastAndroid,
} from "react-native";
import GlobalStyles from "../../styles/styles";
import ContextModule from "../../utils/contextModule";
import Renders from "../../assets/logo.png";
import QRCodeStyled from "react-native-qrcode-styled";
import Clipboard from "@react-native-clipboard/clipboard";
import IconIonicons from "react-native-vector-icons/Ionicons";

class SolanaDeposit extends Component {
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
            <View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "white",
                  textAlign: "center",
                }}
              >
                Receive Solana{"\n"}or SPL Tokens
              </Text>
            </View>
            <QRCodeStyled
              maxSize={Dimensions.get("screen").width * 0.85}
              data={this.context.value.publicKey.toBase58()}
              style={[
                {
                  backgroundColor: "white",
                  borderRadius: 10,
                },
              ]}
              errorCorrectionLevel="H"
              padding={16}
              //pieceSize={10}
              pieceBorderRadius={4}
              isPiecesGlued
              color={"black"}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "white",
                  textAlign: "center",
                  width: "85%",
                }}
              >
                {this.context.value.publicKey.toBase58().substring(0, 22) +
                  "\n" +
                  this.context.value.publicKey.toBase58().substring(22)}
              </Text>
              <Pressable
                onPress={() => {
                  Clipboard.setString(this.context.value.publicKey.toString());
                  ToastAndroid.show(
                    capitalizeFirstLetter("Address copied to clipboard"),
                    ToastAndroid.LONG
                  );
                }}
                style={{
                  width: "15%",
                  alignItems: "flex-start",
                }}
              >
                <IconIonicons name="copy" size={30} color={"white"} />
              </Pressable>
            </View>
            <Pressable
              style={GlobalStyles.buttonStyle}
              onPress={() => {
                this.props.navigation.goBack();
              }}
            >
              <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </>
    );
  }
}

export default SolanaDeposit;
