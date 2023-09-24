import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import React, { Component } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import GlobalStyles from "../../../styles/styles";
import { SolanaRPCs, icons } from "../../../utils/constants";
import ContextModule from "../../../utils/contextModule";
import AsyncStorage from "@react-native-async-storage/async-storage";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Tab2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      refreshing: false,
    };
    this.mount = true;
    this.connection = new Connection(
      clusterApiUrl("mainnet-beta"),
      "confirmed"
    );
  }

  static contextType = ContextModule;

  async componentDidMount() {
    const refreshCheck = Date.now();
    const lastRefresh = await this.getLastRefresh();
    if (refreshCheck - lastRefresh >= 1000 * 60 * 2.5) {
      await this.setLastRefresh();
      this.getNFTS();
    } else {
      console.log(
        `Next refresh Available: ${Math.round(
          (1000 * 60 * 2.5 - (refreshCheck - lastRefresh)) / 1000
        )} Seconds`
      );
    }
  }

  async getLastRefresh() {
    try {
      const session = await AsyncStorage.getItem("lastRefresh");
      if (!session) throw "Set First Date";
      return parseInt(session);
    } catch (err) {
      const lastRefresh = 0;
      await AsyncStorage.setItem("lastRefresh", lastRefresh.toString());
      return lastRefresh;
    }
  }

  async setLastRefresh() {
    const lastRefresh = Date.now();
    await AsyncStorage.setItem("lastRefresh", lastRefresh.toString());
  }

  async setSavedNFTS(nfts) {
    await AsyncStorage.setItem("nfts", JSON.stringify(nfts));
  }

  componentWillUnmount() {}

  async getParsedTokenAccountsByOwner() {
    // Solution with public RPC Providers
    try {
      let res = await new Promise(async (resolve) => {
        let accounts = []
        for (let i = 0; i < SolanaRPCs.length; i++) {
          try {
            this.connection = new Connection(SolanaRPCs[i], "confirmed");
            accounts = await this.connection.getParsedTokenAccountsByOwner(
              this.context.value.publicKey,
              {
                programId: TOKEN_PROGRAM_ID,
                filters: [
                  {
                    dataSize: 165,
                  },
                ],
              },
              "finalized"
            );
            break;
          } catch (e) {
            console.log(`error detected: ${e}`);
            continue;
          }
        }
        resolve(accounts);
      });
      return res;
    } catch (e) {
      console.log(e);
      return [];
    }
  }

  async getNFTS() {
    this.setState({
      refreshing: true,
    });
    let accounts = await this.getParsedTokenAccountsByOwner();
    console.log(accounts)
    const pitch = 1000;
    let delay = -pitch;
    // Filter 1
    let filterDecimalsAmount = accounts.value.filter(
      (item) =>
        parseInt(item.account.data.parsed.info.tokenAmount.amount) > 0 &&
        item.account.data.parsed.info.tokenAmount.decimals === 0
    );
    let promises = filterDecimalsAmount.map((item) => {
      delay += pitch;
      return new Promise(async (res) => {
        await wait(delay);
        const temp = await this.connection.getParsedAccountInfo(
          new PublicKey(item.account.data.parsed.info.mint)
        );
        const myObject = {
          address: item.account.data.parsed.info.mint,
          info: temp.value.data.parsed.info,
        };
        res(myObject);
      });
    });
    let res = await Promise.all(promises);
    // Filter 2
    const filterSupply = res.filter((item) => `${item.info.supply}` === "1");
    const nftOnlyAddress = filterSupply.map((item) => item.address);
    // Metaplex
    const keypair = Keypair.generate();
    const metaplex = new Metaplex(this.connection);
    metaplex.use(keypairIdentity(keypair));
    delay = -pitch;
    promises = nftOnlyAddress.map((item) => {
      delay += pitch;
      return new Promise(async (res) => {
        await wait(delay);
        const mintAddress = new PublicKey(item);
        const allNFTs = await metaplex.nfts().findByMint({ mintAddress });
        res(allNFTs);
      });
    });
    res = await Promise.all(promises);
    const solanaNFTS = res.map((item) => {
      return {
        address: item.address.toString(),
        name: item.json.name,
        description: item.json.description,
        image: item.json.image,
        symbol: item.json.symbol,
        icon: "sol",
        network: "Solana",
      };
    });
    const nfts = solanaNFTS.sort((a, b) => (a.name > b.name ? 1 : -1));
    await this.setSavedNFTS(nfts);
    this.context.setValue({
      nfts,
    });
    this.setState({
      refreshing: false,
    });
  }

  render() {
    return (
      <ScrollView
        refreshControl={
          <RefreshControl
            progressBackgroundColor="#00e599"
            refreshing={this.state.refreshing}
            onRefresh={async () => {
              await this.setLastRefresh();
              this.getNFTS();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
        style={{ width: Dimensions.get("window").width }}
        contentContainerStyle={{
          justifyContent: "space-evenly",
          flexWrap: "wrap",
          flexDirection: "row",
        }}
      >
        {this.context.value.nfts.map((item, index) => (
          <Pressable
            key={"nfts:" + index}
            style={{
              width: Dimensions.get("window").width * 0.4,
              height: Dimensions.get("window").width * 0.4,
              alignItems: "center",
              justifyContent: "space-evenly",
              backgroundColor: "#444",
              borderRadius: 30,
              marginTop: 20,
            }}
            onPress={() =>
              this.props.navigation.navigate("NFTS", { nft: item })
            }
          >
            <Image
              style={{ width: "90%", height: "90%" }}
              resizeMode="contain"
              source={{
                uri: item.image,
              }}
            />
            <View
              style={{
                position: "absolute",
                top: 10,
                right: 10,
              }}
            >
              {icons[item.icon]}
            </View>
            <Text
              style={{
                fontSize: 16,
                position: "absolute",
                bottom: 10,
                backgroundColor: "#000000aa",
                width: "90%",
                textAlign: "center",
                textAlignVertical: "center",
                height: "20%",
                borderRadius: 10,
                padding: 5,
              }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  }
}

export default Tab2;
