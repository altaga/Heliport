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

export const useBLE = (WrappedComponent, serviceUUID) => {
    return class extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                scanning: false,
                peripheral: null,
                selected: null,
                methodResponse: null,
                fail: null
            }
            autoBind(this);
            this.emitterStop = null;
            this.emitterUpdate = null;
            this.emitterDiscover = null;
            this.connected = false
            this.mount = false
        }

        startScan() {
            this.setState({
                scanning: false,
                peripheral: null
            }, () => {
                console.log("startScan");
                if (!this.state.scanning) {
                    BleManager.scan([], 20, true).then(() => {
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
                if (uuid === serviceUUID) {
                    this.setState({
                        peripheral,
                        scanning: false
                    }, () => BleManager.stopScan())
                }
            });
        }

        handleStopScan() {
            console.log('Scan is stopped');
        }

        rebootBuffer() {
            this.emitterUpdate.remove();
            bleManagerEmitter.removeAllListeners('BleManagerDidUpdateValueForCharacteristic')
            this.emitterUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic);
        }

        async handleUpdateValueForCharacteristic({ value, peripheral, characteristic, service }) {
            let temp = value.filter(value => value < 255) // Filter Dummy Bytes
            temp = String.fromCharCode(...temp)
            console.log(temp)
            this.setState({
                methodResponse: temp
            })
            await BleManager.stopNotification(peripheral, service, characteristic).then(() => console.log("Notification Stop"))
            this.rebootBuffer()
            BleManager.disconnect(peripheral).then(() => {
                this.connected = false
                console.log("Device Disconnected")
            })
        }

        async method(inUUID, outUUID, command, dataIn) {
            if (this.state.peripheral) {
                BleManager.connect(this.state.peripheral.id).then(() => {
                    setTimeout(async () => {
                        this.connected = true
                        await BleManager.retrieveServices(this.state.peripheral.id)
                        await BleManager.startNotificationUseBuffer(this.state.peripheral.id, serviceUUID, outUUID, 128).then(() => console.log("Notification Start"))
                        let data;
                        if (command === "sendTransaction") {
                            data = Buffer.from(dataIn[0], "utf-8")
                        }
                        else {
                            data = {
                                "method": command,
                                "params": dataIn
                            }
                            data = JSON.stringify(data)
                            data = Buffer.from(data, "utf-8")
                        }
                        BleManager.write(this.state.peripheral.id, serviceUUID, inUUID, [...data], 254)
                    }, 1000);
                }).catch((error) => {
                    console.log('Connection error', error);
                    this.setState({
                        fail: true
                    }, () => setTimeout(()=>
                        this.setState({
                            fail: null
                        }), 1000))
                });
            }
        }

        componentDidMount() {
            BleManager.enableBluetooth()
                .then(async () => {
                    await BleManager.start({ showAlert: false });
                    this.emitterStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan);
                    this.emitterUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic);
                    this.emitterDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral);
                    this.mount = true
                    if (Platform.OS === 'android' && Platform.Version >= 23) {
                        let checkFine = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION)
                        if (!checkFine) {
                            PermissionsAndroid.requestMultiple([
                                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
                            ]).then(result => {
                                if (
                                    result['android.permission.ACCESS_COARSE_LOCATION'] === 'granted'
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

        componentWillUnmount() {
            console.log('unmount');
            this.mount && this.emitterStop.remove();
            this.mount && this.emitterUpdate.remove();
            this.mount && this.emitterDiscover.remove();
            try {
                this.mount && this.connected && BleManager.disconnect(this.state.peripheral.id).then(() => {
                    this.connected = false
                    console.log("Device Disconnected")
                })
            }
            catch {
                // nothing
            }
        }

        render() {
            return (
                <WrappedComponent
                    startScan={() => this.startScan()}
                    clearResponse={() => this.setState({
                        methodResponse: null
                    })}
                    method={this.method}
                    methodResponse={this.state.methodResponse}
                    peripheral={this.state.peripheral}
                    scanning={this.state.scanning}
                    fail={this.state.fail}
                >
                    {this.props.children}
                </WrappedComponent>
            )
        }
    }
}