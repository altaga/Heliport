import React, { Component } from 'react';
import { Text, View } from 'react-native';
import ContextModule from '../utils/contextModule';
import QRCode from 'react-native-qrcode-svg';

class DepositCrypto extends Component {
    static contextType = ContextModule;
    render() {
        return (
            <>
                <View style={{ justifyContent: "center", alignItems: "center", paddingTop:50, paddingBottom:50 }}>
                    <View>
                        <Text style={{ fontSize: 30, fontWeight: "bold" , color:"white", paddingBottom:30, textAlign:"center"}}>
                            Recieve Solana{"\n"}or SPL Token
                        </Text>
                    </View>
                    <QRCode
                        value={this.context.value.pubKey.toBase58()}
                        size={300}
                        quietZone={10}
                        ecl="H"
                    />
                    <View>
                        <Text style={{ fontSize: 30, fontWeight: "bold" , color:"white", paddingTop:30, justifyContent: "center", alignItems: "center", textAlign:"center"}}>
                            {
                                this.context.value.pubKey.toBase58().substring(0, 17) + "\n" + this.context.value.pubKey.toBase58().substring(this.context.value.pubKey.toBase58().length - 17, this.context.value.pubKey.toBase58().length)
                            }
                        </Text>
                    </View>
                </View>
            </>
        );
    }
}

export default DepositCrypto;