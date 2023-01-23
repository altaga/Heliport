import React, { Component } from 'react';
import { SafeAreaView, StyleSheet, Text, Image, Pressable, View, Dimensions } from 'react-native';
import { Header } from 'react-native-elements';
import Renders from "../assets/logo.png"
import ContextModule from '../utils/contextModule';
import DepositCrypto from '../components/depositCrypto';
//import SolanaPay from '../components/solanaPay';
import Icon from 'react-native-vector-icons/Feather';
import WithdrawCryptoOffline from '../components/withdrawCryptoOffline';

class DW extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: 0,
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
            buttonLogoutStyle: {
                backgroundColor: `#ffbc42`,
                borderRadius: 50,
                padding: 10,
                width: Dimensions.get('window').width * .3,
                alignItems: 'center',
                borderColor: "black",
                borderWidth: 2
            },
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
            }
        });
        return (
            <>
                {
                    // <AppStateListener navigation={this.props.navigation} />
                }
                <Header
                    leftComponent={<Image source={Renders} alt="Cat"
                        style={{ width: 512 / 10, height: 512 / 10, marginLeft: 20 }}
                    />}
                    rightComponent={
                        <Pressable style={styles.buttonLogoutStyle} onPress={() => this.props.navigation.navigate('Main')}>
                            <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
                                Close
                            </Text>
                        </Pressable>
                    }
                    backgroundColor="#161B19"
                />
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
                            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
                                Deposit
                            </Text>
                        </Pressable>
                        <Pressable style={[styles.buttonStyle, {
                            borderTopRightRadius: 50,
                            borderBottomRightRadius: 50,
                            borderLeftWidth: 1,
                            borderLeftColor: "green"
                        }]} onPress={() => {
                            this.setState({
                                selected: 2
                            })
                        }}>
                            <Icon name="upload" size={38} color="#000" />
                            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
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
                                //<SolanaPay />
                            }
                        </View>
                    }
                    {
                        this.state.selected === 2 &&
                        <View>
                            {
                                <WithdrawCryptoOffline navigation={this.props.navigation} />
                            }
                        </View>
                    }
                </SafeAreaView>
            </>
        );
    }
}

export default DW;