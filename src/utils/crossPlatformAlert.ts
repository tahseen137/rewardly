/**
 * Cross-platform alert utilities that work on web, iOS, and Android.
 * 
 * On web, Alert.alert() callbacks don't fire and Alert.prompt() doesn't exist.
 * These utilities use window.alert/confirm on web, Alert on native.
 */
import { Alert, Platform } from 'react-native';

/**
 * Show a simple informational alert (no callback needed)
 */
export function showAlert(title: string, message: string): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message, [{ text: 'OK' }]);
  }
}

/**
 * Show a confirmation dialog. Returns true if confirmed.
 */
export function showConfirm(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      resolve(window.confirm(`${title}\n\n${message}`));
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'OK', onPress: () => resolve(true) },
      ]);
    }
  });
}

/**
 * Show an error alert
 */
export function showError(message: string): void {
  showAlert('Error', message);
}

/**
 * Show a success alert
 */
export function showSuccess(title: string, message: string): void {
  showAlert(title, message);
}
