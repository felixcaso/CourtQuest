/**
 * Subscription Service — RevenueCat Integration Placeholder
 *
 * This service provides the structure for integrating RevenueCat
 * for in-app subscriptions. Actual RevenueCat SDK initialization
 * requires:
 * 1. A RevenueCat account and project
 * 2. App Store / Play Store in-app purchase products configured
 * 3. The react-native-purchases package installed
 *
 * When ready, install: npm install react-native-purchases
 * Then uncomment and configure the code below.
 */

// import Purchases from 'react-native-purchases';

const REVENUECAT_API_KEY_IOS = 'YOUR_REVENUECAT_IOS_API_KEY';
const REVENUECAT_API_KEY_ANDROID = 'YOUR_REVENUECAT_ANDROID_API_KEY';

const ENTITLEMENTS = {
  PRO: 'pro',
};

const PRODUCTS = {
  MONTHLY: 'courtquest_pro_monthly',
  ANNUAL: 'courtquest_pro_annual',
};

/**
 * Initialize RevenueCat. Call this once during app startup.
 */
export async function initializeSubscriptions(uid) {
  // Placeholder — uncomment when RevenueCat is configured:
  //
  // import { Platform } from 'react-native';
  // const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  // await Purchases.configure({ apiKey, appUserID: uid });
  //
  console.log('[SubscriptionService] Placeholder — RevenueCat not configured yet');
}

/**
 * Check if the user has an active Pro subscription.
 * @returns {boolean}
 */
export async function isProUser() {
  // Placeholder:
  // try {
  //   const customerInfo = await Purchases.getCustomerInfo();
  //   return customerInfo.entitlements.active[ENTITLEMENTS.PRO] !== undefined;
  // } catch (e) {
  //   return false;
  // }
  return false;
}

/**
 * Get available subscription packages.
 */
export async function getPackages() {
  // Placeholder:
  // try {
  //   const offerings = await Purchases.getOfferings();
  //   if (offerings.current) {
  //     return offerings.current.availablePackages;
  //   }
  //   return [];
  // } catch (e) {
  //   return [];
  // }
  return [
    { id: PRODUCTS.MONTHLY, price: '$4.99/mo', title: 'Monthly Pro' },
    { id: PRODUCTS.ANNUAL, price: '$39.99/yr', title: 'Annual Pro (Save 33%)' },
  ];
}

/**
 * Purchase a subscription package.
 */
export async function purchasePackage(packageId) {
  // Placeholder:
  // try {
  //   const { customerInfo } = await Purchases.purchasePackage(pkg);
  //   return customerInfo.entitlements.active[ENTITLEMENTS.PRO] !== undefined;
  // } catch (e) {
  //   if (!e.userCancelled) throw e;
  //   return false;
  // }
  console.log('[SubscriptionService] Purchase not available — RevenueCat not configured');
  return false;
}

/**
 * Restore previous purchases.
 */
export async function restorePurchases() {
  // Placeholder:
  // try {
  //   const customerInfo = await Purchases.restorePurchases();
  //   return customerInfo.entitlements.active[ENTITLEMENTS.PRO] !== undefined;
  // } catch (e) {
  //   return false;
  // }
  return false;
}
