import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { AccountLayout } from "@solana/spl-token";
import React, { Component } from 'react';
import { Dimensions, Linking, Platform, ScrollView, Text, View } from 'react-native';
import NetInfo from "@react-native-community/netinfo";
import ContextModule from '../utils/contextModule';
import reactAutobind from 'react-autobind';

function espilonRound(num) {
    return Math.round((parseFloat(num) + Number.EPSILON) * 10000) / 10000;
}

class Crypto extends Component {
    constructor(props) {
        super(props);
        this.state = {
            transactions: null,
            syncFlag: true
        }
        reactAutobind(this)
        this.axios = require('axios');
        this.CancelToken = require('axios').CancelToken;
        this.source = this.CancelToken.source();
        this.syncTimer = null;
        this.mounted = true
    }
    static contextType = ContextModule;

    async componentDidMount() {
        if (Platform.OS === 'android') {
            NetInfo.fetch().then(isConnected => {
                if (isConnected.isConnected) {
                    this.syncCrypto()
                    this.syncTimer = setInterval(async () => {
                        try {
                            let last = await this.checkLastTransaction()
                            if (this.state.syncFlag && last > this.context.value.lastBlockTime) {
                                this.mounted && this.setState({
                                    syncFlag: false
                                }, () => this.syncCrypto())
                            }
                        } catch (error) {
                            console.log(error)
                        }
                    }, 10000);
                }
            });
        }
    }

    async checkLastTransaction() {
        let historyBlock = 0
        let historyUSDCBlock = 0
        let historyUSDTBlock = 0
        try {
            const history = await this.context.value.connection.getConfirmedSignaturesForAddress2(this.context.value.cryptoAccounts.sol, { limit: 1 });
            historyBlock = history[0].blockTime
        } catch (error) {
            historyBlock = 0
        }
        try {
            if (this.context.value.cryptoAccounts.usdc === "") {
                const tokenUSDC = await this.context.value.connection.getTokenAccountsByOwner(this.context.value.wallet.publicKey, { mint: this.context.value.splTokens[1].value }, "finalized")
                const historyUSDC = await this.context.value.connection.getConfirmedSignaturesForAddress2(tokenUSDC.value[0].pubkey, { limit: 1 });
                historyUSDCBlock = historyUSDC[0].blockTime
            }
            else {
                const historyUSDC = await this.context.value.connection.getConfirmedSignaturesForAddress2(tokenUSDC.value[0].pubkey, { limit: 1 });
                historyUSDCBlock = historyUSDC[0].blockTime
            }
        } catch (error) {
            historyUSDCBlock = 0
        }
        try {
            if (this.context.value.cryptoAccounts.usdc === "") {
                const tokenUSDT = await this.context.value.connection.getTokenAccountsByOwner(this.context.value.wallet.publicKey, { mint: this.context.value.splTokens[2].value }, "finalized")
                const historyUSDT = await this.context.value.connection.getConfirmedSignaturesForAddress2(tokenUSDT.value[0].pubkey, { limit: 1 });
                historyUSDTBlock = historyUSDT[0].blockTime
            }
            else {
                const historyUSDT = await this.context.value.connection.getConfirmedSignaturesForAddress2(this.context.value.cryptoAccounts.usdt, { limit: 1 });
                historyUSDTBlock = historyUSDT[0].blockTime
            }
        } catch (error) {
            historyUSDTBlock = 0
        }
        return (Math.max(historyBlock, historyUSDCBlock, historyUSDTBlock))
    }

