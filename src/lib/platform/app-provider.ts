export type PlatformApp = {
  id: string;
  name: string;
  packageName: string;
};

export interface AppProvider {
  readonly kind: "web" | "android" | "ios";
  readonly canDiscoverInstalledApps: boolean;
  listInstalledApps(): Promise<PlatformApp[]>;
  isAppRestrictionSupported(): boolean;
  setRestriction(appPackageNames: string[], restricted: boolean): Promise<void>;
}
