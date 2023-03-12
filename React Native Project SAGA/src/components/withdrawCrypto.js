import React, { Component } from 'react';
import reactAutobind from 'react-autobind';
import { View, Dimensions, Text, Pressable, StyleSheet } from 'react-native';
import NetInfo from "@react-native-community/netinfo";
import ContextModule from '../utils/contextModule';
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import Icon from 'react-native-vector-icons/Ionicons';
import IconMaterialComunity from "react-native-vector-icons/MaterialCommunityIcons"
import VirtualKeyboard from 'react-native-virtual-keyboard';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import EncryptedStorage from 'react-native-encrypted-storage';

const APP_IDENTITY = {
    uri: "https://www.notion.so", // https://puzzled-plume-e93.notion.site/
    icon: "/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F30d49ea0-038b-49b8-816d-b628cd6fe73e%2Fhei1port.png?table=block&id=a65e0f28-687b-4408-b99b-826134c8615c&spaceId=eb909c3e-5557-4034-83ea-e79b46696878&width=250&userId=&cache=v2"
};

const isBase58 = (value) => /^[A-HJ-NP-Za-km-z1-9]*$/.test(value);

class WithdrawCrypto extends Component {
    constructor(props) {
        super(props);
        this.state = {
            network: false,
            lora: false,
            text: "",
            loading: false,
            stage: 0,
            transaction: null
        }
        reactAutobind(this)
        this.connector = null
    }

    static contextType = ContextModule;

    async storeToken(authToken) {
        try {
            await EncryptedStorage.setItem(
                "authToken",
                JSON.stringify({
                    authToken
                })
            );
        } catch (error) {
            // There was an error on the native side
        }
    }

    async retrieveToken() {
        try {
            const session = await EncryptedStorage.getItem("authToken");
            if (session !== undefined) {
                return JSON.parse(session).authToken
            }
            else {
                return undefined
            }
        } catch (error) {
            return undefined
        }
    }

    async sendWithLora(data) {
        transact(async (wallet) => {
            try {
                await wallet.reauthorize({
                    auth_token: this.context.value.authToken,
                });
                let sendTokensTransaction = new Transaction({
                    feePayer: this.context.value.pubKey,
                    recentBlockhash: data,
                });
                sendTokensTransaction.add(
                    SystemProgram.transfer({
                        fromPubkey: this.context.value.pubKey,
                        toPubkey: this.context.value.to,
                        lamports: Math.round(LAMPORTS_PER_SOL * parseFloat(this.state.text === "" ? "0" : this.state.text)),
                    })
                );
                const [signature] = await wallet.signTransactions({
                    transactions: [sendTokensTransaction],
                });
                let isVerifiedSignature = signature.verifySignatures();
                console.log(`The signatures were verifed: ${isVerifiedSignature}`);
                this.setState({
                    stage: 3,
                    transaction: signature.serialize()
                }, () => this.props.method("0001", "0003", "sendTransaction", [signature.serialize()]))
            } catch (e) {
                // Auth token error try to get new one
                console.log("Wallet Error 1")
                console.log(e)
                this.setState({
                    loading: false
                })
            }
        });
    }

    async sendWithNet() {
        transact(async (wallet) => {
            try {
                await wallet.reauthorize({
                    auth_token: this.context.value.authToken,
                });
            } catch (e) {
                console.log("error wallet auth")
            }
            const latestBlockhash = await this.connector.getLatestBlockhash();
            let sendTokensTransaction = new Transaction({
                feePayer: this.context.value.pubKey,
                ...latestBlockhash,
            });
            sendTokensTransaction.add(
                SystemProgram.transfer({
                    fromPubkey: this.context.value.pubKey,
                    toPubkey: this.context.value.to,
                    lamports: Math.round(LAMPORTS_PER_SOL * parseFloat(this.state.text === "" ? "0" : this.state.text)),
                })
            );
            const [signature] = await wallet.signAndSendTransactions({
                transactions: [sendTokensTransaction],
            });
            console.log(signature);
        });
    }

