import { Capacitor } from '@capacitor/core';

// Detect if we're running as a native mobile app
export function isNativeMobileApp(): boolean {
  return Capacitor.isNativePlatform();
}

// Detect if we're running on Android
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

// Detect if we're running on iOS
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

// Get the current platform
export function getPlatform(): string {
  return Capacitor.getPlatform();
}

// Check if we have native capabilities
export function hasNativeCapabilities(): boolean {
  return Capacitor.isNativePlatform();
}