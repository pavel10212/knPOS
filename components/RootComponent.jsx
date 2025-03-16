import React from "react";
import NotificationsPanel from "./NotificationsPanel";
import NotificationToast from "./NotificationToast";
import { TouchableWithoutFeedback, View, StyleSheet } from "react-native";
import { useNotificationStore } from "../hooks/useNotificationStore";

export default function RootComponent({ children }) {
  const { isVisible, hideNotificationPanel } = useNotificationStore();
  
  const handleOutsideClick = (e) => {
    if (isVisible && e.target === e.currentTarget) {
      hideNotificationPanel();
    }
  };

  return (
    <View style={{ flex: 1 }} pointerEvents="box-none">
      {children}
      {isVisible && (
        <TouchableWithoutFeedback onPress={handleOutsideClick}>
          <View style={[
            styles.overlay,
            { pointerEvents: 'auto' }
          ]} />
        </TouchableWithoutFeedback>
      )}
      <NotificationsPanel />
      <NotificationToast />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 49,
  },
});