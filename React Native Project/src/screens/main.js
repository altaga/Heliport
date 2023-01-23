import React, { Component } from 'react';
import { Text, Image, Pressable, View, Dimensions } from 'react-native';
import Renders from "../assets/logo.png"
import QR from "../assets/qr.png"
import ContextModule from '../utils/contextModule';
import reactAutobind from 'react-autobind';
import GlobalStyles from '../styles/styles';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Tabs
import Tab1 from '../tabs/tab1';
import AppStateListener from '../utils/appStateListener';
/*

import Tab2 from '../tabs/tab2';
import Tab3 from '../tabs/tab3';
*/

class Main extends Component {
    constructor(props) {
        super(props);
        this.state = {
            network: false,
            qr: null,
            text: '',
            number: 0,
            selectorSytle1: {
                borderColor: "#ffbc42",
                backgroundColor: "white",
                paddingTop: 4,
                borderTopWidth: 2,
                borderLeftWidth: 2,
                borderRightWidth: 2,
                width: Dimensions.get('window').width * .3333,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
            },
            selectorSytle2: {
                borderColor: "#ffbc42",
                backgroundColor: `#ffbc42`,
                paddingTop: 4,
                borderTopWidth: 0,
                borderLeftWidth: 0,
                borderRightWidth: 0,
                width: Dimensions.get('window').width * .3333,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
            },
            selectorSytle3: {
                borderColor: "#ffbc42",
                backgroundColor: `#ffbc42`,
                paddingTop: 4,
                borderTopWidth: 0,
                borderLeftWidth: 0,
                borderRightWidth: 0,
                width: Dimensions.get('window').width * .3333,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
            },
            selectorText1: {
                fontSize: 20,
                color: 'black',
                marginBottom: 4,
                textAlign: 'center'
            },
            selectorText2: {
                fontSize: 20,
                color: 'white',
                marginBottom: 4,
                textAlign: 'center'
            },
            selectorText3: {
                fontSize: 20,
                color: 'white',
                marginBottom: 4,
                textAlign: 'center'
            }
        };
        reactAutobind(this)
    }

    static contextType = ContextModule;

    componentWillUnmount() {

    }

    onChangeText = (event) => {
    }

    componentDidMount() {
        this.selector(0);
    }

    selector(number) {
        switch (number) {
            case 0:
                this.setState({
                    number: 0,
                    selectorSytle1: {
                        ...this.state.selectorSytle1,
                        backgroundColor: "white",
                        borderTopWidth: 2,
                        borderLeftWidth: 2,
                        borderRightWidth: 2,
                    },
                    selectorSytle2: {
                        ...this.state.selectorSytle2,
                        backgroundColor: `#ffbc42`,
                        borderTopWidth: 0,
                        borderLeftWidth: 0,
                        borderRightWidth: 0,
                    },
                    selectorSytle3: {
                        ...this.state.selectorSytle3,
                        backgroundColor: `#ffbc42`,
                        borderTopWidth: 0,
                        borderLeftWidth: 0,
                        borderRightWidth: 0,
                    },
                    selectorText1: {
                        ...this.state.selectorText1,
                        color: 'black',
                        fontWeight: 'bold',
                    },
                    selectorText2: {
                        ...this.state.selectorText2,
                        color: 'white',
                        fontWeight: 'bold',
                    },
                    selectorText3: {
                        ...this.state.selectorText3,
                        color: 'white',
                        fontWeight: 'bold',
                    }
                })
                break;
            case 1:
                this.setState({
                    number: 1,
                    selectorSytle1: {
                        ...this.state.selectorSytle1,
                        backgroundColor: `#ffbc42`,
                        borderTopWidth: 0,
                        borderLeftWidth: 0,
                        borderRightWidth: 0,
                    },
                    selectorSytle2: {
                        ...this.state.selectorSytle2,
                        backgroundColor: "white",
                        borderTopWidth: 2,
                        borderLeftWidth: 2,
                        borderRightWidth: 2,
                    },
                    selectorSytle3: {
                        ...this.state.selectorSytle3,
                        backgroundColor: `#ffbc42`,
                        borderTopWidth: 0,
                        borderLeftWidth: 0,
                        borderRightWidth: 0,
                    },
                    selectorText1: {
                        ...this.state.selectorText1,
                        color: 'white',
                        fontWeight: 'bold',
                    },
                    selectorText2: {
                        ...this.state.selectorText2,
                        color: 'black',
                        fontWeight: 'bold',
                    },
                    selectorText3: {
                        ...this.state.selectorText3,
                        color: 'white',
                        fontWeight: 'bold',
                    }
                })
                break;
            case 2:
                this.setState({
                    number: 2,
                    selectorSytle1: {
                        ...this.state.selectorSytle1,
                        backgroundColor: `#ffbc42`,
                        borderTopWidth: 0,
                        borderLeftWidth: 0,
                        borderRightWidth: 0,
                    },
                    selectorSytle2: {
                        ...this.state.selectorSytle2,
                        backgroundColor: `#ffbc42`,
                        borderTopWidth: 0,
                        borderLeftWidth: 0,
                        borderRightWidth: 0,
                    },
                    selectorSytle3: {
                        ...this.state.selectorSytle3,
                        backgroundColor: "white",
                        borderTopWidth: 2,
                        borderLeftWidth: 2,
                        borderRightWidth: 2,
                    },
                    selectorText1: {
                        ...this.state.selectorText1,
                        color: 'white',
                        fontWeight: 'bold',
                    },
                    selectorText2: {
                        ...this.state.selectorText2,
                        color: 'white',
                        fontWeight: 'bold',
                    },
                    selectorText3: {
                        ...this.state.selectorText3,
                        color: 'black',
                        fontWeight: 'bold',
                    }
                })
                break;
            default:
                break;
        }
    }

    render() {
        return (
            <>
                {
                    // <AppStateListener navigation={this.props.navigation} />
                }
                <View style={GlobalStyles.container}>
                    <View style={[GlobalStyles.header, { flexDirection: "row", justifyContent: "space-between", alignContent: "center" }]}>
                        <View style={GlobalStyles.headerItem}>
                            <Image source={Renders} alt="Cat"
                                style={{ width: 512 / 10, height: 512 / 10 }}
                            />
                        </View>
                        <View style={GlobalStyles.headerItem}>
                            <Pressable onPress={() => this.props.navigation.navigate('DW')}>
                                <Image source={QR} alt="Cat" style={{ width: 512 / 10, height: 512 / 10 }} />
                            </Pressable>
                        </View>
                        <View style={GlobalStyles.headerItem}>
                            <Pressable style={GlobalStyles.buttonLogoutStyle} onPress={() => this.props.navigation.navigate('Login')}>
                                <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
                                    Lock
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                    <View style={GlobalStyles.main}>
                        {
                            this.state.number === 0 &&
                            <View style={{ marginHorizontal: 20 }}>
                                {
                                    <Tab1 />
                                }
                            </View>
                        }
                        {
                            this.state.number === 1 &&
                            <View style={{ marginHorizontal: 20 }}>
                                {
                                    //<Tab2 />
                                }
                            </View>
                        }
                        {
                            this.state.number === 2 &&
                            <View style={{ marginHorizontal: 20 }}>
                                {
                                    // <Tab3 />
                                }
                            </View>
                        }
                    </View>
                </View>
            </>
        );
    }
}

export default Main;