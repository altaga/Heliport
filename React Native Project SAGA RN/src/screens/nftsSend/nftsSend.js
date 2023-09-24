import React, { Component } from "react";
import reactAutobind from "react-autobind";
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from "react-native";
import Renders from "../../assets/logo.png";
import GlobalStyles from "../../styles/styles";
import ContextModule from "../../utils/contextModule";

// Tabs
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AccountLayout,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import { BigNumber, ethers } from "ethers";
import IconIonIcons from "react-native-vector-icons/Ionicons";
import checkMark from "../../assets/checkMark.png";
import AppStateListener from "../../utils/appStateListener";
import Cam from "./components/cam";
import CryptoSign from "./components/cryptoSign";
import CryptoSignSeedVault from "./components/cryptoSignSeedVault";

const BaseStateNFTsend = {
  stage: 0, // 0
  reset: false,
  address: "9Luc12KxoUfmEWSQoBbrprPqU76kfrQXkKUsZWoFY59G", // ""
  check: "Check",
  loading: false,
  modal: false,
  transaction: {},
  transactionDisplay: {
    kind: "solana_signTransaction",
    name: "DUMMY",
    decimals: 0,
    amount: 1,
    gas: 0,
  },
  explorerURL: "",
  status: "Processing...",
};

class NFTsend extends Component {
  constructor(props) {
    super(props);
    this.state = BaseStateNFTsend;
    reactAutobind(this);
    this.connection = new Connection(
      clusterApiUrl("mainnet-beta"),
      "confirmed"
    );
    this.mount = true;
  }

  static contextType = ContextModule;

  componentDidMount() {
    this.props.navigation.addListener("focus", async () => {
      console.log(`${this.props.route.name} focus`);
      this.mount = true;
      this.mount && this.setState(BaseStateNFTsend);
    });
    this.props.navigation.addListener("blur", async () => {
      console.log(`${this.props.route.name} blur`);
      await this.resetCam();
      this.setState(BaseStateNFTsend);
      this.mount = false;
    });
  }

  async signSolana(e) {
    this.mount &&
      this.setState({
        status: "Processing...",
        stage: 2,
        explorerURL: "",
      });
    try {
      const txnSignature = await this.connection.sendRawTransaction(e, {
        maxRetries: 5,
      });
      this.mount &&
        this.setState({
          explorerURL: `https://solana.fm/tx/${txnSignature}?cluster=mainnet-solanafmbeta`,
          status: "Confirmed",
        });
    } catch {
      ToastAndroid.show(
        capitalizeFirstLetter("There was an error signing the transaction"),
        ToastAndroid.LONG
      );
      this.mount && this.setState(BaseStateNFTsend);
    }
  }

