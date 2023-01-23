# Heliport

<img src="https://i.ibb.co/G2FvkzC/New-Project.png" width="400">

# Introduction:



# Materials:

Hardware:
- [WiFi LoRa 32 V2](https://heltec.org/project/wifi-lora-32/)
- [Android Phone](https://www.android.com/phones/)

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

<img src="https://i.ibb.co/Sv89yYc/sheme-drawio.png">

# React Native Wallet:

Para poder crear este nuevo metodo de firmar offline y mandar las trasacciones por LoRaWAN necesitabamos una wallet que fuera compatible con este nuevo sistema, asi que se creamos nuestra propia wallet Heliport como aplicacion nativa de Android.

<img src="https://i.ibb.co/zNdnKh6/vlcsnap-2023-01-22-16h32m42s372.png" width="32%"> <img src="https://i.ibb.co/YkRRSn1/vlcsnap-2023-01-22-16h32m51s030.png" width="32%"> <img src="https://i.ibb.co/2kyHgfM/vlcsnap-2023-01-22-16h33m02s621.png" width="32%">

Esta wallet funciona totalmente en mainnet y tiene todas las funciones de una wallet tradicional para recibir, gestionar y mandar assets.

<img src="https://i.ibb.co/Mf0NGFN/vlcsnap-2023-01-22-16h33m10s738.png" width="32%"> <img src="https://i.ibb.co/nmM20m2/vlcsnap-2023-01-22-16h33m21s583.png" width="32%"> <img src="https://i.ibb.co/mCNDYvN/vlcsnap-2023-01-22-16h33m33s966.png" width="32%">

Sin embargo esta wallet tiene la capacidad de mandar las trasacciones mediante Bluetooth a nuestro device con LoRaWAN, siempre y cuando este el device cerca del celular, por ejemplo cuando estamos en modo avion y con el bluetooth encendido solo aparecera disponible la transaccion por LoRaWAN.

<img src="https://i.ibb.co/yYsGQq6/vlcsnap-2023-01-22-17h45m01s784.png" width="32%"> <img src="https://i.ibb.co/fqXG5tS/vlcsnap-2023-01-22-17h43m33s976.png" width="32%"> <img src="https://i.ibb.co/HN1MngP/vlcsnap-2023-01-22-17h45m28s235.png" width="32%">

NOTA: Para lograr firmar una trasaccion y esta sea valida para la blockchan, siempre necesitamos el last solana blockhash el cual le pediremos al device cada vez que mandemos la trasaccion.

# LoRaWAN Device:

El device de LoRaWAN tiene como finalidad recibir los datos y comandos por bluetooth desde cualquier celular y comunicarse a la red LoRaWAN de Helium.

<img src="https://i.ibb.co/HXX2V91/Copy-of-sheme-drawio.png">

Los datos que son mandados desde el device a Helium console se dividen en dos grupos:

- Peticiones de datos: son todos los datos que se piden a la blockchain de solana y estos son recibidos en el device mediante Downlinks. Puedes entrar en detalles de esto en la documentacion oficial de helium.
  
  - https://docs.helium.com/use-the-network/console/integrations/http/#downlink-send-data-to-device

- Envio de transacciones: son las trasacciones que van directamente a ser ejecutadas en Solana Blockchain a travez de nuestra integracion en helium Network.

Por ultimo para el buen funcionamiento del device recomendamos ponerlo en una case que lo proteja del ambiente y una bateria para evitar desconexiones en caso de fallas en la alimentacion.

<img src="https://i.ibb.co/VSYw6Tt/vlcsnap-2023-01-22-18h17m05s443.png">

# Helium Console:

La red de helium se encarga de todo el manejo de devices, manejo de datos e integraciones, para este proyecto hay que destacar 2 integraciones basicas que tenemos en nuestra consola.

<img src="https://i.ibb.co/0B7vWZW/image.png">

- La integracion de AWS se encarga de mandar todos los datos recibidos desde nuestro device a [AWS IoT](#aws-iot), el setup de esta integracion esta explicado a detalle en la docmentacion oficial de helium.

  - https://docs.helium.com/use-the-network/console/integrations/aws-iot-core

    <img src="https://i.ibb.co/j565bBG/image.png">

- La integracion de Cargo esta hecha para accder a la API de Helium Console y con ella mandar los Downlinks a los devices cuando estos hacen la peticion, este proceso de mandar por la API el Downlink al device estara a detalle en [AWS Lambda](#aws-lambda).

  - https://docs.helium.com/use-the-network/console/integrations/cargo
  - https://docs.helium.com/use-the-network/console/integrations/http/#downlink-send-data-to-device

    <img src="https://i.ibb.co/3v2pGyQ/New-Project-1.png">

# AWS IoT:

Una vez llegada la informacion a AWS IoT podemos hacer uso de ella de forma correcta, en este caso para hacer peticiones a la RPC ocupabamos activar cada vez que llegara un dato de uno de los devices una lambda (funcion serverless) la cual segun el tipo de dato que llegara, mandar la trasaccion a la blockchain o mandar un dato mediante downlink al device.

<img src="https://i.ibb.co/KXnscQZ/image.png">

Para mandar los datos a una lambda es necesario crear una rule, esta rule asi como se muestra aqui abajo manda todos los mensajes recibidos del topic /helium/devices a la lambda. Sin embargo es posible realizar un preprocesamiento de los mismos en el SQL statement.

<img src="https://i.ibb.co/cQDz6BZ/image.png">

# AWS Lambda:

Ya una vez llegan los datos a la lambda estos son procesados por comandos o transacciones.

- Comandos: aunque podemos realizar cualquier comando que se pueda mandar a un Solana RPC Mainnet, solo tenemos configurado el getRecentBlockhash con el fin de mandarlo por Downlink al device y este lo envie al telefono.

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

- Transacciones: Estas pasan directamente como RawTransactions a nuestro RPC y nos permite ejecutar la instruccion directamente en solana mainnet como se muestra en el demo final.

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




# References:




# Table of contents

- [Heliport](#heliport)
- [Introduction:](#introduction)
- [Materials:](#materials)
- [Connection Diagram:](#connection-diagram)
- [React Native Wallet:](#react-native-wallet)
- [LoRaWAN Device:](#lorawan-device)
- [Helium Console:](#helium-console)
- [AWS IoT:](#aws-iot)
- [AWS Lambda:](#aws-lambda)
- [Prototype:](#prototype)
- [Our DEMO:](#our-demo)
- [Business Opportunity:](#business-opportunity)
- [References:](#references)
- [Table of contents](#table-of-contents)
