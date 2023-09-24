import React, {Component} from 'react';
import { Text, View, Pressable, Image} from 'react-native';
import Renders from '../../assets/logo.png';
import ContextModule from '../../utils/contextModule';
import GlobalStyles from '../../styles/styles';
import QRCodeStyled from 'react-native-qrcode-styled';

class DepositFiat extends Component {
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
        <View style={[GlobalStyles.main, {justifyContent: 'space-around'}]}>
          <View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
              }}>
              Receive USD
            </Text>
          </View>
          <QRCodeStyled
            data={this.context.value.fiatWallet}
            style={[
              {
                backgroundColor: 'white',
                borderRadius: 10,
              },
            ]}
            errorCorrectionLevel="H"
            padding={16}
            pieceSize={9}
            pieceBorderRadius={4}
            isPiecesGlued
            color={'black'}
            preserveAspectRatio="xMaxYMax"
          />
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
            }}>
            Pay with QR
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

export default DepositFiat;
