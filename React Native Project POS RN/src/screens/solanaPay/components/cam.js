import React, {Component} from 'react';
import reactAutobind from 'react-autobind';
import {Camera} from 'react-native-camera-kit';

class Cam extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scanning: true,
    };
    this.check = true;
    reactAutobind(this);
  }

  componentDidUpdate(prevState, prevProps) {
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
      <Camera
        style={{height: '100%', width: '100%'}}
        scanBarcode={this.state.scanning}
        onReadCode={event => {
          if (this.check) {
            this.check = false;
            this.setState({
              scanning:false
            })
            this.props.callback(event.nativeEvent.codeStringValue);
          } else {
            this.check = true;
          }
        }}
        showFrame={false}
      />
    );
  }
}

export default Cam;
