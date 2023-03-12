// Basic Imports
import React, { Component } from 'react';
import { Text, View, Image, Pressable, Dimensions, StatusBar, ViewComponent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Styles
import GlobalStyles from '../styles/styles';
// Assets
import logo from "../assets/logo.png";
// Utils
import reactAutobind from 'react-autobind';
import ContextModule from '../utils/contextModule';
// Solana
import { PublicKey } from '@solana/web3.js';
import { toByteArray } from 'react-native-quick-base64';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import EncryptedStorage from 'react-native-encrypted-storage';

const APP_IDENTITY = {
    uri: "https://www.notion.so", // https://puzzled-plume-e93.notion.site/
    icon: "/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F30d49ea0-038b-49b8-816d-b628cd6fe73e%2Fhei1port.png?table=block&id=a65e0f28-687b-4408-b99b-826134c8615c&spaceId=eb909c3e-5557-4034-83ea-e79b46696878&width=250&userId=&cache=v2"
};

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true
        }
        reactAutobind(this)
    }

    static contextType = ContextModule;

    connectWallet() {
        this.props.navigation.navigate('Cam')
    }

    async storePubKey(pubKey) {
        try {
            await EncryptedStorage.setItem(
                "pubKey",
                JSON.stringify({
                    pubKey: pubKey.toString()
                })
            );
        } catch (error) {
            // There was an error on the native side
        }
    }

    async retrievePubKey() {
        try {
            const session = await EncryptedStorage.getItem("pubKey");
            if (session !== undefined) {
                return JSON.parse(session).pubKey
            }
            else {
                return undefined
            }
        } catch (error) {
            return undefined
        }
    }

    async componentDidMount() {
        this.props.navigation.addListener('focus', async () => {
            let pubKey = await this.retrievePubKey()
            if (pubKey) {
                pubKey = new PublicKey(pubKey)
                this.context.setValue({
                    pubKey
                }, () => this.props.navigation.navigate('Main')) // Main
            }
            else {
                this.setState({
                    loading: false
                })
            }
        })
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
                paddingTop: StatusBar.currentHeight,
                backgroundColor: "#1E2423"
            }]}>
                {
                    this.state.loading ?
                        <>
                            <Image source={logo} alt="Cat"
                                style={{ width: Dimensions.get("window").width * 0.8, height: Dimensions.get("window").width * 0.8 }}
                            />
                        </>
                        :
                        <View style={[{
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: Dimensions.get("window").height,
                            width: Dimensions.get("window").width,
                            backgroundColor: "#1E2423"
                        }]}>
                            <View style={{ paddingVertical: 40 }}>
                                <Image source={logo} alt="Cat"
                                    style={{ width: 512 * 0.45, height: 512 * 0.45 }}
                                />
                            </View>
                            <Text style={{
                                fontSize: 24,
                                textAlign: "center",
                                marginHorizontal: 20,
                                paddingTop: 36,
                                color: "white",
                            }}>
                                Pay and transact on Solana through the Helium Network.
                            </Text>
                            <Pressable style={GlobalStyles.buttonStyle} onPress={async () => {
                                this.connectWallet()
                            }}>
                                <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
                                    Connect Wallet
                                </Text>
                            </Pressable>
                        </View>
                }
            </SafeAreaView>
        )
    }
}

export default Login