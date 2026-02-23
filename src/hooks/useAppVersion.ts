import { APP_VERSION } from "@/config/version";

export function useAppVersion() {
  return { version: APP_VERSION };
}
