import React from "react";
import { StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
const KeyboardAwareScrollViewComponent = (props) => {
  return (
    <KeyboardAwareScrollView contentContainerStyle={props.contentContainerStyle} showsVerticalScrollIndicator={false}>
      {props.children}
    </KeyboardAwareScrollView>
  );
};
export default KeyboardAwareScrollViewComponent;
