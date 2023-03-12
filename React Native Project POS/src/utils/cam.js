import { View } from 'react-native'
import React, { Component } from 'react'
import { CameraScreen } from 'react-native-camera-kit'
import reactAutobind from 'react-autobind';
import ContextModule from './contextModule';
import { PublicKey } from '@solana/web3.js';
import EncryptedStorage from 'react-native-encrypted-storage';

class Cam extends Component {
    constructor(props) {
        super(props);
        this.state = {
            scanning: true
        }
        reactAutobind(this)
    }

    static contextType = ContextModule;

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

    render() {
        return (
            <View>
                <CameraScreen
                    scanBarcode={this.state.scanning}
                    onReadCode={
                        (event) => {
                            let temp = event.nativeEvent.codeStringValue
                            if (temp.length === 44) {
                                this.setState({
                                    scanning: false
                                },
                                    async () => {
                                        await this.storePubKey(temp)
                                        this.context.setValue({
                                            pubKey: new PublicKey(temp)
                                        },
                                            () => this.props.navigation.navigate('Login'))
                                    })
                            }
                        }}
                    showFrame={true}
                    laserColor='red'
                    frameColor='white'
                />
            </View>
        )
    }
}

export default Cam