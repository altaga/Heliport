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
    this.check = true
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

  componentDidUpdate(prevProps) {
    if (
      this.props.reset === true &&
      this.props.reset !== prevProps.reset &&
      this.state.scanning === false
    ) {
      this.setState({
        scanning: true,
      });
      this.check = true;
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
              if (this.check) {
                this.check = false;
                let temp = event.nativeEvent.codeStringValue;
                console.log(temp)
                if (temp.length === 44 || temp.indexOf("solana:") > -1) {
                  this.setState(
                    {
                      scanning: false,
                    },
                    () => {
                      if (temp.length === 44) this.props.callbackAddress(temp);
                      else if (temp.indexOf("solana:") > -1) {
                        this.props.callbackAddress(temp.substring(7));
                      } else {
                        this.setState({
                          scanning: false,
                        });
                        this.check = true;
                      }
                    }
                  );
                } else {
                  this.check = true;
                }
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
