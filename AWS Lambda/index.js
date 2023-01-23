import { Connection, clusterApiUrl, sendAndConfirmRawTransaction } from "@solana/web3.js";

let connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

function base64ToArrayBuffer(base64) {
    var binary_string = Buffer.from(base64, "base64");
    return (binary_string)
}

export const handler = async (event) => {
    if (event.payload === "Z1V0QmsvY2s=") {
        let recentBlockhash = await connection.getRecentBlockhash();
        var raw = JSON.stringify({
            "payload_raw": Buffer.from(recentBlockhash.blockhash,'utf8').toString('base64'),
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
            fetch("https://console.helium.com/api/v1/down/xxxxx", requestOptions)
                .then(response => response.text())
                .then(result => resolve(result))
                .catch(error => reject(error));
        })
    }
    else {
        let transaction = base64ToArrayBuffer(event.payload)
        let res = await sendAndConfirmRawTransaction(connection, transaction);
        const response = {
            statusCode: 200,
            body: res,
        };
        return response;
    }
};