    componentDidMount() {
        NetInfo.fetch().then((state) => {
            if (state.isConnected) {
                this.connector = new Connection("https://attentive-lingering-putty.solana-mainnet.discover.quiknode.pro/b1d2663c7bd9a4e5de5ce2deae05003d08cce50f/")
                this.setState({
                    network: true
                })
            }
            this.props.peripheral ? this.setState({ lora: true }) : this.props.startScan();
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
                loading: false
            })
        }
        if (prevProps.methodResponse !== this.props.methodResponse && this.props.methodResponse !== null) { // Detect Data
            let temp = this.props.methodResponse
            temp === "ok" ? setTimeout(() => {
                this.setState({
                    loading: false,
                    stage: 0,
                    transaction: null
                })
                this.props.startScan()
            }, 1000) : setTimeout(() => {
                this.setState({
                    stage: 2,
                }, () => this.sendWithLora(temp))
            }, 1000)
            this.props.clearResponse()
        }
    }

    componentWillUnmount() {
        this.context.setValue({
            to: ""
        })
    }

    render() {
        const styles = StyleSheet.create({
            buttonStyle: {
                backgroundColor: '#ffbc42',
                borderRadius: 50,
                padding: 8,
                marginTop: 8,
                width: Dimensions.get('window').width * .9,
                alignItems: 'center',
                fontSize: 24,
            },
            buttonStyleDisabled: {
                backgroundColor: '#ffbc4277',
            },
            bottomContent: {
                position: 'absolute',
                bottom: "20%"
            }
        });
        return (
            <View style={{ flex: 1 }}>
                <View style={{
                    flexDirection: 'row',
                    justifyContent:"center",
                    alignItems: 'center',
                    width: Dimensions.get("window").width,
                    paddingVertical: 5,
                    height: Dimensions.get("window").height*0.15,
                }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: 'white',
                        width: Dimensions.get("window").width - 38
                    }}>
                        {
                            this.context.value.to !== "" ?
                                <>
                                    To: {"\n"}
                                    {this.context.value.to.substring(0, 22)} {"\n"}
                                    {this.context.value.to.substring(22, 44)}
                                </>
                                :
                                <>
                                    Scan QR Address
                                </>
                        }

                    </Text>
                    <Pressable
                        style={{
                            width: 38
                        }}
                        onPress={() => this.props.navigation.navigate('Cam')}
                    >
                        <IconMaterialComunity name="qrcode-scan" size={38} color="#FFF" />
                    </Pressable>
                </View>
                <View style={{
                    paddingVertical: 10,
                    flexDirection: 'row',
                    justifyContent: "space-between",
                    alignItems: 'center',
                    width: Dimensions.get("window").width
                }}>
                    <Text
                        style={{
                            fontSize: 30,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            color: 'white'
                        }}>
                        {"                "}
                    </Text>
                    <Text style={{
                        fontSize: 30,
                        fontWeight: 'bold',
                        color: 'white'
                    }}>
                        {this.state.text === "" ?
                            0 : this.state.text} {" "}SOL
                    </Text>
                    <Pressable
                        onPress={() => this.setState({
                            text: (this.context.value.cryptoBalances.sol - 0.000005).toString()
                        })}
                    >
                        <Text
                            style={{
                                fontSize: 20,
                                fontWeight: 'bold',
                                textAlign: 'center',
                                color: 'white'
                            }}>
                            Max
                        </Text>
                    </Pressable>
                </View>
                <VirtualKeyboard
                    style={{ paddingVertical: 10 }}
                    decimal={true}
                    rowStyle={{
                        width: Dimensions.get('window').width,
                        borderRadius: 5,
                        margin: 10,
                    }}
                    cellStyle={
                        {
                            height: Dimensions.get('window').width / 8,
                            borderWidth: 0,
                            margin: 1,
                        }
                    }
                    colorBack={'black'}
                    color='white'
                    pressMode='string'
                    onPress={
                        (val) => this.setState({
                            text: val
                        })
                    }
                />
                {
                    !this.state.network && this.state.lora &&
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                        <Pressable
                            disabled={this.state.loading}
                            style={[styles.buttonStyle, this.state.loading && styles.buttonStyleDisabled]} onPress={() => {
                                if (this.state.stage === 3) {
                                    this.setState({
                                        loading: true,
                                    })
                                    this.props.method("0001", "0003", "sendTransaction", [this.state.transaction.serialize()])
                                }
                                else {
                                    this.setState({
                                        loading: true,
                                        stage: 1,
                                    })
                                    this.props.method("0002", "0003", "getBlock", [])
                                }
                            }}>
                            <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>
                                {
                                    this.state.loading ? "Sending..." : this.state.stage === 3 ? "Complete with LoRaWAN" : "Send with LoRaWAN"
                                }
                            </Text>
                        </Pressable>
                    </View>
                }
                {
                    this.state.network ?
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                        <Pressable
                            disabled={this.state.loading}
                            style={[styles.buttonStyle, this.state.loading && styles.buttonStyleDisabled]} onPress={() => this.sendWithNet()}>
                            <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>
                                {
                                    this.state.loading ? "Sending..." : "Send with Network"
                                }
                            </Text>
                        </Pressable>
                    </View>
                    :
                    <View/>
                }
            </View>
        );
    }
}

export default WithdrawCrypto;