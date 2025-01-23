
import Toast from "react-native-toast-message";

export default function RootComponent({ children }) {
  return (
    <>
      {children}
      <Toast />
    </>
  );
}