import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction } from '@solana/web3.js';
import { sign } from "tweetnacl"
import React, { Component } from 'react';
import { Dimensions, Pressable, View, Text } from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';

class Test extends Component {
    constructor(props) {
        super(props);

    }

    componentDidMount() {

    }

    componentDidUpdate(prevProps, prevState) {

    }

    componentWillUnmount() {

    }

    async sign() {
        const session = await EncryptedStorage.getItem("userWallet");
        if (session !== undefined) {
            console.log("start")
            let connection = new Connection(clusterApiUrl("devnet"), "confirmed");
            let secretKey1 = Uint8Array.from(JSON.parse(session).wallet.split(','))
            let payer = Keypair.fromSecretKey(secretKey1);
            let recentBlockhash = await connection.getRecentBlockhash();
            let transaction = new Transaction({
                recentBlockhash: recentBlockhash.blockhash,
                feePayer: payer.publicKey,
            });

            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: payer.publicKey,
                    toPubkey: "Dt1eXm3FffphcvnA6xiUnmo4Q3vD4EFiBNyYddaoPShp",
                    lamports: Math.round(LAMPORTS_PER_SOL / 100),
                })
            );

            let transactionBuffer = transaction.serializeMessage();
            let signature = sign.detached(transactionBuffer, payer.secretKey);
            transaction.addSignature(payer.publicKey, signature);
            let isVerifiedSignature = transaction.verifySignatures();
            console.log(`The signatures were verifed: ${isVerifiedSignature}`);
            console.log(transaction.serialize().toString('hex').replace(/(.)(.)/g, '$1$2 '))
        }
    }

    render() {
        return (
            <View>
                <Pressable onPress={() => this.sign()} style={{ width: Dimensions.get("window").width, height: Dimensions.get("window").height, backgroundColor: "black", color: "white" }}>
                    <Text style={{ position: "relative", alignContent: "center" }}>
                        Test
                    </Text>
                </Pressable>
            </View>
        );
    }
}

Test.propTypes = {

};

export default Test;