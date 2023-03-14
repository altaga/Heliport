
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE) [<img src="https://img.shields.io/badge/View-Video-red">](https://youtu.be/33bW-RTs9Do)

# Heliport

<img src="https://i.ibb.co/G2FvkzC/New-Project.png" width="400">

# APKs:

SAGA APK: [LINK](./React%20Native%20Project%20SAGA%20APK/app-release.apk)

POS APK: [LINK](./React%20Native%20Project%20POS%20APK/app-release.apk)

# Here is our main demo video: 

[![Demo](https://i.ibb.co/g4W3ypx/image.png)](https://youtu.be/33bW-RTs9Do)

# Materials:

Hardware:
- [XIAO Board](https://www.seeedstudio.com/Seeed-XIAO-BLE-nRF52840-p-5201.html)
- [Expansion Base for XIAO](https://www.seeedstudio.com/Seeeduino-XIAO-Expansion-board-p-4746.html)
- [Grove Wio-E5](https://www.seeedstudio.com/Grove-LoRa-E5-STM32WLE5JC-p-4867.html)
- [SAGA Phone](https://solanamobile.com/es/hardware)

Software:
- [Arduino IDE](https://www.arduino.cc/en/software)
- [Android Studio](https://developer.android.com/studio)
- [React Native Framework](https://reactnative.dev/)

Cloud and Web Services:
- [Helium Console](https://console.helium.com/)
- [AWS IoT](https://aws.amazon.com/iot/)
- [AWS Lambda](https://aws.amazon.com/lambda/)
- [SolanaFM API](https://docs.solana.fm/)

# Connection Diagram:

This is the connection diagram of the system:

<img src="https://i.ibb.co/Tr8tG06/scheme-drawio-1.png">

# SolanaFM:

As part of our project, we decided to use the SolanaFM APIs to obtain balances in real time of all the wallets from the cell phone when there is a cellular network available. Or directly from the lambda, when we have the LoRaWAN network available.

    async getBalance(address) {
        return new Promise((resolve) => {
            var myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            var raw = JSON.stringify({
                "accountHashes": [
                    address.toBase58()
                ],
                "fields": [
                    "data",
                    "onchain"
                ]
            });
            var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: raw,
                redirect: 'follow'
            };
            fetch("https://api.solana.fm/v0/accounts", requestOptions)
                .then(response => response.text())
                .then(result => {
                    resolve(JSON.parse(result).result[0].onchain.lamports)
                })
                .catch(error => console.log('error', error));
        })
    }

These codes are implemented in the following code files.

- [Saga React Native App](./React%20Native%20Project%20SAGA/src/screens/main.js)

- [POS React Native App](./React%20Native%20Project%20POS/src/screens/main.js)

- [Lambda](./AWS%20Lambda/index.js)

More details about the SolanaFM API

- https://docs.solana.fm/

# React Native SAGA Dapp:

In order to create this new method of signing offline and sending transactions via LoRaWAN, we needed a Dapp that is compatible with this new system, so we created our own Heliport Dapp as a native Android application for SAGA phone.

<img src="https://i.ibb.co/xDVfx7n/vlcsnap-2023-03-12-14h05m17s357.png" width="32%"> <img src="https://i.ibb.co/t3S9Wnt/vlcsnap-2023-03-12-14h05m28s504.png" width="32%"> <img src="https://i.ibb.co/sg0Q5nw/vlcsnap-2023-03-12-14h10m38s662.png" width="32%">

This Dapp works entirely on mainnet and has all the functions of a traditional wallet, get balances, get current SOL price, receive, manage and send assets via solana mainnet, with integrated SeedVault, fully offline (via LoRaWAN network).

<img src="https://i.ibb.co/mTxHHrM/vlcsnap-2023-03-12-15h18m44s598.png" width="32%"> <img src="https://i.ibb.co/Hx0SX5Q/vlcsnap-2023-03-12-14h10m44s614.png" width="32%">  <img src="https://i.ibb.co/NLK27dc/vlcsnap-2023-03-12-15h21m30s558.png" width="32%">

Also, this Dapp has the ability to send transactions via Bluetooth Low Energy (BLE) to our device with LoRaWAN, as long as the device is close to the cell phone, for example when we are in airplane mode and with Bluetooth turned on, only the LoRaWAN transaction will appear available.

<img src="https://i.ibb.co/k2RpSf6/vlcsnap-2023-03-12-14h13m24s859.png" width="32%"> <img src="https://i.ibb.co/K93x7Np/vlcsnap-2023-03-12-15h24m25s483.png" width="32%"> <img src="https://i.ibb.co/mh6PDQz/vlcsnap-2023-03-12-15h26m02s852.png" width="32%">

The transaction signing process is done through the Mobile Wallet Adapter with Solflare, in the future we seek to give direct support to SeedVault in React Native.

<img src="https://i.ibb.co/7vbkn3Y/vlcsnap-2023-03-12-14h18m49s716.png" width="32%"> <img src="https://i.ibb.co/R6ckN9B/vlcsnap-2023-03-12-14h19m49s531.png" width="32%"> <img src="https://i.ibb.co/NS59CSp/seeed.png" width="32%"> 

NOTE: In order to sign a transaction and it is valid for the blockchan, we always need the last Solana blockhash which we will ask the device for each time we send the transaction. Nevertheless, in the future we could implement a Durable Nonce Transaction, so that the account does not require the last blockhash and the transaction is even more agile by not making the request to the Node for the recentBlockhash. Or the transaction could even be saved if the blockchain was in a downtime and sent once the online status was recovered.

https://solanacookbook.com/references/offline-transactions.html#durable-nonce

# React Native POS Dapp:

This Dapp serves as an interface for POS devices, printing receipts, checking the balance and checking that the transaction has been executed correctly in the blockchain through our LoRaWAN Device.

<img src="https://i.ibb.co/ZzLycMr/vlcsnap-2023-03-12-15h41m11s156.png" width="32%"> <img src="https://i.ibb.co/wyDmch9/vlcsnap-2023-03-12-15h42m38s967.png" width="32%"> <img src="https://i.ibb.co/7XcG9B4/vlcsnap-2023-03-12-15h58m01s671.png" width="32%"> 

Thanks to this we can carry out a 100% offline payment system, only with the infrastructure of the Helium network.

<img src="./Images/printing.gif"> 

# LoRaWAN Device:

The purpose of the LoRaWAN device is to receive RPC method responses and send RPC calls via BLE from any Heliport Dapp and broadcast to the Helium LoRaWAN network.

<img src="https://i.ibb.co/sbG77Pw/scheme2-drawio.png">

The data that is sent from the device to the Helium console is divided into two groups:

- RPC Method requests: are all the data that are requested from the solana blockchain and these are received in the device through Downlinks, some methods implemented at the moment, or modified versions of this methods due to data cap allowing us to send and receive LoRaWAN, are the following. 
  
  - getBalance, Obtain balances and SOL market price.
  - getBlock, Gets the last blockhash to be able to sign the transaction.
  - sendTransaction, Send the signed transaction to the solana mainnet

- For more information about solana api methods, please go to the following link.
  - https://docs.solana.com/api/http

- You can go into details of uplinks and downlinks in the official helium documentation.
  - https://docs.helium.com/use-the-network/console/integrations/http/#downlink-send-data-to-device

Finally, for the proper functioning of the device, we recommend putting it in a case that protects it from the environment and a battery to avoid disconnections in case of power failures.

<img src="https://i.ibb.co/PY7hnhz/vlcsnap-2023-03-12-16h47m07s329.png">

# Helium Console:

The helium network is in charge of all device management, data management and integrations, for this project we must highlight 2 basic integrations that we have in our console.

<img src="https://i.ibb.co/0B7vWZW/image.png">

- The AWS integration is responsible for sending all the data received from our device to [AWS IoT](#aws-iot), the setup of this integration is explained in detail in the official helium documentation.

  - https://docs.helium.com/use-the-network/console/integrations/aws-iot-core

    <img src="https://i.ibb.co/j565bBG/image.png">

- The integration of Cargo is made to access the Helium Console API and with it send the Downlinks to the devices when they make the request, this process of sending the Downlink to the device through the API will be detailed in [AWS Lambda](#aws-lambda).

  - https://docs.helium.com/use-the-network/console/integrations/cargo
  - https://docs.helium.com/use-the-network/console/integrations/http/#downlink-send-data-to-device

    <img src="https://i.ibb.co/3v2pGyQ/New-Project-1.png">

# AWS IoT:

Once the information arrives at AWS IoT, we can use it correctly. In this case, to make requests to the RPC, we needed to activate a lambda (serverless function) each time data arrived from one of the devices, which depending on the type of data that will arrive, send the transaction to the blockchain or send data through a downlink to the device.

<img src="https://i.ibb.co/KXnscQZ/image.png">

To send the data to a lambda it is necessary to create a rule, this rule, as shown below, sends all the messages received from the topic /helium/devices to the lambda. However, it is possible to preprocess them in the SQL statement.

<img src="https://i.ibb.co/cQDz6BZ/image.png">

# AWS Lambda:

Once the data reaches the lambda, it is processed by methods or transactions.

- Methods: Each of the methods that we want to implement in the system, we must do it manually since these can have very long responses that it is not possible for us to send complete over LoRaWAN, so we must only filter the essential data for the client, all the methods are sent through port 1 of Helium.

      if (event.port === 1) // Methods Port
      { 
        let command = JSON.parse(Buffer.from(event.payload, 'base64').toString())
        if (command.method === "getBalances") {
          let res = await balances(new PublicKey(command.params[0]))
          res = await downLink(res) // Send downlink response
          return res
        }
      }

- Transactions: These are passed directly as RawTransactions to our RPC and allows us to execute the instruction directly on mainnet solana as shown in the final demo.

      let transaction = base64ToArrayBuffer(event.payload)
      let res = await sendAndConfirmRawTransaction(connection, transaction);
      const response = {
          statusCode: 200,
          body: res,
      };
      return response;

# Prototype:

Device:

<img src="https://i.ibb.co/nPVk8ym/image.png" height="300px">

SAGA Phone:

<img src="https://i.ibb.co/HFDdzRT/image.png" height="300px">

POS system:

<img src="https://i.ibb.co/zRz2xYM/image.png" height="300px">

# Our DEMO:

[![Demo](https://i.ibb.co/g4W3ypx/image.png)](https://youtu.be/33bW-RTs9Do)

# References:

https://solana.com/
https://docs.solana.com/
https://www.helium.foundation/
https://explorer.helium.com/



# Table of contents

- [Heliport](#heliport)
- [APKs:](#apks)
- [Here is our main demo video:](#here-is-our-main-demo-video)
- [Materials:](#materials)
- [Connection Diagram:](#connection-diagram)
- [SolanaFM:](#solanafm)
- [React Native SAGA Dapp:](#react-native-saga-dapp)
- [React Native POS Dapp:](#react-native-pos-dapp)
- [LoRaWAN Device:](#lorawan-device)
- [Helium Console:](#helium-console)
- [AWS IoT:](#aws-iot)
- [AWS Lambda:](#aws-lambda)
- [Prototype:](#prototype)
- [Our DEMO:](#our-demo)
- [References:](#references)
- [Table of contents](#table-of-contents)