  async checkTransfer() {
    this.mount &&
      this.setState({
        loading: true,
        check: "Checking...",
      });
    const { address, symbol } = this.props.route.params.nft;
    try {
      const mintAddress = new PublicKey(address);
      const destinationAddress = new PublicKey(this.state.address);
      const amount = BigNumber.from("1");
      const balance = BigNumber.from(
        (
          await this.connection.getBalance(this.context.value.publicKey)
        ).toString()
      );
      const tokenAccount = await this.connection.getTokenAccountsByOwner(
        this.context.value.publicKey,
        { mint: mintAddress },
        "finalized"
      );
      const minBalance = BigNumber.from(
        (await this.connection.getMinimumBalanceForRentExemption(0)).toString()
      );
      let tokenBalance = 0;
      try {
        tokenBalance = BigNumber.from(
          AccountLayout.decode(tokenAccount.value[0].account.data).amount
        );
      } catch (error) {
        ToastAndroid.show(
          capitalizeFirstLetter("Not enough token balance"),
          ToastAndroid.LONG
        );
        throw "Not enough token balance";
      }
      // To Address
      const tokenAccount2 = await getAssociatedTokenAddress(
        mintAddress,
        destinationAddress,
        (allowOwnerOffCurve = false),
        (programId = TOKEN_PROGRAM_ID),
        (associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID)
      );
      let isTokenAccountAlreadyMade = false;
      try {
        await getAccount(
          this.connection,
          tokenAccount2,
          "confirmed",
          TOKEN_PROGRAM_ID
        );
        isTokenAccountAlreadyMade = true;
      } catch {
        // Nothing
      }
      console.log(isTokenAccountAlreadyMade)
      // Legacy for Gas
      let transaction = new Transaction();
      if (!isTokenAccountAlreadyMade) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.context.value.publicKey,
            tokenAccount2,
            destinationAddress,
            mintAddress,
            TOKEN_PROGRAM_ID
          )
        );
      }
      transaction.add(
        createTransferInstruction(
          tokenAccount.value[0].pubkey,
          tokenAccount2,
          this.context.value.publicKey,
          amount
        )
      );
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash())
      .blockhash;;
      transaction.feePayer = this.context.value.publicKey;
      const gasFee = BigNumber.from(
        (await transaction.getEstimatedFee(this.connection)).toString()
      );
      const check = balance.sub(gasFee).gte(minBalance);
      if (!check) {
        ToastAndroid.show(
          capitalizeFirstLetter("Not enough SOL to keep the minimum balance"),
          ToastAndroid.LONG
        );
        throw "Not enough SOL to keep the minimum balance";
      }
      const check2 = tokenBalance.gte(amount);
      if (!check2) {
        ToastAndroid.show(
          capitalizeFirstLetter("Not enough Token balance"),
          ToastAndroid.LONG
        );
        throw "Not enough Token balance";
      }
      const check3 = balance.gte(gasFee);
      if (!check3) {
        ToastAndroid.show(
          capitalizeFirstLetter("Not enough Token balance"),
          ToastAndroid.LONG
        );
        throw "Not enough SOL balance";
      }
      this.mount &&
        this.setState({
          transactionDisplay: {
            kind: "solana_sendNFT",
            name: symbol,
            amount: 1,
            gas: ethers.utils.formatUnits(gasFee, 9),
          },
          transaction,
          check: check && check2 && check3 ? "Send" : "Check Again",
          loading: false,
        });
    } catch (e) {
      console.log(e);
      this.mount &&
        this.setState({
          loading: false,
          check: "Check Again",
        });
    }
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

  render() {
    const item = this.props.route.params.nft;
    const modalScale = 0.5;
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
          <Modal
            visible={this.state.modal}
            transparent={true}
            animationType="slide"
          >
            <View
              style={{
                alignSelf: "center",
                backgroundColor: "#1E2423",
                width: Dimensions.get("window").width * 0.94,
                height: Dimensions.get("window").height * modalScale,
                marginTop:
                  Dimensions.get("window").height * (0.99 - modalScale),
                borderWidth: 2,
                borderColor: `#00e599`,
                padding: 20,
                borderRadius: 25,
                justifyContent: "space-around",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 30,
                  width: "80%",
                }}
              >
                Transaction
              </Text>
              <View
                style={{
                  backgroundColor: `#00e599`,
                  height: 1,
                  width: "90%",
                  marginVertical: 10,
                }}
              />
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 26,
                  width: "100%",
                }}
              >
                {this.state.transactionDisplay.kind}
              </Text>
              <View
                style={{
                  backgroundColor: `#00e599`,
                  height: 1,
                  width: "90%",
                  marginVertical: 10,
                }}
              />
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 20,
                  width: "100%",
                }}
              >
                Amount:
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 24,
                  width: "100%",
                }}
              >
                {`${epsilonRound(this.state.transactionDisplay.amount, 8)}`}{" "}
                {this.state.transactionDisplay.name}
              </Text>
              <View
                style={{
                  backgroundColor: `#00e599`,
                  height: 1,
                  width: "90%",
                  marginVertical: 10,
                }}
              />
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 20,
                  width: "100%",
                }}
              >
                Gas:
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 24,
                  width: "100%",
                }}
              >
                {`${this.state.transactionDisplay.gas}`} Sol
              </Text>
              <View
                style={{
                  backgroundColor: `#00e599`,
                  height: 1,
                  width: "90%",
                  marginVertical: 10,
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <Pressable
                  style={[
                    GlobalStyles.singleModalButton,
                    {
                      width: "45%",
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      borderRightColor: "black",
                      borderRightWidth: 2,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                  onPress={() =>
                    this.mount &&
                    this.setState(
                      {
                        modal: false,
                      },
                      () => {
                        this.setState({
                          stage: 1,
                        });
                      }
                    )
                  }
                >
                  <Text style={[GlobalStyles.singleModalButtonText]}>
                    Accept
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    GlobalStyles.singleModalButton,
                    {
                      width: "45%",
                      alignItems: "center",
                      justifyContent: "center",
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    },
                  ]}
                  onPress={async () => {
                    await this.resetCam();
                    this.mount && this.setState(BaseStateNFTsend);
                  }}
                >
                  <Text style={[GlobalStyles.singleModalButtonText]}>
                    Reject
                  </Text>
                </Pressable>
              </View>
            </View>
          </Modal>
          {this.state.stage === 0 && (
            <ScrollView
              style={[
                GlobalStyles.mainComplete,
                { width: Dimensions.get("window").width },
              ]}
              contentContainerStyle={{
                justifyContent: "space-evenly",
                alignItems: "center",
                //height: "100%",
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
              <View>
                <Image
                  style={{
                    width: Dimensions.get("window").width * 0.8,
                    height: Dimensions.get("window").width * 0.8,
                  }}
                  resizeMode="contain"
                  source={{
                    uri: item.image,
                  }}
                />
              </View>
              <Text
                style={{
                  fontSize: 24,
                  color: "#FFF",
                  fontWeight: "bold",
                  textAlign: "left",
                  width: Dimensions.get("window").width * 0.9,
                  marginTop: 20,
                }}
              >
                Address
              </Text>
              <View
                style={{
                  width: Dimensions.get("screen").width,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ width: "90%" }}>
                  <TextInput
                    style={[GlobalStyles.input, { fontSize: 12 }]}
                    keyboardType="default"
                    value={this.state.address}
                    onChangeText={(value) =>
                      this.mount && this.setState({ address: value })
                    }
                  />
                </View>
                <Pressable
                  onPress={() => this.mount && this.setState({ stage: 4 })}
                  style={{ width: "10%" }}
                >
                  <IconIonIcons name="qr-code" size={30} color={"white"} />
                </Pressable>
              </View>
              <Pressable
                style={
                  !(this.state.address.length === 44) || this.state.loading
                    ? GlobalStyles.buttonStyleDisabled
                    : GlobalStyles.buttonStyle
                }
                onPress={() =>
                  this.state.check === "Send"
                    ? this.setState({
                        modal: true,
                      })
                    : this.checkTransfer()
                }
                disabled={
                  !(this.state.address.length === 44) || this.state.loading
                }
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 24,
                    fontWeight: "bold",
                  }}
                >
                  {this.state.check}
                </Text>
              </Pressable>
            </ScrollView>
          )}
          {this.state.stage === 1 && (
            <View style={GlobalStyles.mainComplete}>
              {this.context.value.kind === 0 ? (
                <CryptoSign
                  transaction={this.state.transaction}
                  cancelTrans={async () => {
                    await this.resetCam();
                    this.mount && this.setState(BaseStateNFTsend);
                  }}
                  signSolana={(e) => this.signSolana(e)}
                />
              ) : (
                <CryptoSignSeedVault
                  transaction={this.state.transaction}
                  cancelTrans={async () => {
                    await this.resetCam();
                    this.mount && this.setState(BaseStateNFTsend);
                  }}
                  signSolana={(e) => this.signSolana(e)}
                />
              )}
            </View>
          )}
          {this.state.stage === 2 && (
            <View style={GlobalStyles.mainComplete}>
              <View
                style={{
                  flex: 1,
                  flexDirection: "column",
                  justifyContent: "space-around",
                  alignItems: "center",
                }}
              >
                <Image
                  source={checkMark}
                  alt="check"
                  style={{ width: 200, height: 200 }}
                />
                <Text
                  style={{
                    textShadowRadius: 1,
                    fontSize: 28,
                    fontWeight: "bold",
                    color:
                      this.state.status === "Confirmed" ? "#00e599" : "#d820f9",
                  }}
                >
                  {this.state.status}
                </Text>
                <View
                  style={[
                    GlobalStyles.network,
                    { width: Dimensions.get("screen").width * 0.9 },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-around",
                    }}
                  >
                    <View style={{ marginHorizontal: 20 }}>
                      <Text style={{ fontSize: 20, color: "white" }}>
                        Solana
                      </Text>
                      <Text style={{ fontSize: 14, color: "white" }}>
                        {this.state.transactionDisplay.kind}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      marginHorizontal: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View style={{ marginHorizontal: 10 }}>
                      <Image
                        style={{
                          width: 30,
                          height: 30,
                        }}
                        resizeMode="contain"
                        source={{
                          uri: item.image,
                        }}
                      />
                    </View>
                    <Text>
                      {"1"} {this.state.transactionDisplay.name}
                    </Text>
                  </View>
                </View>
                <View>
                  <Pressable
                    style={[
                      this.state.explorerURL === ""
                        ? GlobalStyles.buttonStyleDisabled
                        : GlobalStyles.buttonStyle,
                      { marginBottom: 10 },
                    ]}
                    onPress={() => Linking.openURL(this.state.explorerURL)}
                    disabled={this.state.explorerURL === ""}
                  >
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        color: "white",
                        textAlign: "center",
                      }}
                    >
                      View on Explorer
                    </Text>
                  </Pressable>
                  <Pressable
                    style={
                      this.state.explorerURL === ""
                        ? GlobalStyles.buttonStyleDisabled
                        : GlobalStyles.buttonStyle
                    }
                    onPress={() => this.props.navigation.navigate("Main")}
                    disabled={this.state.explorerURL === ""}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 24,
                        fontWeight: "bold",
                      }}
                    >
                      Done
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
          {
            // Utils Components
          }
          {this.state.stage === 4 && (
            <View
              style={[
                GlobalStyles.mainComplete,
                { justifyContent: "space-evenly", alignItems: "center" },
              ]}
            >
              <View>
                <Text style={{ color: "white", fontSize: 28 }}>
                  Scan Address
                </Text>
              </View>
              <View
                style={{
                  height: Dimensions.get("screen").height * 0.6,
                  width: Dimensions.get("screen").width * 0.8,
                  marginVertical: 20,
                  borderColor: "#00e599",
                  borderWidth: 5,
                  borderRadius: 10,
                }}
              >
                <Cam
                  callback={(e) => {
                    console.log(e);
                    this.setState({
                      address: e,
                      stage: 0,
                      modal: false,
                    });
                  }}
                  reset={this.state.reset}
                />
              </View>
            </View>
          )}
        </View>
      </>
    );
  }
}

export default NFTsend;
