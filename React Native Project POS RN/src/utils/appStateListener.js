import React, { Component } from 'react'
import reactAutobind from 'react-autobind';
import { AppState } from 'react-native'

class AppStateListener extends Component {
    constructor(props) {
        super(props);
        this.listener = AppState.addEventListener('change', this._handleAppStateChange);
        reactAutobind(this)
    }

    componentWillUnmount() {
        this.listener.remove()
    }

    _handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'background') {
            //this.props.navigation.navigate('Login')  // DELETE COMMENT
        }
    }

    render() {
        return (
            <>
            </>
        );
    }

}

export default AppStateListener