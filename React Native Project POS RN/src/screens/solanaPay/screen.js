import { encodeURL, findReference } from '@solana/pay';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import reactAutobind from 'react-autobind';
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FormItem, Picker } from 'react-native-form-component';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import NfcManager, { Ndef, NfcEvents } from 'react-native-nfc-manager';
import RNPrint from 'react-native-print';
import QRCodeStyled from 'react-native-qrcode-styled';
import QRCode from 'react-native-qrcode-svg';
import IconIonIcons from 'react-native-vector-icons/Ionicons';
import checkMark from '../../assets/checkMark.png';
import Renders from '../../assets/logo.png';
import { splTokens } from '../../const/constValues';
import GlobalStyles from '../../styles/styles';
import ContextModule from '../../utils/contextModule';
import Cam from './components/cam';
import KeyboardAwareScrollViewComponent from './components/keyboardAvoid';
import { logo } from './components/logo';

function epsilonRound(num, zeros = 9) {
   let temp = num;
   if (typeof num === "string") {
     temp = parseFloat(num);
   }
   return (
     Math.round((temp + Number.EPSILON) * Math.pow(10, zeros)) /
     Math.pow(10, zeros)
   );
 }

class SolanaPay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      qr: '', //
      qrImage: '',
      splToken: {
        value: null,
        label: 'SOL',
      },
      amount: '',
      label: '',
      message: '',
      memo: '',
      paymentStatus: 'Pending...',
      signature: '',
      keyboardOffset: 0,
      stage: 0,
      printData: '',
      loading: false,
      publish: {
        message: '',
        topic: '',
      },
      modal: false,
      reset: false,
      addressNFT: '',
      address: '',
    };
    reactAutobind(this);
    this.interval = null;
    this.svg = null;
    this.NfcManager = NfcManager;
    this.connection = new Connection(
      'https://solana-mainnet.g.alchemy.com/v2/vfFzXAyNI8zcPqNyr8ICHXb3994JbtRa/',
      'confirmed',
    );
  }

  static contextType = ContextModule;

  componentDidMount() {}

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

  NFCreadData(data) {
    let decoded = Ndef.text.decodePayload(data.ndefMessage[0].payload);
    if (decoded.length === 44) {
      console.log({
        message: `{ "data": "${this.state.qr}" }`,
        topic: `/EffiSend/NFC/${decoded}`,
      });
      this.setState({
        publish: {
          message: `{ "data": "${this.state.qr}" }`,
          topic: `/EffiSend/NFC/${decoded}`,
        },
      });
    }
  }

  async setStateAsync(value) {
    return new Promise(resolve => {
      this.setState(
        {
          ...value,
        },
        () => resolve(),
      );
    });
  }

  async setStateAsyncDelay(value, delay) {
    return new Promise(resolve => {
      this.setState(
        {
          ...value,
        },
        () =>
          setTimeout(() => {
            resolve();
          }, delay),
      );
    });
  }

  async createTransaction() {
    let {address, addressNFT} = this.state;
    let nfts = false;
    if (addressNFT !== '') {
      let accounts = await this.connection.getParsedTokenAccountsByOwner(
        new PublicKey(address),
        {
          programId: TOKEN_PROGRAM_ID,
          filters: [
            {
              dataSize: 165,
            },
          ],
        },
        'finalized',
      );
      nfts = accounts.value
        .map(item => item.account.data.parsed.info.mint)
        .includes(addressNFT, 0);
    }
    const recipient = new PublicKey(this.context.value.publicKey);
    const splToken = this.state.splToken.value;
    const amount = new BigNumber(
      epsilonRound(parseFloat(this.state.amount) * (nfts ? 0.9 : 1))
    );
    console.log(amount);
    const reference = new Keypair().publicKey;
    const label = this.state.label;
    const message = this.state.message;
    const memo = this.state.memo;
    const url =
      this.state.splToken.label === 'SOL'
        ? encodeURL({recipient, amount, reference, label, message, memo})
        : encodeURL({
            recipient,
            amount,
            reference,
            label,
            message,
            memo,
            splToken,
          });
    await this.setStateAsyncDelay(
      {
        qr: url.toString(),
        loading: false,
        paymentStatus: 'Pending...',
        stage: 1,
      },
      100,
    );
    let signatureInfo;
    this.NfcManager.start();
    this.NfcManager.setEventListener(NfcEvents.DiscoverTag, this.NFCreadData);
    this.NfcManager.registerTagEvent();
    const {signature} = await new Promise((resolve, reject) => {
      this.interval = setInterval(async () => {
        try {
          console.log('.');
          signatureInfo = await findReference(this.connection, reference, {
            finality: 'confirmed',
          });
          clearInterval(this.interval);
          resolve(signatureInfo);
        } catch (error) {
          //console.log(error)
        }
      }, 1000);
    });
    this.NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    this.NfcManager.unregisterTagEvent();
    this.setState({paymentStatus: 'Confirmed...'});
    console.log('Confirmed...');
    try {
      const latestBlockHash = await this.connection.getLatestBlockhash();
      let res = await this.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature,
      });
      console.log(res);
      this.setState({
        paymentStatus: 'Validated',
        signature,
        qr: null,
        stage: 2,
      });
    } catch (error) {
      console.error('Payment failed', error);
      this.setState({
        paymentStatus: 'failed',
      });
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    this.NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    this.NfcManager.unregisterTagEvent();
  }

  callBackIoT = data => {
    console.log(data);
  };

  async resetCam() {
    await this.setStateAsync({reset: true});
    await this.setStateAsync({reset: false});
  }

  async setStateAsync(value) {
    return new Promise(resolve => {
      this.setState(
        {
          ...value,
        },
        () => resolve(),
      );
    });
  }

  render() {
    const styles = StyleSheet.create({
      input: {
        width: Dimensions.get('window').width * 0.9,
        paddingHorizontal: 12,
        marginBottom: 6,
        marginTop: 6,
        borderRadius: 5,
        borderColor: '#00e599',
        borderWidth: 1,
        backgroundColor: '#fff',
        color: 'black',
        fontSize: 24,
        textAlign: 'center',
      },
      inputText: {
        fontSize: 24,
        color: 'black',
        textAlign: 'center',
      },
      buttonStyle: {
        backgroundColor: '#00e599',
        borderRadius: 50,
        padding: 8,
        marginTop: 8,
        width: Dimensions.get('window').width * 0.9,
        alignItems: 'center',
        fontSize: 24,
      },
      buttonStyleDisabled: {
        backgroundColor: '#00e59977',
        borderRadius: 50,
        padding: 8,
        marginTop: 8,
        width: Dimensions.get('window').width * 0.9,
        alignItems: 'center',
        fontSize: 24,
      },
    });
    const modalScale = 0.8;
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
        {this.state.stage === 0 && (
          <View style={[GlobalStyles.main]}>
            <KeyboardAwareScrollViewComponent>
              <View style={{paddingTop: 20}} />
              <Picker
                isRequired
                style={styles.inputText}
                buttonStyle={[styles.input]}
                itemLabelStyle={styles.inputText}
                labelStyle={[styles.inputText, {color: 'white'}]}
                selectedValueStyle={[
                  styles.inputText,
                  {width: '100%', marginLeft: '5%'},
                ]}
                items={splTokens.map((item, index) => ({
                  label: item.label,
                  value: item.value,
                }))}
                label=" SPL Token"
                selectedValue={this.state.splToken.value}
                onSelection={item => {
                  this.setState({
                    splToken: item,
                  });
                }}
              />
              <Text
                style={{
                  fontSize: 24,
                  color: '#FFF',
                  fontWeight: 'bold',
                }}>
                Amount
              </Text>
              <TextInput
                style={[styles.input, {color: '#000'}]}
                keyboardType="number-pad"
                value={this.state.amount}
                onChangeText={value => this.setState({amount: value})}
              />
              <FormItem
                style={styles.input}
                textInputStyle={styles.inputText}
                labelStyle={[styles.inputText, {color: 'white'}]}
                label="Label"
                value={this.state.label}
                onChangeText={value => this.setState({label: value})}
              />
              <FormItem
                style={styles.input}
                textInputStyle={styles.inputText}
                labelStyle={[styles.inputText, {color: 'white'}]}
                label="Message"
                value={this.state.message}
                onChangeText={value => this.setState({message: value})}
              />
              <FormItem
                style={styles.input}
                textInputStyle={styles.inputText}
                labelStyle={[styles.inputText, {color: 'white'}]}
                label="Memo"
                value={this.state.memo}
                onChangeText={value => this.setState({memo: value})}
              />
              <Text
                style={{
                  fontSize: 24,
                  color: '#FFF',
                  fontWeight: 'bold',
                }}>
                Coupon NFT
              </Text>
              <View
                style={{
                  width: Dimensions.get('screen').width * 0.9,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      fontSize: 12,
                      width: Dimensions.get('screen').width * 0.78,
                    },
                  ]}
                  keyboardType="default"
                  value={this.state.addressNFT}
                  onChangeText={value => this.setState({addressNFT: value})}
                />
                <Pressable
                  onPress={async () => {
                    await this.resetCam();
                    this.setState({
                      modal: true,
                    });
                  }}
                  style={{width: '10%'}}>
                  <IconIonIcons name="qr-code" size={30} color={'white'} />
                </Pressable>
              </View>
              <View style={{paddingTop: 20}} />
              <Pressable
                disable={this.state.loading}
                style={
                  this.state.loading
                    ? styles.buttonStyleDisabled
                    : styles.buttonStyle
                }
                onPress={async () => {
                  await this.setStateAsyncDelay(
                    {
                      loading: true,
                    },
                    100,
                  );
                  this.createTransaction();
                }}>
                <Text
                  style={{color: 'white', fontSize: 24, fontWeight: 'bold'}}>
                  {this.state.loading ? 'Creating...' : 'Create Payment'}
                </Text>
              </Pressable>
              <Pressable
                disable={this.state.loading}
                style={
                  this.state.loading
                    ? styles.buttonStyleDisabled
                    : styles.buttonStyle
                }
                onPress={() => {
                  this.props.navigation.navigate('Main');
                }}>
                <Text
                  style={{color: 'white', fontSize: 24, fontWeight: 'bold'}}>
                  Cancel
                </Text>
              </Pressable>
              <View style={{paddingBottom: 20}} />
            </KeyboardAwareScrollViewComponent>
          </View>
        )}
        {this.state.stage === 1 && (
          <SafeAreaView style={GlobalStyles.main}>
            <View
              style={{
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'space-evenly',
                alignItems: 'center',
              }}>
              <View>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: 'bold',
                    color: 'white',
                    textAlign: 'center',
                    marginVertical: 10,
                  }}>
                  {this.state.splToken.label === 'SOL'
                    ? 'Receive Solana (SOL)'
                    : 'Receive ' + this.state.splToken.label + ' Token'}
                </Text>
              </View>
              <QRCodeStyled
                data={this.state.qr}
                style={[
                  {
                    backgroundColor: 'white',
                    borderRadius: 10,
                  },
                ]}
                padding={16}
                pieceSize={this.state.splToken.label === 'SOL' ? 5.5 : 5}
                pieceBorderRadius={4}
                isPiecesGlued
                color={'black'}
              />
              <Text
                style={{
                  textShadowRadius: 1,
                  fontSize: 24,
                  fontWeight: 'bold',
                  color:
                    this.state.paymentStatus === 'Pending...'
                      ? '#d820f9'
                      : '#00e599',
                  paddingVertical: 5,
                }}>
                {this.state.paymentStatus}
              </Text>
              <Pressable
                style={styles.buttonStyle}
                onPress={() => {
                  this.props.navigation.navigate('Main');
                }}>
                <Text
                  style={{color: 'white', fontSize: 24, fontWeight: 'bold'}}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        )}
        {this.state.stage === 2 && (
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
                  color:
                    this.state.paymentStatus === 'Pending...'
                      ? '#d820f9'
                      : '#00e599',
                  paddingTop: 10,
                }}>
                {this.state.paymentStatus}
              </Text>
              <Pressable
                onPress={() =>
                  Linking.openURL(
                    `https://solana.fm/tx/${this.state.signature}?cluster=mainnet-solanafmbeta`,
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
                                          this.state.amount.toString() +
                                          ' ' +
                                          this.state.splToken.label
                                        }</h1>
                                        ${
                                          this.state.label
                                            ? `<h1 style="font-size: 3rem;">Label: ${this.state.label}</h1>`
                                            : ``
                                        }
                                        ${
                                          this.state.message
                                            ? `<h1 style="font-size: 3rem;">Message: ${this.state.message}</h1>`
                                            : ``
                                        }
                                        ${
                                          this.state.memo
                                            ? `<h1 style="font-size: 3rem;">Memo: ${this.state.memo}</h1>`
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
                <Text
                  style={{color: 'white', fontSize: 24, fontWeight: 'bold'}}>
                  Print Receipt
                </Text>
              </Pressable>
              <Pressable
                style={styles.buttonStyle}
                onPress={() => this.props.navigation.navigate('Main')}>
                <Text
                  style={{color: 'white', fontSize: 24, fontWeight: 'bold'}}>
                  Done
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        )}
        <Modal
          visible={this.state.modal}
          transparent={true}
          animationType="slide">
          <View
            style={{
              alignSelf: 'center',
              backgroundColor: '#1E2423',
              width: Dimensions.get('window').width * 0.94,
              height: Dimensions.get('window').height,
              marginTop: Dimensions.get('window').height * (0.94 - modalScale),
              borderWidth: 2,
              borderColor: `#00e599`,
              justifyContent: 'space-around',
              alignItems: 'center',
            }}>
            <View style={{height: '100%', width: '100%'}}>
              <Cam
                callback={e => {
                  const result = JSON.parse(e);
                  console.log(result);
                  this.setState({
                    addressNFT: result.nftAddress,
                    address: result.address,
                    modal: false,
                  });
                }}
                reset={this.state.reset}
              />
            </View>
          </View>
        </Modal>
        <View style={{position: 'absolute', bottom: -500}}>
          <QRCode
            value={'https://solscan.io/tx/' + this.state.signature}
            size={Dimensions.get('window').width * 0.7}
            ecl="L"
            getRef={c => (this.svg = c)}
          />
        </View>
      </>
    );
  }
}

export default SolanaPay;
