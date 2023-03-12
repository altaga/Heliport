import React, { Component } from 'react';
import { SafeAreaView, StyleSheet, Text, Image, Pressable, View, Dimensions } from 'react-native';
import Renders from "../assets/logo.png"
import ContextModule from '../utils/contextModule';
import DepositCrypto from '../components/depositCrypto';
import WithdrawCrypto from '../components/withdrawCrypto';
//import SolanaPay from '../components/solanaPay';
import Icon from 'react-native-vector-icons/Feather';
import Header from '../components/headerQr';

class DW extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: 0, // 0
        };
    }

    static contextType = ContextModule;

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
                    <View style={{ flexDirection: "row", paddingTop: 10 }}>
                        <Pressable style={[styles.buttonStyle, {
                            borderTopLeftRadius: 50,
                            borderBottomLeftRadius: 50
                        }]} onPress={() => {
                            this.setState({
                                selected: 0
                            })
                        }}>
                            <Icon name="download" size={38} color="#000" />
                            <Text style={{ color: "black", fontSize: 18, fontWeight: "bold" }}>
                                Deposit
                            </Text>
                        </Pressable>
                        <Pressable style={[styles.buttonStyle, {
                            borderTopRightRadius: 50,
                            borderBottomRightRadius: 50,
                            borderLeftWidth: 2,
                            borderLeftColor: "black"
                        }]} onPress={() => {
                            this.setState({
                                selected: 1
                            })
                        }}>
                            <Icon name="upload" size={38} color="#000" />
                            <Text style={{ color: "black", fontSize: 18, fontWeight: "bold" }}>
                                Withdraw
                            </Text>
                        </Pressable>
                    </View>
                    {
                        this.state.selected === 0 &&
                        <View>
                            <DepositCrypto />
                        </View>
                    }
                    {
                        this.state.selected === 1 &&
                        <View>
                            {
                                <WithdrawCrypto {...this.props} />
                            }
                        </View>
                    }
                </SafeAreaView>
            </>
        );
    }
}

export default DW;