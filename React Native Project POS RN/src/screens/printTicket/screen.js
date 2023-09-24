import React, {Component} from 'react';
import {
  Dimensions,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import ContextModule from '../../utils/contextModule';
import QRCode from 'react-native-qrcode-svg';
import reactAutobind from 'react-autobind';
import checkMark from '../../assets/checkMark.png';
import {logo} from './components/logo';
import GlobalStyles from '../../styles/styles';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNPrint from 'react-native-print';
import Renders from '../../assets/logo.png';

class PrintTicket extends Component {
  constructor(props) {
    super(props);
    this.state = {
      printData: '',
    };
    reactAutobind(this);
    this.svg = null;
  }

  static contextType = ContextModule;

  async getDataURL() {
    return new Promise(async (resolve, reject) => {
      this.svg.toDataURL(async data => {
        this.setState(
          {
            printData: 'data:image/png;base64,' + data,
          },
          () => resolve('ok'),
        );
      });
    });
  }

  render() {
    const styles = StyleSheet.create({
      buttonStyle: {
        backgroundColor: '#00e599',
        borderRadius: 50,
        padding: 8,
        marginTop: 8,
        width: Dimensions.get('window').width * 0.9,
        alignItems: 'center',
        fontSize: 24,
      },
    });

    return (
      <>
        <View
          style={[
            GlobalStyles.header,
            {
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            },
          ]}>
          <View style={GlobalStyles.headerItem}>
            <Image
              source={Renders}
              alt="Cat"
              style={{width: 304 / 8, height: 342 / 8, marginLeft: 20}}
            />
          </View>
          <View style={GlobalStyles.headerItem}>
            <Pressable
              style={GlobalStyles.buttonLogoutStyle}
              onPress={() => this.props.navigation.navigate('Login')}>
              <Text style={{color: 'white', fontSize: 20, fontWeight: 'bold'}}>
                Lock
              </Text>
            </Pressable>
          </View>
        </View>
        <SafeAreaView style={GlobalStyles.main}>
          <View
            style={{
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'space-evenly',
              alignItems: 'center',
            }}>
            <Image
              source={checkMark}
              alt="check"
              style={{width: 200, height: 200}}
            />
            <Text
              style={{
                textShadowRadius: 1,
                fontSize: 28,
                fontWeight: 'bold',
                color: '#00e599',
                paddingTop: 10,
              }}>
              Validated
            </Text>
            <Pressable
              onPress={() =>
                Linking.openURL(
                  `https://solana.fm/tx/${this.context.value.transactionData.signature}?cluster=mainnet-solanafmbeta`,
                )
              }>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#d820f9',
                  textAlign: 'center',
                }}>
                View on Explorer
              </Text>
            </Pressable>
            <Pressable
              style={styles.buttonStyle}
              onPress={async () => {
                await this.getDataURL();
                const results = await RNHTMLtoPDF.convert({
                  html: `
                                    <div style="text-align: center;">
                                        <img src='${logo}' width="500px"></img>
                                        <h1 style="font-size: 3rem;">--------- Original Reciept ---------</h1>
                                        <h1 style="font-size: 3rem;">Date: ${new Date().toLocaleDateString()}</h1>
                                        <h1 style="font-size: 3rem;">------------------ • ------------------</h1>
                                        <h1 style="font-size: 3rem;">Solana Pay</h1>
                                        <h1 style="font-size: 3rem;">Amount: ${
                                          this.context.value.transactionData.amount.toString() +
                                          ' ' +
                                          this.context.value.transactionData
                                            .token
                                        }</h1>
                                        ${
                                          this.context.value.transactionData
                                            .memo
                                            ? `<h1 style="font-size: 3rem;">Memo: ${this.context.value.transactionData.memo}</h1>`
                                            : ``
                                        }
                                        <h1 style="font-size: 3rem;">------------------ • ------------------</h1>
                                        <img src='${
                                          this.state.printData
                                        }'></img>
                                    </div>
                                    `,
                  fileName: 'print',
                  base64: true,
                });
                await RNPrint.print({filePath: results.filePath});
              }}>
              <Text style={{color: 'white', fontSize: 24, fontWeight: 'bold'}}>
                Print Receipt
              </Text>
            </Pressable>
            <Pressable
              style={styles.buttonStyle}
              onPress={() => this.props.navigation.goBack()}>
              <Text style={{color: 'white', fontSize: 24, fontWeight: 'bold'}}>
                Done
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
        <View style={{position: 'absolute', bottom: -500}}>
          <QRCode
            value={'https://solscan.io/tx/' + this.context.value.transactionData.signature}
            size={Dimensions.get('window').width * 0.7}
            ecl="L"
            getRef={c => (this.svg = c)}
          />
        </View>
      </>
    );
  }
}

export default PrintTicket;
