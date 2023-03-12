import React, { Component } from 'react';
import { SafeAreaView, StyleSheet, Text, Image, Pressable, View, Dimensions } from 'react-native';
import ContextModule from '../utils/contextModule';
import DepositCrypto from '../components/depositCrypto';
import Header from '../components/headerQr';
import GlobalStyles from '../styles/styles';
import checkMark from "../assets/checkMark.png"
import QRCode from 'react-native-qrcode-svg';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNPrint from 'react-native-print';
import { logo } from "../components/logo"

class Receipt extends Component {
    constructor(props) {
        super(props);
        this.state = {
            printData: ""
        };
        this.svg = null
    }

    static contextType = ContextModule;

    async getDataURL() {
        return new Promise(async (resolve, reject) => {
            this.svg.toDataURL(async (data) => {
                this.setState({
                    printData: "data:image/png;base64," + data
                }, () => resolve("ok"))
            });
        })
    }

    render() {
        const styles = StyleSheet.create({
            buttonStyle: {
                backgroundColor: '#ffbc42',
                borderRadius: 50,
                padding: 8,
                marginVertical: 8,
                width: Dimensions.get('window').width * .9,
                alignItems: 'center',
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
                <Header navigation={this.props.navigation} />
                <SafeAreaView style={GlobalStyles.main}>
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: "space-evenly", alignItems: "center" }}>
                        <Image source={checkMark} alt="check"
                            style={{ width: 200, height: 200 }}
                        />
                        <Text style={{
                            textShadowRadius: 1,
                            fontSize: 28, fontWeight: "bold", color: "white", paddingTop: 10
                        }}>
                            {
                                `${`Amount: ${this.context.value.transaction[0]}` + " " + "SOL"}`
                            }
                        </Text>
                        <Pressable style={styles.buttonStyle} onPress={async () => {
                            await this.getDataURL()
                            const results = await RNHTMLtoPDF.convert({
                                html: (`
                                    <div style="text-align: center;">
                                        <img src='${logo}' width="500px"></img>
                                        <h1 style="font-size: 3rem;">--------- Original Reciept ---------</h1>
                                        <h1 style="font-size: 3rem;">Date: ${new Date().toLocaleDateString()}</h1>
                                        <h1 style="font-size: 3rem;">------------------ • ------------------</h1>
                                        <h1 style="font-size: 3rem;">LoRa Payment</h1>
                                        <h1 style="font-size: 3rem;">Amount: ${`${this.context.value.transaction[0]}` + " " + "SOL"}</h1>
                                        <h1 style="font-size: 3rem;">------------------ • ------------------</h1>
                                        <img src='${this.state.printData}'></img>
                                    </div>
                                    `),
                                fileName: 'print',
                                base64: true,
                            })
                            await RNPrint.print({ filePath: results.filePath })
                        }}>
                            <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>
                                Print Receipt
                            </Text>
                        </Pressable>
                        <Pressable style={styles.buttonStyle} onPress={() =>
                            this.props.navigation.navigate('DW')
                        }>
                            <Text style={{ color: "black", fontSize: 24, fontWeight: "bold" }}>
                                Done
                            </Text>
                        </Pressable>
                    </View>
                </SafeAreaView>
                <View style={{ marginTop: Dimensions.get("window").height }}>
                    <QRCode
                        value={`https://solana.fm/tx/${this.context.value.transaction[1]}?cluster=mainnet-solanafmbeta`}
                        size={Dimensions.get("window").width * 0.7}
                        ecl="L"
                        getRef={(c) => (this.svg = c)}
                    />
                </View>
            </>
        );
    }
}

export default Receipt;