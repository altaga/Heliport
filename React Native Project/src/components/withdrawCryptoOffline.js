import React, { Component } from 'react';
import { View, Text, Dimensions, Pressable, StyleSheet, Platform, PermissionsAndroid } from 'react-native';
import NetInfo from "@react-native-community/netinfo";
import Icon from 'react-native-vector-icons/Ionicons';
import VirtualKeyboard from 'react-native-virtual-keyboard';
import BT from '../utils/bt';
import ContextModule from '../utils/contextModule';
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, sendAndConfirmRawTransaction, SystemProgram, Transaction } from '@solana/web3.js';
import { sign } from 'tweetnacl';
import EncryptedStorage from 'react-native-encrypted-storage';

class WithdrawCryptoOffline extends Component {
    constructor(props) {
        super(props);
        this.state = {
            amount: "",
            text: "",
            btDev: false,
            network: false,
            device: null,
            command: "",
            recentBlockhash: "",
            buttonState: "Send with LoRaWAN",
            buttonState2: "Send with Network"
        }
    }

    static contextType = ContextModule;

    componentDidMount() {
        if (Platform.OS === 'android') {
            NetInfo.fetch().then(isConnected => {
                console.log(isConnected)
                this.setState({
                    network: isConnected.isConnected
                })
            });
            PermissionsAndroid.requestMultiple(
                [
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.CAMERA
                ]
            ).then((result) => {
                if (result['android.permission.BLUETOOTH_SCAN']
                    && result['android.permission.BLUETOOTH_CONNECT']
                    && result['android.permission.CAMERA']
                    === 'granted') {
                    this.setState({
                        bt: true
                    })
                }
            });
        }
    }

