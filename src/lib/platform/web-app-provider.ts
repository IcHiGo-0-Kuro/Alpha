import type { AppProvider, PlatformApp } from "@/lib/platform/app-provider";

export class WebAppProvider implements AppProvider {
  readonly kind = "web" as const;
  readonly canDiscoverInstalledApps = false;

  async listInstalledApps(): Promise<PlatformApp[]> {
    return [];
  }

  isAppRestrictionSupported(): boolean {
    return false;
  }

  async setRestriction(): Promise<void> {
    throw new Error("Web browsers cannot restrict other installed applications. Use the native Android provider for OS-level enforcement.");
  }
}

export const webAppProvider = new WebAppProvider();
