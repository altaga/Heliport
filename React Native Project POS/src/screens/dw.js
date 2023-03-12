import React, { Component } from 'react';
import { SafeAreaView, StyleSheet, Text, Image, Pressable, View, Dimensions } from 'react-native';
import ContextModule from '../utils/contextModule';
import DepositCrypto from '../components/depositCrypto';
import Header from '../components/headerQr';

class DW extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: 0, // 0
        };
    }

    static contextType = ContextModule;

    componentWillUnmount() {

    }

    onChangeText = (event) => {
    }

    componentDidMount() {

    }

    render() {
        const styles = StyleSheet.create({
            buttonStyle: {
                backgroundColor: '#ffbc42',
                borderRadius: 0,
                padding: 8,
                marginTop: 8,
                width: Dimensions.get('window').width * .45,
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
                {
                    // <AppStateListener navigation={this.props.navigation} />
                }
                <Header navigation={this.props.navigation} />
                <SafeAreaView style={styles.content}>
                    <DepositCrypto  {...this.props} />
                </SafeAreaView>
            </>
        );
    }
}

export default DW;