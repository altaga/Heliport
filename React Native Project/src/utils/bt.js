import React, { Component } from 'react';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

class BT extends Component {
  constructor(props) {
    super(props);
    this.readSubscription = null
    this.onDisconnectSubscription = null
    this.onConnectSubscription = null
    this.readInterval = null
  }



  async componentDidMount() {
    try {
      const available = await RNBluetoothClassic.isBluetoothAvailable();
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (!available && !enabled) {
        this.props.btDev(false)
      }
      else {
        const paired = await RNBluetoothClassic.getBondedDevices();
        let flag = null
        for (let i = 0; i < paired.length; i++) {
          if (paired[i].name === "Solana-BT_LoRa_RPC") {
            flag = i
          }
        }

        this.onDisconnectSubscription = RNBluetoothClassic.onDeviceDisconnected(async () => {
          //console.log("Disconnected")
        });

        let connection = await this.checkConnection(paired[flag])
        if (connection) {
          this.props.btDev(connection)
          this.props.device(paired[flag])
          this.readInterval = setInterval(() => this.performRead(paired[flag]), 5000);
        }
      }
    } catch (err) {
      // Nothing
    }
  }

  async checkConnection(device) {
    let connection = await device.isConnected();
    if (!connection) {
      connection = await device.connect();
    }
    return connection
  }

  async performRead(device) {
    try {
      let connection = await this.checkConnection(device);
      if (connection) {
        let available = await device.available();
        if (available > 0) {
          for (let i = 0; i < available; i++) {
            let data = await device.read();
            this.props.datain(data)
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  componentWillUnmount() {
    this.onDisconnectSubscription.remove()
    clearInterval(this.readInterval);
  }

  render() {
    return (
      <>
      </>
    );
  }
}

export default BT;