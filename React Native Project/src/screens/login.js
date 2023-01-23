import React, { Component } from 'react';
// Modules ReactNative
import { StatusBar, SafeAreaView, Text, Image, Pressable, View, Dimensions } from 'react-native';
import reactAutobind from 'react-autobind';
// Modules Web3
import { Keypair } from '@solana/web3.js';
// Utils
import ContextModule from '../utils/contextModule';
// Assets Modules
import Icon from 'react-native-vector-icons/MaterialIcons';
// Assets
import Renders from "../assets/logo.png"
import LogoSplash from "../assets/logo.png"
// Styles
import GlobalStyles from '../styles/styles';
// Sensors
import ReactNativeBiometrics from 'react-native-biometrics'
// Storage
import EncryptedStorage from 'react-native-encrypted-storage';
// Keyboard
import VirtualKeyboard from 'react-native-virtual-keyboard';

const rnBiometrics = new ReactNativeBiometrics()

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            stage: 4,
            text: "",
            biometric: false,
            clear: false
        };
        reactAutobind(this)
    }

    static contextType = ContextModule;

    async storeUserPIN() {
        try {
            await EncryptedStorage.setItem(
                "userPIN",
                JSON.stringify({
                    pin: this.state.text.substring(0, 4)
                })
            );
            this.context.setValue({
                pin: this.state.text.substring(0, 4)
            })
            this.setState({
                stage: 2
            })
        } catch (error) {
            // There was an error on the native side
        }
    }

    async storeUserWallet(wallet) {
        try {
            await EncryptedStorage.setItem(
                "userWallet",
                JSON.stringify({
                    wallet
                })
            );
            this.context.setValue({
                wallet: Keypair.fromSecretKey(Uint8Array.from(wallet.split(',')))
            })
        } catch (error) {
            // There was an error on the native side
        }
    }

    async retrieveUserSession() {
        try {
            const session = await EncryptedStorage.getItem("userWallet");
            if (session !== undefined) {
                console.log(session)
            }
            else {
                console.log("nothing yet")
            }
        } catch (error) {
            // There was an error on the native side
        }
    }

    storeUserBiometrics() {
        rnBiometrics.simplePrompt({ promptMessage: 'Confirm fingerprint' })
            .then(async (resultObject) => {
                const { success } = resultObject
                if (success) {
                    try {
                        await EncryptedStorage.setItem(
                            "userBiometrics",
                            JSON.stringify({
                                biometrics: true
                            })
                        );
                        this.context.setValue({
                            biometrics: true
                        })
                        this.setState({
                            stage: 3
                        })
                    } catch (error) {
                        // There was an error on the native side
                    }
                } else {
                    console.log('user cancelled biometric prompt')
                }
            })
            .catch(() => {
                console.log('biometrics failed')
            })
    }


    async storeUserBiometricsSkip() {
        try {
            await EncryptedStorage.setItem(
                "userBiometrics",
                JSON.stringify({
                    biometrics: false
                })
            );
            this.context.setValue({
                biometrics: false
            })
            this.setState({
                stage: 3
            })
        } catch (error) {
            // There was an error on the native side
        }
    }

    async componentDidMount() {
        //await this.erase()
        try {
            const session = await EncryptedStorage.getItem("userPIN");
            if (session !== undefined) {
                this.context.setValue({
                    pin: JSON.parse(session).pin
                })
            }
            else {
                console.log("nothing yet")
            }
        } catch (error) {
            // There was an error on the native side
        }
        try {
            const session = await EncryptedStorage.getItem("userWallet");
            if (session !== undefined) {
                this.context.setValue({
                    wallet: Keypair.fromSecretKey(Uint8Array.from(JSON.parse(session).wallet.split(',')))
                })
            }
            else {
                console.log("nothing yet")
            }
        } catch (error) {
            // There was an error on the native side
        }
        try {
            const session = await EncryptedStorage.getItem("userBiometrics");
            if (session !== undefined) {
                this.context.setValue({
                    biometrics: JSON.parse(session).biometrics
                })
            }
            else {
                console.log("nothing yet")
            }
        } catch (error) {
            // There was an error on the native side
        }
        rnBiometrics.isSensorAvailable()
            .then((resultObject) => {
                const { available } = resultObject
                this.setState({
                    biometric: available
                })
            })
        if ((this.context.value.wallet ? true : false) && (this.context.value.pin ? true : false)) {
            this.setState({
                stage: 3
            })
        } else {
            this.setState({
                stage: 0
            })
        }
    }

    componentWillUnmount() {

    }

    changeText = (val) => {
        if (val.length <= 4) {
            this.setState({
                text: val
            });
        }
    }

    changeTextCheck = (val) => {
        if (val.length < 5) {
            this.setState({
                text: val
            }, () => {
                if (this.state.text.length === 4) {
                    if (this.context.value.pin === this.state.text) {
                        this.props.navigation.navigate('Main')
                        this.setState({
                            text: "",
                            clear: true
                        }, () => {
                            this.setState({
                                clear: false
                            })
                        })
                    }
                    else {
                        this.setState({
                            text: "",
                            clear: true
                        }, () => {
                            this.setState({
                                clear: false
                            })
                        })
                    }
                }
            });
        }
    }

    async erase() {
        try {
            await EncryptedStorage.clear();
            // Congrats! You've just cleared the device storage!
        } catch (error) {
            // There was an error on the native side
        }
    }

    render() {
        return (
            <SafeAreaView style={[{
                flexDirection: 'column',
                justifyContent: "space-evenly",
                alignItems: 'center',
                height: Dimensions.get("window").height,
                width: Dimensions.get("window").width,
                backgroundColor: "#1E2423",
                paddingTop: StatusBar.currentHeight,
                backgroundColor: "#1E2423"
            }]}>
                {
                    this.state.stage === 0 &&
                    <>
                        <Image source={Renders} alt="Cat"
                            style={{ width: 512 * 0.7, height: 512 * 0.7 }}
                        />
                        <Text style={{
                            fontSize: 36,
                            textAlign: "center",
                            marginHorizontal: 20,
                            color:"white"
                        }}>
                            A secure and practical Solana wallet built for payments
                        </Text>
                        <Pressable style={GlobalStyles.buttonStyleLogin} onPress={async () => {
                            let keypair = Keypair.generate();
                            await this.storeUserWallet(keypair._keypair.secretKey.toString())
                            this.setState({ stage: 1 })
                        }}>
                            <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
                                Create a new wallet
                            </Text>
                        </Pressable>
                        <View />
                    </>
                }
                {
                    this.state.stage === 1 &&
                    <View style={{
                        paddingTop: 0,
                        paddingBottom: 50,
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            fontSize: 36,
                            textAlign: "center",
                            padding: 10,
                            marginTop: 30,
                            marginBottom: 80,
                            width: Dimensions.get("window").width * 0.8
                        }}>
                            Protect your wallet with a pincode
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: "center",
                            marginBottom: 40,
                        }}>
                            <Text style={{
                                color: 'white',
                                width: Dimensions.get("window").width * .20,
                                textAlign: "center",
                                fontSize: 24
                            }}>
                                {
                                    this.state.text.substring(0, 1) !== "" ? this.state.text.substring(0, 1) : "•"
                                }
                            </Text>
                            <Text style={{
                                color: 'white',
                                width: Dimensions.get("window").width * .20,
                                textAlign: "center",
                                fontSize: 24
                            }}>
                                {
                                    this.state.text.substring(1, 2) !== "" ? this.state.text.substring(1, 2) : "•"
                                }
                            </Text>
                            <Text style={{
                                color: 'white',
                                width: Dimensions.get("window").width * .20,
                                textAlign: "center",
                                fontSize: 24
                            }}>
                                {
                                    this.state.text.substring(2, 3) !== "" ? this.state.text.substring(2, 3) : "•"
                                }
                            </Text>
                            <Text style={{
                                color: 'white',
                                width: Dimensions.get("window").width * .20,
                                textAlign: "center",
                                fontSize: 24
                            }}>
                                {
                                    this.state.text.substring(3, 4) !== "" ? this.state.text.substring(3, 4) : "•"
                                }
                            </Text>
                        </View>
                        <VirtualKeyboard
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
                            color='white'
                            pressMode='string'
                            onPress={(val) => this.changeText(val)}
                        />
                        <Pressable disabled={this.state.text.length !== 4} style={[this.state.text.length !== 4 ? GlobalStyles.buttonStyleLoginDisabel : GlobalStyles.buttonStyleLogin, { marginTop: 30 }]} onPress={async () => this.storeUserPIN()}>
                            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
                                Set Pincode
                            </Text>
                        </Pressable>
                    </View>
                }
                {
                    this.state.stage === 2 &&
                    <View style={{
                        paddingTop: 0,
                        paddingBottom: 50,
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            fontSize: 36,
                            textAlign: "center",
                            padding: 10,
                            marginTop: 30,
                            marginBottom: 80,
                            width: Dimensions.get("window").width * 0.8
                        }}>
                            Protect your wallet with biometrics
                        </Text>
                        <Pressable disabled={!this.state.biometric} style={[!this.state.biometric ? GlobalStyles.buttonStyleLoginDisabel : GlobalStyles.buttonStyleLogin, { marginTop: 30 }]} onPress={async () => this.storeUserBiometrics()}>
                            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
                                Set Touch Id
                            </Text>
                        </Pressable>
                        <Pressable style={[GlobalStyles.buttonStyleLogin, { marginTop: 30 }]} onPress={async () => this.setState({
                            stage: 3
                        })}>
                            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
                                Skip
                            </Text>
                        </Pressable>
                    </View>
                }
                {
                    this.state.stage === 3 &&
                    <View style={{
                        paddingTop: 0,
                        paddingBottom: 30,
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            fontSize: 36,
                            textAlign: "center",
                            padding: 10,
                            marginTop: 30,
                            marginBottom: 30,
                            width: Dimensions.get("window").width * 0.8
                        }}>
                            Unlock Your Wallet
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: "center",
                            marginBottom: 30,
                        }}>
                            <Text style={{
                                color: 'white',
                                width: Dimensions.get("window").width * .20,
                                textAlign: "center",
                                fontSize: 24
                            }}>
                                {
                                    this.state.text.substring(0, 1) !== "" ? "•" : "."
                                }
                            </Text>
                            <Text style={{
                                color: 'white',
                                width: Dimensions.get("window").width * .20,
                                textAlign: "center",
                                fontSize: 24
                            }}>
                                {
                                    this.state.text.substring(1, 2) !== "" ? "•" : "."
                                }
                            </Text>
                            <Text style={{
                                color: 'white',
                                width: Dimensions.get("window").width * .20,
                                textAlign: "center",
                                fontSize: 24
                            }}>
                                {
                                    this.state.text.substring(2, 3) !== "" ? "•" : "."
                                }
                            </Text>
                            <Text style={{
                                color: 'white',
                                width: Dimensions.get("window").width * .20,
                                textAlign: "center",
                                fontSize: 24
                            }}>
                                {
                                    this.state.text.substring(3, 4) !== "" ? "•" : "."
                                }
                            </Text>
                        </View>
                        <VirtualKeyboard
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
                            color='white'
                            pressMode='string'
                            onPress={(val) => this.changeTextCheck(val)}
                            clear={this.state.clear}
                        />
                        {
                            this.context.value.biometrics &&
                            <Pressable style={{ marginTop: 30 }} onPress={() => {
                                rnBiometrics.simplePrompt({ promptMessage: 'Confirm fingerprint' })
                                    .then(async (resultObject) => {
                                        this.setState({
                                            text: "",
                                        }, () => {
                                            const { success } = resultObject
                                            if (success) {
                                                this.props.navigation.navigate('Main')
                                            } else {
                                                console.log('user cancelled biometric prompt')
                                            }
                                        })
                                    })
                                    .catch(() => {
                                        console.log('biometrics failed')
                                    })
                            }}>
                                <Icon name="fingerprint" size={100} color={this.state.number === 2 ? "black" : "white"} />
                            </Pressable>
                        }
                    </View>
                }
                {
                    this.state.stage === 4 &&
                    <View style={{
                        alignItems: 'center',
                    }}>
                        <Image source={LogoSplash} alt="Cat"
                            style={{ width: 512*0.7, height: 512*0.7 }}
                        />
                    </View>
                }
            </SafeAreaView>
        );
    }
}

export default Login;