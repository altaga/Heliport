import React, {Component} from 'react';
import {Text, Image, Pressable, View, Dimensions} from 'react-native';
import Renders from '../../assets/logo.png';
import ContextModule from '../../utils/contextModule';
import reactAutobind from 'react-autobind';
import GlobalStyles from '../../styles/styles';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconF from 'react-native-vector-icons/Feather';
import QR from '../../assets/qrImage.png';
import QRinv from '../../assets/qrImageinv.png';
import Crypto from './tabs/crypto';
import Fiat from './tabs/fiat';

// Tabs
//import Crypto from '../components/crypto';
//import SolanaPay from '../components/solanaPay';
//import DepositCrypto from '../components/depositCrypto';
//import Fiat from '../components/fiat';
//import DepositFiat from '../components/depositFiat';

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      qr: null,
      text: '',
      number: 0,
      method: 0, //
      selectorSytle1: {
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: 'black',
        backgroundColor: 'white',
        width: Dimensions.get('window').width * (1 / 3),
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 0.5,
      },
      selectorSytle2: {
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: 'black',
        backgroundColor: `#00e599`,
        width: Dimensions.get('window').width * (1 / 3),
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 0.5,
      },
      selectorSytle3: {
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: 'black',
        backgroundColor: `#00e599`,
        width: Dimensions.get('window').width * (1 / 3),
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 0.5,
      },
      selectorText1: {
        fontSize: 18,
        color: 'black',
        textAlign: 'center',
      },
      selectorText2: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
      },
      selectorText3: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
      },
    };
    reactAutobind(this);
  }

  static contextType = ContextModule;

  componentWillUnmount() {}

  onChangeText = event => {};

  componentDidMount() {
    this.selector(0);
  }

  selector(number) {
    switch (number) {
      case 0:
        this.setState({
          number: 0,
          selectorSytle1: {
            ...this.state.selectorSytle1,
            backgroundColor: 'white',
          },
          selectorSytle2: {
            ...this.state.selectorSytle2,
            backgroundColor: `#00e599`,
          },
          selectorSytle3: {
            ...this.state.selectorSytle3,
            backgroundColor: `#00e599`,
          },
          selectorText1: {
            ...this.state.selectorText1,
            color: 'black',
            fontWeight: 'bold',
          },
          selectorText2: {
            ...this.state.selectorText2,
            color: 'white',
            fontWeight: 'bold',
          },
          selectorText3: {
            ...this.state.selectorText3,
            color: 'white',
            fontWeight: 'bold',
          },
        });
        break;
      case 1:
        this.setState({
          number: 1,
          selectorSytle1: {
            ...this.state.selectorSytle1,
            backgroundColor: `#00e599`,
          },
          selectorSytle2: {
            ...this.state.selectorSytle2,
            backgroundColor: 'white',
          },
          selectorSytle3: {
            ...this.state.selectorSytle3,
            backgroundColor: `#00e599`,
          },
          selectorText1: {
            ...this.state.selectorText1,
            color: 'white',
            fontWeight: 'bold',
          },
          selectorText2: {
            ...this.state.selectorText2,
            color: 'black',
            fontWeight: 'bold',
          },
          selectorText3: {
            ...this.state.selectorText3,
            color: 'white',
            fontWeight: 'bold',
          },
        });
        break;
      case 2:
        this.setState({
          number: 2,
          selectorSytle1: {
            ...this.state.selectorSytle1,
            backgroundColor: `#00e599`,
          },
          selectorSytle2: {
            ...this.state.selectorSytle2,
            backgroundColor: `#00e599`,
          },
          selectorSytle3: {
            ...this.state.selectorSytle3,
            backgroundColor: 'white',
          },
          selectorText1: {
            ...this.state.selectorText1,
            color: 'white',
            fontWeight: 'bold',
          },
          selectorText2: {
            ...this.state.selectorText2,
            color: 'white',
            fontWeight: 'bold',
          },
          selectorText3: {
            ...this.state.selectorText3,
            color: 'black',
            fontWeight: 'bold',
          },
        });
        break;
      default:
        break;
    }
  }

  render() {
    return (
      <>
        <View style={GlobalStyles.container}>
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
                <Text
                  style={{color: 'white', fontSize: 20, fontWeight: 'bold'}}>
                  Lock
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={GlobalStyles.main}>
            {this.state.number === 0 && (
              <>
                {this.state.method === 0 && (
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'column',
                      justifyContent: 'space-evenly',
                      alignItems: 'center',
                    }}>
                    <Pressable
                      style={[GlobalStyles.buttonStylePay]}
                      onPress={() => {
                        this.props.navigation.navigate('SolanaPay');
                      }}>
                      <Image
                        source={QR}
                        alt="Cat"
                        style={{width: 32 * 1.3, height: 26 * 1.3}}
                      />
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 24,
                          fontWeight: 'bold',
                          paddingTop: 2,
                        }}>
                        Solana Pay
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[GlobalStyles.buttonStylePay]}
                      onPress={() => {
                        this.props.navigation.navigate('CryptoPay');
                      }}>
                      <IconF name="download" size={38} color="#000" />
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 24,
                          fontWeight: 'bold',
                        }}>
                        Crypto Payments
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[GlobalStyles.buttonStylePay]}
                      onPress={() => {
                        this.props.navigation.navigate('FiatPay');
                      }}>
                      <IconF name="download" size={38} color="#000" />
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 24,
                          fontWeight: 'bold',
                        }}>
                        Regular Payments
                      </Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}
            {this.state.number === 1 && (
              <Crypto navigation={this.props.navigation} />
            )}
            {this.state.number === 2 && <Fiat />}
          </View>
          <View style={GlobalStyles.footer}>
            <Pressable
              style={[this.state.selectorSytle1, {alignItems: 'center'}]}
              onPress={() => {
                this.selector(0),
                  this.setState({
                    method: 0,
                  });
              }}>
              <Icon
                name="payments"
                size={24}
                color={this.state.number === 0 ? 'black' : 'white'}
              />
              <Text style={this.state.selectorText1}>Payments</Text>
            </Pressable>
            <Pressable
              style={[this.state.selectorSytle2, {alignItems: 'center'}]}
              onPress={() => {
                this.selector(1),
                  this.setState({
                    method: 0,
                  });
              }}>
              <Image
                source={this.state.number === 1 ? QR : QRinv}
                alt="Cat"
                style={{width: 32 * 0.8, height: 26 * 0.8}}
              />
              <Text style={this.state.selectorText2}>Crypto</Text>
            </Pressable>
            <Pressable
              style={[this.state.selectorSytle3, {alignItems: 'center'}]}
              onPress={() => {
                this.selector(2),
                  this.setState({
                    method: 0,
                  });
              }}>
              <Icon
                name="account-balance-wallet"
                size={24}
                color={this.state.number === 2 ? 'black' : 'white'}
              />
              <Text style={this.state.selectorText3}>Fiat</Text>
            </Pressable>
          </View>
        </View>
      </>
    );
  }
}

export default Main;
