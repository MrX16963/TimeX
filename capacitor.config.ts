import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mrxosa.timex",
  appName: "TimeX",
  webDir: "dist",
  server: {
    url: "https://mrx16963.github.io/TimeX/app.html",
    cleartext: false,
  },
};

export default config;
