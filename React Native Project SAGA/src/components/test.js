import { Dimensions, PermissionsAndroid, Platform, Pressable, Text, View } from 'react-native'
import React, { Component } from 'react'
import reactAutobind from 'react-autobind';
import BleManager from 'react-native-ble-manager';
import BLEcontroller from '../utils/bleBalanceController';

class Test extends Component {
    constructor(props) {
        super(props);
        this.state = {
            authToken: "",
            pubKey: ""
        }
        reactAutobind(this)
    }

    async componentDidMount() {

    }

    componentDidUpdate(prevProps, prevState) {

    }

    componentWillUnmount() {

    }

    render() {
        return (
            <View>
                <Pressable onPress={() => this.connectWallet()} style={{ width: Dimensions.get("window").width, height: Dimensions.get("window").height / 3, backgroundColor: "black", color: "white" }}>
                    <Text style={{ position: "relative", alignContent: "center" }}>
                        Test1
                    </Text>
                </Pressable>
                <Pressable onPress={() => this.sign()} style={{ width: Dimensions.get("window").width, height: Dimensions.get("window").height / 3, backgroundColor: "black", color: "white" }}>
                    <Text style={{ position: "relative", alignContent: "center" }}>
                        Test2
                    </Text>
                </Pressable>
                <BLEcontroller
                    serviceUUID={'1101'}        // Service UUID
                    characteristicUUID={'2a37'} // Characteristic UUID
                    callback={
                        (data) => {
                            console.log(data[0]);
                        }
                    }
                    callbackDataNotify={
                        (data) => {

                        }
                    }
                />
            </View>
        );
    }
}

export default Test