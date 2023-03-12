
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE) [<img src="https://img.shields.io/badge/View-Video-red">](PENDING)

# Heliport

<img src="https://i.ibb.co/G2FvkzC/New-Project.png" width="400">

## Here is our main demo video: 

[![Demo](https://i.ibb.co/g4W3ypx/image.png)](PENDING...)


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

# Connection Diagram:

This is the connection diagram of the system:

<img src="https://i.ibb.co/LpNJVMS/scheme-drawio.png">

# React Native SAGA Dapp:

In order to create this new method of signing offline and sending transactions via LoRaWAN, we needed a Dapp that is compatible with this new system, so we created our own Heliport Dapp as a native Android application for SAGA phone.

<img src="https://i.ibb.co/xDVfx7n/vlcsnap-2023-03-12-14h05m17s357.png" width="32%"> <img src="https://i.ibb.co/t3S9Wnt/vlcsnap-2023-03-12-14h05m28s504.png" width="32%"> <img src="https://i.ibb.co/sg0Q5nw/vlcsnap-2023-03-12-14h10m38s662.png" width="32%">

This Dapp works entirely on mainnet and has all the functions of a traditional wallet, get balances, get current SOL price, receive, manage and send assets via solana mainnet, with integrated SeedVault, fully offline (via LoRaWAN network).

<img src="https://i.ibb.co/mTxHHrM/vlcsnap-2023-03-12-15h18m44s598.png" width="32%"> <img src="https://i.ibb.co/Hx0SX5Q/vlcsnap-2023-03-12-14h10m44s614.png" width="32%">  <img src="https://i.ibb.co/NLK27dc/vlcsnap-2023-03-12-15h21m30s558.png" width="32%">

However, this Dapp has the ability to send transactions via Bluetooth Low Energy (BLE) to our device with LoRaWAN, as long as the device is close to the cell phone, for example when we are in airplane mode and with Bluetooth turned on, only the LoRaWAN transaction will appear available.

<img src="https://i.ibb.co/k2RpSf6/vlcsnap-2023-03-12-14h13m24s859.png" width="32%"> <img src="https://i.ibb.co/K93x7Np/vlcsnap-2023-03-12-15h24m25s483.png" width="32%"> <img src="https://i.ibb.co/mh6PDQz/vlcsnap-2023-03-12-15h26m02s852.png" width="32%">

El proceso de firma de la transaccion se hace atravez del Mobile Wallet Adapter con Solflare, en el futuro buscamos darle soporte directo al SeedVault en React Native.

<img src="https://i.ibb.co/7vbkn3Y/vlcsnap-2023-03-12-14h18m49s716.png" width="32%"> <img src="https://i.ibb.co/R6ckN9B/vlcsnap-2023-03-12-14h19m49s531.png" width="32%"> <img src="https://i.ibb.co/NS59CSp/seeed.png" width="32%"> 

NOTE: In order to sign a transaction and it is valid for the blockchan, we always need the last Solana blockhash which we will ask the device for each time we send the transaction.

# React Native POS Dapp:

Esta Dapp sirve como interfaz para devices POS, impresion de recibos, revisar el balance y revision de que la transaccion haya sido ejecutada correctamente en la blockchain atravez de nuestro Device de LoRaWAN.

<img src="https://i.ibb.co/ZzLycMr/vlcsnap-2023-03-12-15h41m11s156.png" width="32%"> <img src="https://i.ibb.co/wyDmch9/vlcsnap-2023-03-12-15h42m38s967.png" width="32%"> <img src="https://i.ibb.co/7XcG9B4/vlcsnap-2023-03-12-15h58m01s671.png" width="32%"> 

Gracias a esto podemos realizar un sistema de pagos 100% offline, solo con la infraestructura de la red de Helium.

<img src="./Images/printing.gif"> 

# LoRaWAN Device:

The purpose of the LoRaWAN device is to receive data and commands via bluetooth from any cell phone and communicate to the Helium LoRaWAN network.

<img src="https://i.ibb.co/HXX2V91/Copy-of-sheme-drawio.png">

The data that is sent from the device to the Helium console is divided into two groups:

- Data requests: are all the data that are requested from the solana blockchain and these are received in the device through Downlinks. You can go into details of this in the official helium documentation.
  
  - https://docs.helium.com/use-the-network/console/integrations/http/#downlink-send-data-to-device

- Transaction Sending (I know, the name is not good): are the transactions that will be directly executed in Solana Blockchain through our integration in helium Network.

Finally, for the proper functioning of the device, we recommend putting it in a case that protects it from the environment and a battery to avoid disconnections in case of power failures.

<img src="https://i.ibb.co/VSYw6Tt/vlcsnap-2023-01-22-18h17m05s443.png">

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

Once the data reaches the lambda, it is processed by commands or transactions.

- Commands: although we can carry out any command that can be sent to a Solana RPC Mainnet, we only have the getRecentBlockhash configured in order to send it downlink to the device and it will send it to the phone.

        if (event.payload === "Z2V0QmxvY2s=") { // Get Recent Blockhash Base64 Command
            let recentBlockhash = await connection.getRecentBlockhash();
            recentBlockhash = Buffer.from(recentBlockhash.blockhash,'utf8');
            var raw = JSON.stringify({
                "payload_raw": recentBlockhash.toString('base64'),
                "port": 2,
                "confirmed": false
            });
            var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: raw,
                redirect: 'follow'
            };
            return new Promise((resolve, reject) => {
            fetch("https://console.helium.com/api/v1/down/XXXXX/XXXXX", requestOptions)
                .then(response => response.text())
                .then(result => resolve(result))
                .catch(error => reject(error));
            })
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
<img src="https://i.ibb.co/rG114sT/20230121-163920.jpg">

Phone:
<img src="https://i.ibb.co/pvXwdww/Vlcsnap-2023-01-22-19h14m37s335.png">

# Our DEMO:

https://youtu.be/GNk0lvfcLr4


# References:




# Table of contents

- [Heliport](#heliport)
  - [Here is our main demo video:](#here-is-our-main-demo-video)
- [Materials:](#materials)
- [Connection Diagram:](#connection-diagram)
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
