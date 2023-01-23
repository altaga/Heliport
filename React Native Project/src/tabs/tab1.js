import React, { Component } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Crypto from '../components/crypto';

class Tab1 extends Component {
    render() {
        return (
            <SafeAreaView style={{ paddingTop: 0 }}>
                <View>
                    {
                        <Crypto />
                    }
                </View>
            </SafeAreaView>
        );
    }
}

export default Tab1;