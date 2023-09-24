import React, {Component} from 'react';
// Modules
import {
  StatusBar,
  SafeAreaView,
  Text,
  Image,
  Pressable,
  View,
  Dimensions,
  ImageBackground,
} from 'react-native';
// Utils
import ContextModule from '../../utils/contextModule';
// Assets
import Renders from '../../assets/logoOutline.png';
import LogoSplash from '../../assets/logoSplash.png';
import BackImage from '../../assets/log-back.jpg';
// Styles
import GlobalStyles from '../../styles/styles';
import reactAutobind from 'react-autobind';
// Sensors and Utils
import EncryptedStorage from 'react-native-encrypted-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VirtualKeyboard from 'react-native-virtual-keyboard';
// Crypto
import {Keypair} from '@solana/web3.js';

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stage: 4,
      biometric: false,
      clear: false,
      text: '',
      loading: false,
    };
    reactAutobind(this);
  }

  static contextType = ContextModule;

  async storeUserPIN() {
    try {
      await EncryptedStorage.setItem(
        'userPIN',
        JSON.stringify({
          pin: this.state.text.substring(0, 4),
        }),
      );
      this.setState({
        stage: 2,
      });
    } catch (error) {
      // There was an error on the native side
    }
  }

  async storeUserWallet(wallet) {
    try {
      await EncryptedStorage.setItem(
        'userWallet',
        JSON.stringify({
          wallet,
        }),
      );
      await this.storePublicKey(
        Keypair.fromSecretKey(
          Uint8Array.from(wallet.split(',')),
        ).publicKey,
      );
    } catch (error) {
      // There was an error on the native side
    }
  }

  async storePublicKey(publicKey) {
    try {
      await AsyncStorage.setItem('publicKey', JSON.stringify({publicKey}));
    } catch (e) {
      // saving error
    }
  }

  async componentDidMount() {
    this.props.navigation.addListener('focus', async () => {
      //console.log('Focus');
      await this.resetKeyboard();
      this.setState({
        stage: 4,
        biometric: false,
        clear: false,
        text: '',
        loading: false,
      });
      let flag1 = false;
      let flag2 = false;
      let flag3 = false;
      try {
        const session = await AsyncStorage.getItem('publicKey');
        if (session !== null) {
          console.log('PubKey Check');
          this.context.setValue({
            publicKey: JSON.parse(session).publicKey,
          });
          flag1 = true;
        } else {
          flag1 = false;
        }
      } catch (error) {
        console.log('There was an error on the native side');
      }
      try {
        const session = await EncryptedStorage.getItem('userPIN');
        if (session !== undefined) {
          flag2 = true;
          console.log('Pin Check');
        } else {
          console.log('No Pin');
          flag2 = false;
        }
      } catch (error) {
        console.log('There was an error on the native side');
      }
      try {
        const session = await EncryptedStorage.getItem('userWallet');
        if (session !== undefined) {
          console.log('Wallet Check');
          flag3 = true;
        } else {
          flag3 = false;
          console.log('No Wallet');
        }
      } catch (error) {
        // There was an error on the native side
      }
      if (flag1 && flag2 && flag3) {
        this.setState({
          stage: 2, // 2
        });
      } else {
        this.setState({
          stage: 0,
        });
      }
    });
    this.props.navigation.addListener('blur', () => {
      //console.log('Blur');
    });
    //await this.erase()
  }

  componentWillUnmount() {}

  changeText = val => {
    if (val.length <= 4) {
      this.setState({
        text: val,
      });
    }
  };

  changeTextCheck = async val => {
    if (val.length === 4) {
      try {
        const session = await EncryptedStorage.getItem('userPIN');
        if (session !== undefined) {
          await this.resetKeyboard();
          if (JSON.parse(session).pin === val) {
            this.props.navigation.navigate('Main');
          }
        }
      } catch (error) {
        console.log('There was an error on the native side');
      }
    } else if (val.length < 4) {
      this.setState({
        text: val,
      });
    } else {
      await this.resetKeyboard();
    }
  };

  resetKeyboard() {
    return new Promise((resolve, reject) => {
      this.setState(
        {
          clear: true,
        },
        () =>
          this.setState(
            {
              clear: false,
              text: '',
            },
            () => resolve('ok'),
          ),
      );
    });
  }

  async erase() {
    try {
      await EncryptedStorage.clear();
      // Congrats! You've just cleared the device storage!
    } catch (error) {
      // There was an error on the native side
    }
  }

  render() {
    return (
      <SafeAreaView
        style={[
          {
            backgroundColor: '#1E2423',
          },
        ]}>
        {this.state.stage < 2 && (
          <ImageBackground
            style={{
              width: Dimensions.get('window').width,
              height: Dimensions.get('window').height,
            }}
            source={BackImage}
            resizeMode="cover">
            {this.state.stage === 0 && (
              <View style={GlobalStyles.loginContainer}>
                <Image
                  source={Renders}
                  alt="Cat"
                  style={{
                    width: Dimensions.get('window').width * 0.5,
                    height: Dimensions.get('window').width * 0.5,
                  }}
                />
                <Text
                  style={{
                    fontSize: 36,
                    textAlign: 'center',
                    color: 'white',
                    paddingLeft: 10,
                    paddingRight: 10,
                    marginTop: Dimensions.get('window').height * 0.05,
                    marginBottom: Dimensions.get('window').height * 0.1,
                    fontFamily: 'DMSans-Medium',
                    textShadowColor: 'black',
                    textShadowRadius: 2,
                    textShadowOffset: {
                      width: 2,
                      height: 2,
                    },
                  }}>
                  Effisend{'\n'}Solana POS
                </Text>
                <Pressable
                  disabled={this.state.loading}
                  style={
                    this.state.loading
                      ? GlobalStyles.buttonStyleLoginDisable
                      : GlobalStyles.buttonStyleLogin
                  }
                  onPress={() => {
                    this.setState(
                      {
                        loading: true,
                      },
                      async () => {
                        let keypair = Keypair.generate();
                        await this.storeUserWallet(
                          keypair._keypair.secretKey.toString(),
                        );
                        this.setState({stage: 1, loading: false});
                      },
                    );
                  }}>
                  <Text
                    style={{color: 'white', fontSize: 24, fontWeight: 'bold'}}>
                    Create a new wallet
                  </Text>
                </Pressable>
              </View>
            )}
            {this.state.stage === 1 && (
              <View style={GlobalStyles.loginContainer}>
                <Text
                  style={{
                    fontSize: 24,
                    textAlign: 'center',
                    color: 'white',
                    padding: 10,
                    marginBottom: Dimensions.get('window').height * 0.03,
                    width: Dimensions.get('window').width * 0.8,
                  }}>
                  Protect POS with a pincode
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      color: 'white',
                      width: Dimensions.get('window').width * 0.2,
                      textAlign: 'center',
                      fontSize: 24,
                    }}>
                    {this.state.text.substring(0, 1) !== ''
                      ? this.state.text.substring(0, 1)
                      : '•'}
                  </Text>
                  <Text
                    style={{
                      color: 'white',
                      width: Dimensions.get('window').width * 0.2,
                      textAlign: 'center',
                      fontSize: 24,
                    }}>
                    {this.state.text.substring(1, 2) !== ''
                      ? this.state.text.substring(1, 2)
                      : '•'}
                  </Text>
                  <Text
                    style={{
                      color: 'white',
                      width: Dimensions.get('window').width * 0.2,
                      textAlign: 'center',
                      fontSize: 24,
                    }}>
                    {this.state.text.substring(2, 3) !== ''
                      ? this.state.text.substring(2, 3)
                      : '•'}
                  </Text>
                  <Text
                    style={{
                      color: 'white',
                      width: Dimensions.get('window').width * 0.2,
                      textAlign: 'center',
                      fontSize: 24,
                    }}>
                    {this.state.text.substring(3, 4) !== ''
                      ? this.state.text.substring(3, 4)
                      : '•'}
                  </Text>
                </View>
                <VirtualKeyboard
                  rowStyle={{
                    width: Dimensions.get('window').width,
                  }}
                  cellStyle={{
                    height: Dimensions.get('window').width / 7,
                    borderWidth: 0,
                    margin: 1,
                  }}
                  colorBack={'black'}
                  color="white"
                  pressMode="string"
                  onPress={val => this.changeText(val)}
                />
                <Pressable
                  disabled={this.state.text.length !== 4}
                  style={[
                    this.state.text.length !== 4
                      ? GlobalStyles.buttonStyleLoginDisable
                      : GlobalStyles.buttonStyleLogin,
                    {marginTop: 30},
                  ]}
                  onPress={async () => this.storeUserPIN()}>
                  <Text
                    style={{color: 'white', fontSize: 24, fontWeight: 'bold'}}>
                    Set Pincode
                  </Text>
                </Pressable>
              </View>
            )}
          </ImageBackground>
        )}
        {this.state.stage >= 2 && (
          <View
            style={{
              width: Dimensions.get('window').width,
              height: Dimensions.get('window').height,
            }}>
            {this.state.stage === 2 && (
              <View style={GlobalStyles.loginContainer}>
                <Text
                  style={{
                    fontSize: 36,
                    textAlign: 'center',
                    color: 'white',
                    padding: 10,
                    marginBottom: Dimensions.get('window').height * 0.05,
                    width: Dimensions.get('window').width * 0.8,
                  }}>
                  Unlock POS
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      color: 'white',
                      width: Dimensions.get('window').width * 0.2,
                      textAlign: 'center',
                      fontSize: 24,
                    }}>
                    {this.state.text.substring(0, 1) !== '' ? '•' : '.'}
                  </Text>
                  <Text
                    style={{
                      color: 'white',
                      width: Dimensions.get('window').width * 0.2,
                      textAlign: 'center',
                      fontSize: 24,
                    }}>
                    {this.state.text.substring(1, 2) !== '' ? '•' : '.'}
                  </Text>
                  <Text
                    style={{
                      color: 'white',
                      width: Dimensions.get('window').width * 0.2,
                      textAlign: 'center',
                      fontSize: 24,
                    }}>
                    {this.state.text.substring(2, 3) !== '' ? '•' : '.'}
                  </Text>
                  <Text
                    style={{
                      color: 'white',
                      width: Dimensions.get('window').width * 0.2,
                      textAlign: 'center',
                      fontSize: 24,
                    }}>
                    {this.state.text.substring(3, 4) !== '' ? '•' : '.'}
                  </Text>
                </View>
                <VirtualKeyboard
                  rowStyle={{
                    width: Dimensions.get('window').width,
                    borderRadius: 5,
                    margin: 10,
                  }}
                  cellStyle={{
                    height: Dimensions.get('window').width / 7,
                    borderWidth: 0,
                    margin: 1,
                  }}
                  colorBack={'black'}
                  color="white"
                  pressMode="string"
                  onPress={val => this.changeTextCheck(val)}
                  clear={this.state.clear}
                />
              </View>
            )}
            {this.state.stage === 4 && (
              <View style={GlobalStyles.loginContainer}>
                <Image
                  source={LogoSplash}
                  alt="Cat"
                  style={{width: (372 * 2) / 3, height: (307 * 2) / 3}}
                />
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    );
  }
}

export default Login;
