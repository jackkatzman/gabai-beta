// Simple mobile fallback to override API calls with local data
import { isNativeApp } from "@/utils/capacitor";

export function withMobileFallback<T>(
  webQuery: () => T,
  mobileData: T | undefined,
  mobileLoading: boolean
): T | { data: undefined; isLoading: boolean } {
  if (isNativeApp()) {
    return {
      data: mobileData,
      isLoading: mobileLoading
    } as T;
  }
  return webQuery();
}