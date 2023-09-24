import React, { Component } from "react";
import reactAutobind from "react-autobind";
import { Alert } from "react-native";
import { PermissionsAndroid } from "react-native";
import { Platform } from "react-native";
import { Camera } from "react-native-camera-kit";

class Cam extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scanning: true,
      permission: false,
    };
    reactAutobind(this);
  }

  async componentDidMount() {
    if (Platform.OS === "android") {
      const checkCam = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      if (!checkCam) {
        PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]).then((result) => {
          if (result["android.permission.CAMERA"] === "granted") {
            this.setState({
              permission: true,
            });
          } else {
            Alert.alert(
              "Permissions denied!",
              "You need to give permissions to camera"
            );
          }
        });
      } else {
        this.setState({
          permission: true,
        });
      }
    }
  }

  render() {
    return (
      <React.Fragment>
        {this.state.permission && (
          <Camera
            style={{ height: "100%", width: "100%" }}
            scanBarcode={this.state.scanning}
            onReadCode={(event) => {
              let temp = event.nativeEvent.codeStringValue;
              if (temp.length === 44 || temp.indexOf("solana:") > -1) {
                this.setState(
                  {
                    scanning: false,
                  },
                  () => {
                    if (temp.length === 44) this.props.callbackAddress(temp);
                    if (temp.indexOf("solana:") > -1) {
                      this.props.callbackAddress(temp.substring(7));
                    }
                  }
                );
              } else if (temp.length === 42 || temp.indexOf("ethereum:") > -1) {
                this.setState(
                  {
                    scanning: false,
                  },
                  () => {
                    if (temp.length === 42) this.props.callbackAddressETH(temp);
                    if (temp.indexOf("ethereum:") > -1) {
                      if (temp.indexOf("@") > -1) {
                        this.props.callbackAddressETH(
                          temp.substring(9, temp.indexOf("@"))
                        );
                      } else {
                        this.props.callbackAddressETH(temp.substring(9));
                      }
                    }
                  }
                );
              }
            }}
            showFrame={false}
          />
        )}
      </React.Fragment>
    );
  }
}

export default Cam;
