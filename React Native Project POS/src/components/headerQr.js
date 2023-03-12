import { Text, View, Image, Pressable } from 'react-native'
import React, { Component } from 'react'
import GlobalStyles from '../styles/styles'
import logo from "../assets/logo.png";
import QR from "../assets/qr.png"
import EncryptedStorage from 'react-native-encrypted-storage';
import reactAutobind from 'react-autobind';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import ContextModule from '../utils/contextModule';

class Header extends Component {
    constructor(props) {
        super(props);
        reactAutobind(this)
    }

    static contextType = ContextModule;

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
            <View style={[GlobalStyles.header, { flexDirection: "row", justifyContent: "space-between", alignContent: "center" }]}>
                <View style={GlobalStyles.headerItem}>
                    <Image source={logo} alt="Cat"
                        style={{ width: 512 / 10, height: 512 / 10 }}
                    />
                </View>
                <View style={GlobalStyles.headerItem}>
                    <Pressable onPress={() => this.props.navigation.navigate('DW')}>
                        <View style={{ width: 512 / 10, height: 512 / 10 }} />
                    </Pressable>
                </View>
                <View style={[GlobalStyles.headerItem, { paddingTop: 10 }]}>
                    <Pressable style={GlobalStyles.buttonLogoutStyle} onPress={() => {
                        this.props.navigation.navigate('Main')
                    }}>
                        <Text style={{ color: "black", fontSize: 18, fontWeight: "bold", textAlign: "center" }}>
                            Return
                        </Text>
                    </Pressable>
                </View>
            </View>
        )
    }
}

export default Header