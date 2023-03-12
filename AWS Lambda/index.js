import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import fetch from 'node-fetch';

let connection = new Connection("RPC_URL")
var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

function base64ToArrayBuffer(base64) {
    var binary_string = Buffer.from(base64, "base64");
    return (binary_string)
}

async function getSolanaUSD() {
    return new Promise((resolve) => {
        var myHeaders = new Headers();
        var requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };
        fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", requestOptions)
            .then(response => response.text())
            .then(result => {
                resolve(JSON.parse(result).solana.usd)
            })
            .catch(error => console.log('error', error));
    })
}

async function getBalance(address) {
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
                resolve(JSON.parse(result).result[0].onchain?.lamports ?? 0)
            })
            .catch(error => console.log('error', error));
    })
}

async function balances(account) {
    let [sol, solUSDC, usdc, usdt] = await Promise.all([
        getBalance(account),
        getSolanaUSD(),
        connection.getTokenAccountsByOwner(account, { mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') }), // USDC Address
        connection.getTokenAccountsByOwner(account, { mint: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') })// USDT Address
    ])
    let [usdcTemp, usdtTemp] = await Promise.all([
        usdc.value[0]?.pubkey ? connection.getTokenAccountBalance(usdc.value[0]?.pubkey) : 0,
        usdt.value[0]?.pubkey ? connection.getTokenAccountBalance(usdt.value[0]?.pubkey) : 0
    ])
    usdc = usdcTemp
    usdt = usdtTemp
    sol = sol / LAMPORTS_PER_SOL;
    usdc = usdc.value?.uiAmount ?? 0
    usdt = usdt.value?.uiAmount ?? 0
    return [sol, solUSDC, usdc, usdt].toString()
}

async function downLink(data) {
    var raw = JSON.stringify({
        "payload_raw": Buffer.from(data, 'utf8').toString('base64'),
        "port": 3,
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

export const handler = async (event) => {
    console.log(JSON.stringify(event))
    if (event.port === 1) { // Commands Port
        let command = JSON.parse(Buffer.from(event.payload, 'base64').toString())
        if (command.method === "getBalances") {
            let res = await balances(new PublicKey(command.params[0]))
            res = await downLink(res)
            return res
        }
        else if (command.method === "getBlock") {
            let recentBlockhash = await connection.getRecentBlockhash();
            recentBlockhash = await downLink(recentBlockhash.blockhash)
            return recentBlockhash
        }
        else if (command.method === "getLastTransaction") {
            let temp = []
            let recentBlockhash = await connection.getConfirmedSignaturesForAddress2(new PublicKey(command.params[0]),{limit:1 });
            let res = recentBlockhash[0]?.signature ?? "ok"
            if(res ==="ok"){
                res = await downLink(res)
                return res
            }
            let temp1 = res
            res = await connection.getTransaction(res)
            res = (Math.abs(res.meta.postBalances[0] - res.meta.preBalances[0]) - 5000) / 1000000000
            temp.push(res)
            temp.push(temp1)
            res = await downLink(temp.toString())
            return res
        }
    }
    if (event.port === 2) { // Commands Port
        let transaction = base64ToArrayBuffer(event.payload)
        let res = await connection.sendRawTransaction(transaction);
        const response = {
            statusCode: 200,
            body: res,
        };
        return response;
    }
    return "NaN"
};