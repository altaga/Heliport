import React, { Component } from "react";
import reactAutobind from "react-autobind";
import { Image, Pressable, Text, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Renders from "../../assets/logo.png";
import GlobalStyles from "../../styles/styles";
import ContextModule from "../../utils/contextModule";

// Tabs
import AppStateListener from "../../utils/appStateListener";
import Tab1 from "./tabs/tab1";
import Tab3 from "./tabs/tab3";
import Tab2 from "./tabs/tab2";
import RNBootSplash from "react-native-bootsplash";

const BaseStateMain = {
  tab: 0,
};

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = BaseStateMain;
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
                  this.props.navigation.navigate("SplashLoading");
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 18, fontWeight: "bold" }}
                >
                  Lock
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={GlobalStyles.main}>
            {this.state.tab === 0 && (
              <Tab1 {...this.props} />
            )}
            {this.state.tab === 1 && (
              <View style={{ marginHorizontal: 20 }}>
                {<Tab2 navigation={this.props.navigation} />}
              </View>
            )}
            {this.state.tab === 2 && (
              <Tab3 navigation={this.props.navigation} />
            )}
          </View>
          <View style={GlobalStyles.footer}>
            <Pressable
              style={[
                this.state.tab === 0
                  ? GlobalStyles.selectorSelected
                  : GlobalStyles.selector,
              ]}
              onPress={() =>
                this.setState({
                  tab: 0,
                })
              }
            >
              <Icon
                name="account-balance-wallet"
                size={26}
                color={this.state.tab === 0 ? "black" : "white"}
              />
              <Text
                style={
                  this.state.tab === 0
                    ? GlobalStyles.selectorSelectedText
                    : GlobalStyles.selectorText
                }
              >
                Wallet
              </Text>
            </Pressable>
            <Pressable
              style={[
                this.state.tab === 1
                  ? GlobalStyles.selectorSelected
                  : GlobalStyles.selector,
              ]}
              onPress={() =>
                this.setState({
                  tab: 1,
                })
              }
            >
              <Icon
                name="image"
                size={26}
                color={this.state.tab === 1 ? "black" : "white"}
              />
              <Text
                style={
                  this.state.tab === 1
                    ? GlobalStyles.selectorSelectedText
                    : GlobalStyles.selectorText
                }
              >
                NFTs
              </Text>
            </Pressable>
            <Pressable
              style={[
                this.state.tab === 2
                  ? GlobalStyles.selectorSelected
                  : GlobalStyles.selector,
              ]}
              onPress={() =>
                this.setState({
                  tab: 2,
                })
              }
            >
              <Icon
                name="swap-vert"
                size={26}
                color={this.state.tab === 2 ? "black" : "white"}
              />
              <Text
                style={
                  this.state.tab === 2
                    ? GlobalStyles.selectorSelectedText
                    : GlobalStyles.selectorText
                }
              >
                Swap
              </Text>
            </Pressable>
          </View>
        </View>
      </>
    );
  }
}

export default Main;
