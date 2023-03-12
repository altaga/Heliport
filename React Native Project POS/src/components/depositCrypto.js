import React, { Component } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ContextModule from '../utils/contextModule';
import QRCode from 'react-native-qrcode-svg';
import { Dimensions } from 'react-native';
import reactAutobind from 'react-autobind';
import NetInfo from "@react-native-community/netinfo";
import { Connection } from '@solana/web3.js';

class DepositCrypto extends Component {
    constructor(props) {
        super(props);
        this.state = {
            lastUpdate: null,
            network: false,
            lora: false,
            loading: false,
        }
        reactAutobind(this)
        this.connector = null
    }

    static contextType = ContextModule;

    async updateWithNetwork() {

    }

    async updateWithLora(data) {
        this.context.setValue({
            transaction: data
        }, () => this.props.navigation.navigate('Receipt'))
    }

    componentDidMount() {
        NetInfo.fetch().then((state) => {
            if (state.isConnected) {
                this.connector = new Connection("https://attentive-lingering-putty.solana-mainnet.discover.quiknode.pro/b1d2663c7bd9a4e5de5ce2deae05003d08cce50f/")
                this.updateWithNetwork();
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
            console.log(this.props.methodResponse)
            this.props.methodResponse.split(",").length === 2 && this.updateWithLora(this.props.methodResponse.split(","))
            this.props.clearResponse()
            this.setState({
                loading: false
            })
        }
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
            content: {
                alignItems: 'center',
                flex: 1,
                justifyContent: 'flex-start',
                backgroundColor: "#1E2423",
                borderTopWidth: 1,
                borderTopColor: `#ffbc42`,
                height: Dimensions.get("window").height - 90,
                marginTop: 90, // Header Margin

            }
        });
        return (
            <>
                <View style={{ justifyContent: "center", alignItems: "center" }}>
                    <View>
                        <Text style={{ fontSize: 24, fontWeight: "bold", color: "white", paddingVertical: 16, textAlign: "center" }}>
                            Recieve Solana{"\n"}or SPL Token
                        </Text>
                    </View>
                    <QRCode
                        value={this.context.value.pubKey.toBase58()}
                        size={200}
                        quietZone={10}
                        ecl="H"
                    />
                    <View>
                        <Text style={{ fontSize: 24, fontWeight: "bold", color: "white", paddingVertical: 16, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                            {
                                this.context.value.pubKey.toBase58().substring(0, 17) + "\n" + this.context.value.pubKey.toBase58().substring(this.context.value.pubKey.toBase58().length - 17, this.context.value.pubKey.toBase58().length)
                            }
                        </Text>
                    </View>
                    {
                        this.state.lora &&
                        <Pressable
                            disabled={this.state.loading}
                            style={[styles.buttonStyle, this.state.loading && styles.buttonStyleDisabled]}
                            onPress={() => {
                                if (this.state.network) {
                                    this.updateWithNetwork()
                                }
                                else if (this.state.lora) {
                                    this.setState({
                                        loading: true
                                    })
                                    this.props.method("0002", "0003", "getLastTransaction", [this.context.value.pubKey.toBase58()])
                                }
                            }}>
                            <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>

                                {
                                    this.state.loading ? "Loading Transaction..." : "Get Last Transaction"
                                }
                            </Text>
                        </Pressable>
                    }
                </View>
            </>
        );
    }
}

export default DepositCrypto;