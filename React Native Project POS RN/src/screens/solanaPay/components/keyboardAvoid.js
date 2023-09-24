import React from 'react';
import {
  View,
  KeyboardAvoidingView,
  TextInput,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  Button,
  Keyboard,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
const KeyboardAwareScrollViewComponent = props => {
  return (
    <View style={styles.inner}>
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>{props.children}</View>
      </KeyboardAwareScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  inner: {
    flex: 1
  },
});
export default KeyboardAwareScrollViewComponent;
