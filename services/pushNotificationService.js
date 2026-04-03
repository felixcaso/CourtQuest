import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * Push Notification Service — Client-side setup for Expo.
 *
 * This sets up push notification permissions and stores the token.
 * Actual push sending requires Cloud Functions (server-side).
 */

/**
 * Request push notification permissions and store the token.
 * Call this after the user logs in.
 */
export async function setupPushNotifications(uid) {
  if (!uid) return null;

  try {
    // Dynamic import to avoid crash if expo-notifications is not installed
    const Notifications = require('expo-notifications');
    const { Platform } = require('react-native');
    const Device = require('expo-device');

    // Must be a physical device
    if (!Device.isDevice) {
      console.log('[PushNotifications] Must use physical device for push notifications');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PushNotifications] Permission not granted');
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // Set your Expo project ID here in production
    });
    const pushToken = tokenData.data;

    // Store token in Firestore
    await updateDoc(doc(db, 'users', uid), {
      pushToken,
      pushTokenUpdatedAt: new Date(),
    });

    // Configure notification handling for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'CourtQuest',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F5961D',
      });
    }

    console.log('[PushNotifications] Token stored:', pushToken);
    return pushToken;
  } catch (e) {
    // expo-notifications may not be installed yet — fail silently
    console.log('[PushNotifications] Setup skipped:', e.message || e);
    return null;
  }
}

/**
 * Handle foreground notification display.
 * Call this in App.js useEffect to set the notification handler.
 */
export function configureForegroundHandler() {
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    // expo-notifications not installed
  }
}
