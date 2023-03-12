// Basic Imports
import React, { Component } from 'react';
import { Text, View, Image, Pressable, Dimensions, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Styles
import GlobalStyles from '../styles/styles';
// Assets
import logo from "../assets/logo.png";
// Utils
import reactAutobind from 'react-autobind';
import ContextModule from '../utils/contextModule';
import Header from '../components/header';
import NetInfo from "@react-native-community/netinfo";
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from 'react-native-elements';
import rotate from "../assets/rotate.png"

function espilonRound(num, zeros = 10000) {
    return Math.round((parseFloat(num) + Number.EPSILON) * zeros) / zeros;
}

Date.prototype.isValid = function () {
    // An invalid date object returns NaN for getTime() and NaN is the only
    // object not strictly equal to itself.
    return this.getTime() === this.getTime();
};

class Main extends Component {
    constructor(props) {
        super(props);
        this.state = {
            lastUpdate: null,
            network: false,
            lora: false,
            loading: false,
            rotate: 0,
        }
        reactAutobind(this)
        this.connector = null
        this.rotate = null
        this.temp = true
    }

    static contextType = ContextModule;

    async storeData(tag, value) {
        try {
            const jsonValue = JSON.stringify(value)
            await AsyncStorage.setItem(tag, jsonValue)
        } catch (e) {
            // saving error
        }
    }

    async getData(tag) {
        try {
            const value = await AsyncStorage.getItem(tag)
            if (value !== null) {
                return JSON.parse(value)
            }
        } catch (e) {
            // error reading value
        }
    }

    async getSolanaUSD() {
        return new Promise((resolve) => {
            var myHeaders = new Headers();
            myHeaders.append("accept", "application/json");
            myHeaders.append("Cookie", "__cf_bm=tpbLrsBftSraHYqrEJhFLgb_r21OxLKE4CVicrvEM9k-1677573652-0-AZhAq8gZwWZR44X5i1EO3NKrn9dCq48ASQBRZ5RVzaJLBZx8rpJmfGeEcoqVjy8IugAp/mNgw9aW4gNXhq/Qp9g=");

            var requestOptions = {
                method: 'GET',
                headers: myHeaders,
                redirect: 'follow'
            };

            fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", requestOptions)
                .then(response => response.text())
                .then(result => {
                    resolve(JSON.parse(result).solana.usd)
                })
                .catch(error => console.log('error', error));
        })
    }

    async getBalance(address) {
        return new Promise((resolve) => {
            var myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            var raw = JSON.stringify({
                "accountHashes": [
                    address.toBase58()
                ],
                "fields": [
                    "data",
                    "onchain"
                ]
            });
            var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: raw,
                redirect: 'follow'
            };
            fetch("https://api.solana.fm/v0/accounts", requestOptions)
                .then(response => response.text())
                .then(result => {
                    resolve(JSON.parse(result).result[0].onchain.lamports)
                })
                .catch(error => console.log('error', error));
        })
    }

    async updateWithNetwork() {
        let [sol, solUSDC, usdc, usdt] = await Promise.all([
            this.getBalance(this.context.value.pubKey),
            this.getSolanaUSD(),
            this.connector.getTokenAccountsByOwner(this.context.value.pubKey, { mint: this.context.value.splTokens[1].value }),
            this.connector.getTokenAccountsByOwner(this.context.value.pubKey, { mint: this.context.value.splTokens[2].value })
        ])
        let [usdcTemp, usdtTemp] = await Promise.all([
            this.connector.getTokenAccountBalance(usdc.value[0]?.pubkey),
            this.connector.getTokenAccountBalance(usdt.value[0]?.pubkey)
        ])
        usdc = usdcTemp
        usdt = usdtTemp
        let cryptoBalances = this.context.value.cryptoBalances;
        cryptoBalances.sol = sol / LAMPORTS_PER_SOL;
        cryptoBalances.usdc = usdc.value.uiAmount
        cryptoBalances.usdt = usdt.value.uiAmount
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);
        this.storeData('lastUpdate', today)
        this.storeData('sol', sol / LAMPORTS_PER_SOL)
        this.storeData('solUSDC', solUSDC)
        this.storeData('usdc', usdc.value.uiAmount)
        this.storeData('usdt', usdt.value.uiAmount)
        this.setState({
            lastUpdate: today,
            network: true
        })
        this.context.setValue({
            cryptoBalances,
            solUSDC
        })
    }

    async updateWithLora(data) {
        try {
            let solUSDC = data[1]
            let cryptoBalances = this.context.value.cryptoBalances;
            cryptoBalances.sol = data[0];
            cryptoBalances.usdc = data[2]
            cryptoBalances.usdt = data[3]
            const timeElapsed = Date.now();
            const today = new Date(timeElapsed);
            this.storeData('lastUpdate', today)
            this.storeData('sol', data[0])
            this.storeData('solUSDC', solUSDC)
            this.storeData('usdc', data[2])
            this.storeData('usdt', data[3])
            this.setState({
                lastUpdate: today
            })
            this.context.setValue({
                cryptoBalances,
                solUSDC
            })
        }
        catch {
            // Nothing
        }
    }

    componentDidMount() {
        this.props.navigation.addListener('focus', async () => {
            // Main Memory
            try {
                let lastUpdate = await this.getData('lastUpdate')
                this.setState({
                    lastUpdate: new Date(lastUpdate)
                })
                let cryptoBalances = this.context.value.cryptoBalances;
                cryptoBalances.sol = await this.getData('sol')
                cryptoBalances.usdc = await this.getData('usdc')
                cryptoBalances.usdt = await this.getData('usdt')
                let solUSDC = await this.getData('solUSDC')
                this.context.setValue({
                    cryptoBalances,
                    solUSDC
                })
            }
            catch {
                // Nothing
            }
            // Net Check
            NetInfo.fetch().then((state) => {
                if (state.isConnected) {
                    this.connector = new Connection("https://attentive-lingering-putty.solana-mainnet.discover.quiknode.pro/XXXXXXXXXXXXXXXXXX/")
                    this.updateWithNetwork();
                }
                this.props.peripheral ? this.setState({ lora: true }) : this.props.startScan();
            })

        })
    }

    componentDidUpdate(prevProps) {
        if (prevProps.peripheral !== this.props.peripheral && this.props.peripheral !== null) { // Detect RPC Found
            this.setState({
                lora: true
            })
        }
        if (prevProps.fail !== this.props.fail && this.props.fail !== null) { // Detect RPC Found
            this.setState({
                loading: false,
                rotate: 0
            })
        }
        if (prevProps.methodResponse !== this.props.methodResponse && this.props.methodResponse !== null) { // Detect Data
            if (this.props.methodResponse === "ok") {
                this.props.clearResponse()
                this.setState({
                    loading: false,
                    rotate: 0
                })
            }
            else {
                this.props.methodResponse.split(",").length === 4 && this.updateWithLora(this.props.methodResponse.split(","))
                this.props.clearResponse()
                this.setState({
                    loading: false,
                    rotate: 0
                })
            }
        }
    }

    componentWillUnmount() {

    }
    
    render() {
        return (
            <View>
                <Header navigation={this.props.navigation} />
                <SafeAreaView style={[{
                    flexDirection: 'column',
                    justifyContent: "space-evenly",
                    alignItems: 'center',
                    height: Dimensions.get("window").height - 90,
                    width: Dimensions.get("window").width,
                    backgroundColor: "#1E2423",
                    marginTop: 90, // Header Margin
                    backgroundColor: "#1E2423"
                }]}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: "space-between",
                        alignItems: 'center',
                    }}>
                        <Text style={{ color: colors.grey5, fontSize: 16, paddingLeft: 20, width: "70%", fontWeight: "bold" }}>
                            Available Balance
                        </Text>
                        {
                            this.state.network ?
                                <Pressable
                                    style={{ width: "30%" }}
                                    onPress={() => Linking.openURL(`https://solana.fm/address/${this.context.value.pubKey.toBase58()}`)}>
                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: "space-between",
                                        alignItems: 'center',
                                        width: "88%"
                                    }}>
                                        <Text style={{ color: "white", fontSize: 18 }}>
                                            Explorer
                                        </Text>
                                        <Icon name="sun" size={30} color="white" />
                                    </View>
                                </Pressable>
                                :
                                <View style={{ width: "30%" }}>
                                </View>
                        }
                    </View>
                    <Text style={{ color: "white", fontSize: 38, fontWeight: "bold" }}>
                        ${" "}
                        {
                            espilonRound(
                                (this.context.value.cryptoBalances.sol ?? 0) * (this.context.value.solUSDC ?? 0) +
                                (this.context.value.cryptoBalances.usdc ?? 0) +
                                (this.context.value.cryptoBalances.usdt ?? 0)
                                , 100)
                        }
                    </Text>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: "space-between",
                        alignItems: 'center',
                    }}>
                        <Text style={{ color: colors.grey5, fontSize: 16, paddingLeft: 20, width: "70%", fontWeight: "bold" }}>
                            Last Update:{"\n"}
                            {
                                this.state.loading ?
                                    "loading..."
                                    :
                                    this.state.lastUpdate ?
                                        (
                                            this.state.lastUpdate.isValid() ?
                                                this.state.lastUpdate.toLocaleDateString()
                                                :
                                                "Update Once"
                                        )
                                        :
                                        ""
                            }
                            {this.state.loading ?
                                ""
                                :
                                this.state.lastUpdate ?
                                    (this.state.lastUpdate.isValid() ?
                                        " - "
                                        :
                                        ""
                                    )
                                    :
                                    ""
                            }
                            {
                                this.state.loading ?
                                    ""
                                    :
                                    this.state.lastUpdate ?
                                        (
                                            this.state.lastUpdate.isValid() ?
                                                this.state.lastUpdate.toLocaleTimeString()
                                                :
                                                ""
                                        )
                                        :
                                        ""
                            }
                        </Text>
                        {
                            (this.state.network || this.state.lora) ?
                                <Pressable
                                    disabled={this.state.loading}
                                    style={{ width: "30%" }}
                                    onPress={() => {
                                        if (this.state.network) {
                                            this.updateWithNetwork()
                                        }
                                        else if (this.state.lora) {
                                            this.setState({
                                                loading: true
                                            })
                                            this.props.method("0002", "0003", "getBalances", [this.context.value.pubKey.toBase58()])
                                        }
                                    }}>
                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: "space-between",
                                        alignItems: 'center',
                                        width: "88%"
                                    }}>
                                        <Text style={{ color: "white", fontSize: 18, textAlign: "center" }}>
                                            {
                                                this.state.network ? `Network${"\n"}Update` : this.state.lora ? `Lora${"\n"}Update` : ""
                                            }
                                        </Text>
                                        <Image source={rotate} style={{ width: 30, height: 30, transform: [{ rotate: `${this.state.loading ? this.state.rotate : 0}deg` }] }} />
                                    </View>
                                </Pressable>
                                :
                                <View style={{ width: "30%" }}>
                                </View>
                        }
                    </View>
                    <Text style={{ color: "white", fontSize: 20, paddingTop: 20, textAlign: "left", width: "90%", fontWeight: "bold" }}>
                        All Assets
                    </Text>
                    <View style={{
                        flexDirection: 'column',
                        justifyContent: "space-between",
                        alignItems: 'center',
                        paddingBottom:20
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: "space-around",
                            alignItems: 'center',
                            backgroundColor: "#ffbc42",
                            height: Dimensions.get("window").height * 0.1,
                            width: Dimensions.get("window").width * 0.9, borderRadius: 10,
                            marginVertical: 10,
                            borderColor: "black",
                            borderWidth: 1
                        }}>
                            <View>{this.context.value.splTokens[0].icon}</View>
                            <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>
                                {espilonRound(this.context.value.cryptoBalances.sol ?? 0, 1000000)}
                            </Text>
                            <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>
                                SOL
                            </Text>
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: "space-around",
                            alignItems: 'center',
                            backgroundColor: "#ffbc42",
                            height: Dimensions.get("window").height * 0.1,
                            width: Dimensions.get("window").width * 0.9, borderRadius: 10,
                            marginVertical: 10,
                            borderColor: "black",
                            borderWidth: 1
                        }}>
                            <View>{this.context.value.splTokens[1].icon}</View>
                            <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>
                                {espilonRound(this.context.value.cryptoBalances.usdc ?? 0, 1000000)}
                            </Text>
                            <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>
                                USDC
                            </Text>
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: "space-around",
                            alignItems: 'center',
                            backgroundColor: "#ffbc42",
                            height: Dimensions.get("window").height * 0.1,
                            width: Dimensions.get("window").width * 0.9, borderRadius: 10,
                            marginVertical: 10,
                            borderColor: "black",
                            borderWidth: 1
                        }}>
                            <View>{this.context.value.splTokens[2].icon}</View>
                            <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>
                                {espilonRound(this.context.value.cryptoBalances.usdt ?? 0, 1000000)}
                            </Text>
                            <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>
                                USDT
                            </Text>
                        </View>
                    </View>
                </SafeAreaView>
            </View>

        )
    }
}

export default Main