    async syncCrypto() {
        const balance = await this.context.value.connection.getBalance(this.context.value.wallet.publicKey);
        const tokenUSDC = await this.context.value.connection.getTokenAccountsByOwner(this.context.value.wallet.publicKey, { mint: this.context.value.splTokens[1].value }, "finalized")
        const tokenUSDT = await this.context.value.connection.getTokenAccountsByOwner(this.context.value.wallet.publicKey, { mint: this.context.value.splTokens[2].value }, "finalized")
        //console.log( AccountLayout.decode(tokenUSDC.value[0].account.data))
        let cryptoBalances = {
            sol: balance / LAMPORTS_PER_SOL,
            usdc: 0,
            usdt: 0
        }
        try {
            cryptoBalances.usdc = AccountLayout.decode(tokenUSDC.value[0].account.data).amount / 1000000
        }
        catch (error) {
            cryptoBalances.usdc = 0
        }
        try {
            cryptoBalances.usdt = AccountLayout.decode(tokenUSDT.value[0].account.data).amount / 1000000
        }
        catch (error) {
            cryptoBalances.usdt = 0
        }
        this.mounted && this.context.setValue({
            cryptoBalances
        })
        const history = await this.context.value.connection.getConfirmedSignaturesForAddress2(this.context.value.wallet.publicKey, { limit: 100 });
        let historyUSDC = []
        let historyUSDT = []
        try {
            historyUSDC = await this.context.value.connection.getConfirmedSignaturesForAddress2(tokenUSDC.value[0].pubkey, { limit: 100 });
        } catch (error) {
            historyUSDC = []
        }
        try {
            historyUSDT = await this.context.value.connection.getConfirmedSignaturesForAddress2(tokenUSDT.value[0].pubkey, { limit: 100 });
        } catch (error) {
            historyUSDT = []
        }
        let cryptoAccounts = {
            sol: this.context.value.wallet.publicKey,
            usdc: "",
            usdt: ""
        }
        try {
            cryptoAccounts.usdc = tokenUSDC.value[0].pubkey
        }
        catch (error) {
            cryptoAccounts.usdc = ""
        }
        try {
            cryptoAccounts.usdt = tokenUSDT.value[0].pubkey
        }
        catch (error) {
            cryptoAccounts.usdt = ""
        }
        this.mounted && this.context.setValue({
            cryptoAccounts
        })
        let res = await Promise.all(history.map(async (item) => await this.context.value.connection.getTransaction(item.signature)))
        let resUSDC = await Promise.all(historyUSDC.map(async (item) => await this.context.value.connection.getTransaction(item.signature)))
        let resUSDT = await Promise.all(historyUSDT.map(async (item) => await this.context.value.connection.getTransaction(item.signature)))
        let USDCChecker = resUSDC.map((item) => item.transaction.signatures[0])
        let USDTChecker = resUSDT.map((item) => item.transaction.signatures[0])
        res = res.concat(resUSDC, resUSDT)
        res = res.filter((value, index) => {
            const _value = JSON.stringify(value);
            return index === res.findIndex(obj => {
                return JSON.stringify(obj) === _value;
            });
        });
        res = res.sort(function (a, b) {
            if (a.blockTime < b.blockTime) {
                return 1;
            }
            if (a.blockTime > b.blockTime) {
                return -1;
            }
            // a must be equal to b
            return 0;
        })
        res = res.slice(0, 10)
        let temp = []
        res.forEach(element => {
            let token = "SOL"
            let amount = 0
            if (element.meta.postTokenBalances.length > 0) {
                for (let index = 0; index < USDCChecker.length; index++) {
                    if (element.transaction.signatures[0] === USDCChecker[index]) {
                        token = "USDC"
                        break
                    }
                }
                for (let index = 0; index < USDTChecker.length; index++) {
                    if (element.transaction.signatures[0] === USDTChecker[index]) {
                        token = "USDT"
                        break
                    }
                }
                if (element.transaction.message.accountKeys[0].toBase58() === this.context.value.wallet.publicKey.toBase58()) {
                    amount = Math.abs(element.meta.postTokenBalances[0].uiTokenAmount.uiAmount - element.meta.preTokenBalances[0].uiTokenAmount.uiAmount)
                }
                else {
                    if (element.meta.preTokenBalances[1] ? false : true) {
                        for (let index = 0; index < element.meta.postTokenBalances.length; index++) {
                            if (element.meta.postTokenBalances[index].owner === this.context.value.wallet.publicKey.toBase58()) {
                                amount = element.meta.postTokenBalances[index].uiTokenAmount.uiAmount
                            }
                        }
                    }
                    else {
                        amount = Math.abs(element.meta.postTokenBalances[1].uiTokenAmount.uiAmount - element.meta.preTokenBalances[1].uiTokenAmount.uiAmount)
                    }
                }
            }
            else {
                amount = Math.abs(element.meta.postBalances[0] - element.meta.preBalances[0]) / 1000000000
            }
            let mult = element.transaction.message.accountKeys[0].toBase58() === this.context.value.wallet.publicKey.toBase58() ? -1 : 1
            temp.push({
                from: element.transaction.message.accountKeys[0].toBase58(),
                to: element.transaction.message.accountKeys[1].toBase58(),
                pay: element.transaction.message.accountKeys.map((item) => item.toBase58() === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr").indexOf(true) > -1,
                token,
                amount: amount * mult,
                blockTime: element.blockTime,
                signature: element.transaction.signatures[0],
                icon: token === "SOL" ? this.context.value.splTokens[0].icon : token === "USDC" ? this.context.value.splTokens[1].icon : this.context.value.splTokens[2].icon
            })
        });
        this.mounted && this.context.setValue({
            lastBlockTime: temp.length > 0 ? temp[0].blockTime : 0
        })
        this.mounted && this.setState({
            transactions: temp,
            syncFlag: true
        })
    }

    componentWillUnmount() {
        if (this.source) {
            this.source.cancel("Component got unmounted");
        }
        clearInterval(this.syncTimer)
        this.mounted = false
    }

    render() {
        const hr = function () {
            return <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 24, paddingBottom: 20 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#8883ff' }} />
                <View>
                    <Text style={{ width: 50, textAlign: 'center', color: "#8883ff" }}>•</Text>
                </View>
                <View style={{ flex: 1, height: 1, backgroundColor: '#8883ff' }} />
            </View>
        }
        return (
            <View style={{ flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "white", fontSize: 22, paddingTop: 0 }}>
                    Address
                </Text>
                <Text style={{ color: "blue", textDecorationLine: "underline", fontSize: 22, textAlign: "center" }} onPress={() => Linking.openURL(`https://solscan.io/account/${this.context.value.wallet.publicKey.toBase58()}`)}>
                    {
                        this.context.value.wallet.publicKey.toBase58().substring(0, 22) +
                        "\n" +
                        this.context.value.wallet.publicKey.toBase58().substring(22, 44)
                    }
                </Text>
                <Text style={{ color: "white", fontSize: 22, paddingTop: 20 }}>
                    Assets
                </Text>
                <Text style={{ color: "white", fontSize: 22, textAlign: "center" }}>
                    <View style={{ paddingTop: 30 }} />
                    {this.context.value.splTokens[0].icon}
                    {" "}
                    {espilonRound(this.context.value.cryptoBalances.sol)}
                    {" "}
                    SOL
                    {
                        this.context.value.cryptoBalances.usdc > 0 &&
                        <>
                            {"\n"}
                            <View style={{ paddingTop: 30 }} />
                            {this.context.value.splTokens[1].icon}
                            {" "}
                            {this.context.value.cryptoBalances.usdc}
                            {" "}
                            USDC

                        </>
                    }
                    {
                        this.context.value.cryptoBalances.usdt > 0 &&
                        <>
                            {"\n"}
                            <View style={{ paddingTop: 30 }} />
                            {this.context.value.splTokens[2].icon}
                            {" "}
                            {this.context.value.cryptoBalances.usdt}
                            {" "}
                            USDT
                        </>
                    }
                </Text>
                {
                    hr()
                }
                <Text style={{ color: "white", fontSize: 24 }}>
                    Transactions
                </Text>
                <View style={{ height: Dimensions.get("window").height * 0.25 }}>
                    <ScrollView>
                        {
                            this.state.transactions && this.state.transactions.map((item, index) =>
                                <View key={index} style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingTop: 10, width: Dimensions.get("window").width - 80 }}>
                                    <Text style={{ color: "white", fontSize: 20, textAlign: "center" }}>
                                        {item.pay ? "Solana Pay" : "Transfer"}
                                    </Text>
                                    <Text style={{ color: item.amount >= 0 ? "green" : "red", fontSize: 20, textAlign: "center" }}>
                                        {item.icon} {" "}
                                        {Math.abs(espilonRound(parseFloat(item.amount)))}
                                    </Text>
                                    <Text style={{ color: "white", fontSize: 20, textAlign: "center", }}>
                                        <Text>
                                            {"Date\n"}
                                        </Text>
                                        {
                                            new Date(item.blockTime * 1000).toLocaleDateString()
                                        }
                                    </Text>
                                </View>
                            )
                        }
                    </ScrollView>
                </View>
            </View>
        );
    }
}

export default Crypto;