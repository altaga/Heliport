import React, {Component} from 'react';
import {Text, View, Pressable, Image} from 'react-native';
import Renders from '../../assets/logo.png';
import QRCodeStyled from 'react-native-qrcode-styled';
import ContextModule from '../../utils/contextModule';
import GlobalStyles from '../../styles/styles';

class DepositCrypto extends Component {
  static contextType = ContextModule;
  render() {
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
        <View style={[GlobalStyles.main, {justifyContent:"space-around"}]}>
          <View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
              }}>
              Receive Solana{'\n'}or SPL Token
            </Text>
          </View>
          <QRCodeStyled
            data={this.context.value.publicKey}
            style={[
              {
                backgroundColor: 'white',
                borderRadius: 10,
              },
            ]}
            errorCorrectionLevel="H"
            padding={16}
            pieceSize={7}
            pieceBorderRadius={4}
            isPiecesGlued
            color={'black'}
            preserveAspectRatio="xMaxYMax"
          />
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
            }}>
            {this.context.value.publicKey.substring(0, 21) +
              '\n' +
              this.context.value.publicKey.substring(
                21
              )}
          </Text>
          <Pressable
            style={GlobalStyles.buttonStyle}
            onPress={() => {
              this.props.navigation.navigate('Main');
            }}>
            <Text style={{color: 'white', fontSize: 24, fontWeight: 'bold'}}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </>
    );
  }
}

export default DepositCrypto;
