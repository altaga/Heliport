// Basic Imports
import React, { Component } from 'react';

import {
    NativeEventEmitter,
    Platform,
    PermissionsAndroid,
    NativeModules
} from 'react-native';

// Utils
import autoBind from 'react-autobind';

// BLE

import { Alert } from 'react-native';

import BleManager from 'react-native-ble-manager';
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

function hex_to_ascii(str1) {
    var hex = str1.toString();
    var str = '';
    for (var n = 0; n < hex.length; n += 2) {
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
}

class BLEcontroller extends Component {
    constructor(props) {
        super(props);
        this.state = {
            scanning: false,
            peripheral: null,
            selected: null,
            connected: false
        }
        autoBind(this);
        this.emitterStop = null;
        this.emitterUpdate = null;
        this.emitterDiscover = null;
        this.emitterDisconnect = null;
        this.inBuffer = []
    }

    startScan() {
        this.setState({
            scanning: false,
            peripheral: null
        }, () => {
            console.log("startScan");
            if (!this.state.scanning) {
                BleManager.scan([], 10, true).then(() => {
                    console.log('Scanning...');
                    this.setState({
                        scanning: true,
                    });
                }).catch(err => {
                    console.error(err);
                });
            }
        });
    }

    handleDiscoverPeripheral(peripheral) {
        if (!peripheral.name) {
            peripheral.name = 'NO NAME';
        }
        peripheral.advertising.serviceUUIDs.forEach(uuid => {
            if (uuid === this.props.serviceUUID) {
                this.setState({
                    peripheral,
                    scanning: false
                }, () => BleManager.stopScan())
            }
        });
    }

    handleStopScan() {
        console.log('Scan is stopped');
        this.props.callbackPeripheral(this.state.peripheral);
    }

    rebootBuffer() {
        this.emitterUpdate.remove();
        this.emitterUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic);
    }

    async handleUpdateValueForCharacteristic({ value, peripheral, characteristic, service }) {
        let temp = value.filter(value => value < 255) // Filter Dummy Bytes
        temp = String.fromCharCode(...temp)
        temp = hex_to_ascii(temp)
        console.log(temp)
        this.props.callbackPeripheralData(temp.split(","));
        await BleManager.stopNotification(peripheral, service, characteristic).then(() => console.log("Notification Stop"))
        this.rebootBuffer()
        await BleManager.disconnect(peripheral).then(() => {
            this.setState({
                connected: false
            })
            console.log("Device Disconnected")
        })
    }

    async routineOne(peripheral) {
        this.setState({
            connected: true
        })
        if (peripheral) {
            if (peripheral.connected) {
                await BleManager.disconnect(peripheral.id);
            }
            BleManager.connect(peripheral.id).then(() => {
                setTimeout(async () => {
                    await BleManager.retrieveServices(peripheral.id).then((info) => console.log(info.characteristics[5]))
                    await BleManager.startNotificationUseBuffer(peripheral.id, "1101", "0004", 254).then(() => console.log("Notification Start"))
                    // RPC Method
                    let data = {
                        "method": "getBalances",
                        "params": [
                            this.props.data.pubKey
                        ]
                    }
                    data = JSON.stringify(data)
                    data = Buffer.from(data, "utf-8")
                    await BleManager.write(peripheral.id, "1101", "0003", [...data], 254)
                }, 1000);
            }).catch((error) => {
                console.log('Connection error', error);
            });
        }
    }

    componentDidMount() {
        BleManager.enableBluetooth()
            .then(async () => {
                await BleManager.start({ showAlert: false });
                bleManagerEmitter.removeAllListeners('BleManagerStopScan')
                bleManagerEmitter.removeAllListeners('BleManagerDidUpdateValueForCharacteristic')
                bleManagerEmitter.removeAllListeners('BleManagerDiscoverPeripheral')
                this.emitterStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan);
                this.emitterUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic);
                this.emitterDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral);
                if (Platform.OS === 'android' && Platform.Version >= 23) {
                    let checkFine = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
                    let checkBLE = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN)
                    let checkBT = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT)
                    if (!checkFine || !checkBLE || !checkBT) {
                        PermissionsAndroid.requestMultiple([
                            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
                        ]).then(result => {
                            if (
                                result['android.permission.ACCESS_FINE_LOCATION'] === 'granted' &&
                                result['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
                                result['android.permission.BLUETOOTH_CONNECT'] === 'granted'
                            ) {
                                this.startScan()
                            } else {
                                Alert.alert('Permissions denied!', 'You need to give permissions');
                            }
                        });
                    }
                    else {
                        this.startScan()
                    }
                }
            })
            .catch((error) => {
                // Failure code
                console.log("The user refuse to enable bluetooth");
            });
    }

    componentDidUpdate(prevProps, prevState) {
        if ((this.props.connect !== prevProps.connect) && this.props.connect === true) {
            if (this.props.routine === 1) {
                this.routineOne(this.props.peripheral)
            }
        }
    }

    componentWillUnmount() {
        console.log('unmount');
        this.emitterStop.remove();
        this.emitterUpdate.remove();
        this.emitterDiscover.remove();
        try {
            BleManager.disconnect(this.props.peripheral.id).then(() => {
                this.setState({
                    connected: false
                })
                console.log("Device Disconnected")
            })
        }
        catch {
            // nothing
        }

    }

    render() {
        return (
            <>
            </>
        );
    }
}

export default BLEcontroller;