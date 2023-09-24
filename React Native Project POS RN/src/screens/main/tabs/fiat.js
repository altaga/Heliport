import React, { Component } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import ContextModule from '../../../utils/contextModule';
import axios from 'axios';

class Fiat extends Component {
    constructor(props) {
        super(props);
        this.axios = axios.request
        this.CancelToken = require('axios').CancelToken;
        this.source = this.CancelToken.source();
        this.sync = null
    }

    static contextType = ContextModule;

    syncAccount() {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://api.stripe.com/v1/customers/${this.context.value.fiatWallet}`,
            headers: { 
                'Authorization': this.context.value.fiatBearer
            },
            cancelToken: this.source.token
          };
          this.axios(config)
            .then((response) => {
                this.context.setValue({
                    fiatBalance: parseFloat(response.data.balance) / 100
                })
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    syncTransactions() {
        var config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://api.stripe.com/v1/balance_transactions',
            headers: {
                'Authorization': this.context.value.fiatBearer
            },
            cancelToken: this.source.token
        };
        this.axios(config)
            .then((response) => {
                const fiatTransactions = response.data.data.filter((item) => item.description.split(",")[0] === this.context.value.fiatWallet)
                this.context.setValue({
                    fiatTransactions
                })
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    componentDidMount() {
        this.syncTransactions()
        this.syncAccount()
        this.sync = setInterval(() => {
            this.syncTransactions()
            this.syncAccount()
        }, 10000);
    }

    componentWillUnmount() {
        if (this.source) {
            this.source.cancel("Component got unmounted");
        }
        clearInterval(this.sync)
    }

    render() {
        const hr = function () {
            return <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 24, paddingBottom: 20 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#d820f9' }} />
                <View>
                    <Text style={{ width: 50, textAlign: 'center', color: "#d820f9" }}>•</Text>
                </View>
                <View style={{ flex: 1, height: 1, backgroundColor: '#d820f9' }} />
            </View>
        }
        return (
            <>
                <View style={{ justifyContent: "center", alignItems: "center" , width:Dimensions.get("window").width }}>
                    <Text style={{ color: "white", fontSize: 22, paddingTop: 20 }}>
                        Wallet: {this.context.value.fiatBalance} USD
                    </Text>
                    {
                        hr()
                    }
                    <View style={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ color: "white", fontSize: 24, padding: 8 }}>
                            Transactions
                        </Text>
                        <View style={{ height: Dimensions.get("window").height * 0.5 }}>
                            <ScrollView>
                                {
                                    this.context.value.fiatTransactions.map((item, index) => {
                                        return <View key={index} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: Dimensions.get("window").width }}>
                                            <Text style={{ color: "white", fontSize: 20, padding: 10, textAlign: "center" }}>
                                                <Text>
                                                    {"Type\n"}
                                                </Text>
                                                <Text style={{ color: "white", fontSize: 20, padding: 10, textAlign: "center" }}>
                                                    {
                                                        item.description.split(",")[1] === "0" ?
                                                            "deposit" : "charge"
                                                    }
                                                </Text>
                                            </Text>
                                            <Text style={{ color: "white", fontSize: 20, padding: 10, textAlign: "center" }}>
                                                <Text>
                                                    {"Status\n"}
                                                </Text>
                                                <Text style={{ color: "white", fontSize: 20, padding: 10, textAlign: "center" }}>
                                                    finished
                                                </Text>
                                            </Text>
                                            <Text style={{ color: "white", fontSize: 20, padding: 10, textAlign: "center" }}>
                                                <Text>
                                                    {"Amount\n"}
                                                </Text>
                                                {
                                                    item.description.split(",")[1] === "0" ?
                                                        <Text style={{ color: "green", fontSize: 20, padding: 10, textAlign: "center" }}>
                                                            {item.amount / 100}{" "}{item.currency}
                                                        </Text>
                                                        :
                                                        <Text style={{ color: "red", fontSize: 20, padding: 10, textAlign: "center" }}>
                                                            {item.amount / 100}{" "}{item.currency}
                                                        </Text>
                                                }
                                            </Text>
                                        </View>
                                    })
                                }
                            </ScrollView>
                        </View>
                    </View>
                </View>
            </>
        );
    }
}

export default Fiat;