    async sendWithLora() {
        this.setState({
            buttonState: "Sending..."
        })
        const str = Buffer.from("getBlock", "utf-8");
        let len = Buffer.from([str.length.toString(16)], "hex")
        this.state.device.write(len)
        this.state.device.write(str)
        console.log("PreHash:" + this.state.recentBlockhash)
        const temp = this.state.recentBlockhash
        let checkHash = null
        checkHash = await new Promise((resolve, reject) => setInterval(() => {
            if (temp !== this.state.recentBlockhash) {
                resolve("ok")
                clearInterval(checkHash)
            }
        }, 1000))
        console.log("PostHash:" + this.state.recentBlockhash.replace("\n", ""))
        const session = await EncryptedStorage.getItem("userWallet");
        if (session !== undefined) {
            let secretKey1 = Uint8Array.from(JSON.parse(session).wallet.split(','))
            let payer = Keypair.fromSecretKey(secretKey1);
            let transaction = new Transaction({
                recentBlockhash: this.state.recentBlockhash.replace("\n", "").replace("\r", ""),
                feePayer: payer.publicKey,
            });

            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: payer.publicKey,
                    toPubkey: this.context.value.to,
                    lamports: Math.round(LAMPORTS_PER_SOL * parseFloat(this.state.text)),
                })
            );

            let transactionBuffer = transaction.serializeMessage();
            let signature = sign.detached(transactionBuffer, payer.secretKey);
            transaction.addSignature(payer.publicKey, signature);
            let isVerifiedSignature = transaction.verifySignatures();
            console.log(`The signatures were verifed: ${isVerifiedSignature}`);
            len = Buffer.from(transaction.serialize().length.toString(16), "hex")
            let connection = await this.checkConnection(this.state.device)
            if (connection) {
                this.state.device.write(len)
                this.state.device.write(transaction.serialize())
            }
            this.setState({
                buttonState: "Send with LoRaWAN"
            })
        }
        else {
            console.log("nothing yet")
        }
    }
    async sendWithNet() {
        this.setState({
            buttonState2: "Sending..."
        })
        let connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        let recentBlockhash = await connection.getRecentBlockhash();
        const session = await EncryptedStorage.getItem("userWallet");
        if (session !== undefined) {
            let secretKey1 = Uint8Array.from(JSON.parse(session).wallet.split(','))
            let payer = Keypair.fromSecretKey(secretKey1);
            let transaction = new Transaction({
                recentBlockhash: recentBlockhash.blockhash,
                feePayer: payer.publicKey,
            });

            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: payer.publicKey,
                    toPubkey: this.context.value.to,
                    lamports: Math.round(LAMPORTS_PER_SOL * parseFloat(this.state.text)),
                })
            );

            let transactionBuffer = transaction.serializeMessage();
            let signature = sign.detached(transactionBuffer, payer.secretKey);
            transaction.addSignature(payer.publicKey, signature);
            let isVerifiedSignature = transaction.verifySignatures();
            console.log(`The signatures were verifed: ${isVerifiedSignature}`);
            let res = await sendAndConfirmRawTransaction(connection, transaction.serialize());
            console.log(res)
            this.setState({
                buttonState2: "Send with Network"
            })
        }
        else {
            console.log("nothing yet")
        }
    }

    async checkConnection(device) {
        let connection = await device.isConnected();
        if (!connection) {
            connection = await device.connect();
        }
        return connection
    }

    componentWillUnmount() {

    }

    render() {
        const styles = StyleSheet.create({
            buttonStyle: {
                backgroundColor: '#ffbc42',
                borderRadius: 50,
                padding: 8,
                marginTop: 8,
                width: Dimensions.get('window').width * .8,
                alignItems: 'center',
                fontSize: 24,
            },
            buttonStyleDisabled: {
                backgroundColor: '#5c8074',
                borderRadius: 50,
                padding: 8,
                marginTop: 8,
                width: Dimensions.get('window').width * .8,
                alignItems: 'center',
                fontSize: 24,
            },
            bottomContent: {
                position: 'absolute',
                bottom: "20%"
            }
        });
        return (
            <View style={{ flex: 1 }}>
                <BT
                    datain={(recentBlockhash) => this.setState({
                        recentBlockhash
                    })}
                    device={(device) => this.setState({
                        device
                    })}
                    btDev={(btDev) => this.setState({
                        btDev
                    })} />
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: Dimensions.get("window").width
                }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: 'white',
                        marginTop: 30,
                        marginBottom: 30,
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
                        onPress={() => this.props.navigation.navigate('ScanQR')}
                    >
                        <Icon name="scan" size={38} color="#FFF" />
                    </Pressable>
                </View>
                <View style={{
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
                    decimal={true}
                    rowStyle={{
                        width: Dimensions.get('window').width,
                        borderRadius: 5,
                        margin: 10,
                    }}
                    cellStyle={
                        {
                            height: Dimensions.get('window').width / 7,
                            borderWidth: 0,
                            margin: 1,
                        }
                    }
                    colorBack={'black'}
                    color='white' pressMode='string'
                    onPress={
                        (val) => this.setState({
                            text: val
                        })
                    }
                />
                {
                    this.state.btDev &&
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 30 }}>
                        <Pressable
                            disabled={this.state.buttonState2 === "Sending..." || this.state.buttonState === "Sending..."}
                            style={this.state.buttonState === "Sending..." ? styles.buttonStyleDisabled : styles.buttonStyle} onPress={() => this.sendWithLora()}>
                            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
                                {
                                    this.state.buttonState
                                }
                            </Text>
                        </Pressable>
                    </View>
                }
                {
                    this.state.network &&
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10 }}>
                        <Pressable
                            disabled={this.state.buttonState2 === "Sending..." || this.state.buttonState === "Sending..."}
                            style={this.state.buttonState2 === "Sending..." ? styles.buttonStyleDisabled : styles.buttonStyle} onPress={() => this.sendWithNet()}>
                            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
                                {
                                    this.state.buttonState2
                                }
                            </Text>
                        </Pressable>
                    </View>
                }
            </View>
        );
    }
}

export default WithdrawCryptoOffline;