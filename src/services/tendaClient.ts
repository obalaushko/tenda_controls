import logger from "../utils/logger.ts";
import { Md5 } from "https://deno.land/std@0.122.0/hash/md5.ts";

interface IUser {
  deviceId: string;
  ip: string;
  devName: string;
  line: string;
  uploadSpeed: string;
  downloadSpeed: string;
  linkType: string;
  black: number;
  isGuestClient: string;
}
interface IGuestWifiStatus {
  guestWifiEnabled: boolean;
  guestWifi5gEnabled: boolean;
}

class TendaClient {
  private readonly host: string;
  private readonly password: string;
  private readonly headers: Headers;
  private isLoggined: boolean;
  private cookie: string | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(host: string, password: string) {
    this.isLoggined = false;
    this.host = host;
    this.password = new Md5().update(password).toString();
    this.headers = new Headers({
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    });
  }

  private async request(url: string, options?: RequestInit): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        ...(this.cookie ? { Cookie: this.cookie } : {}),
      },
    });

    if (!response.ok && response.status !== 302) {
      logger.error(`Error: ${response.status} ${response.statusText}`);
      throw new Error(`Request failed with status ${response.status}`);
    }

    // Save cookie
    const setCookie = response.headers.get("Set-Cookie");
    if (setCookie) {
      this.cookie = setCookie;
    }

    return response;
  }

  private async auth() {
    try {
      if (this.retryCount >= this.maxRetries) {
        throw new Error(`Maximum login attempts reached (${this.maxRetries})`);
      }

      const data = `username=admin&password=${this.password}`;
      const requestToLogin = await this.request(
        `http://${this.host}/login/Auth`,
        {
          method: "POST",
          headers: this.headers,
          body: data,
          redirect: "manual",
        }
      );

      if (requestToLogin.status === 302) {
        const redirectUrl = requestToLogin.headers.get("Location") ?? "";

        if (redirectUrl.includes("main.html")) {
          logger.info("Authorization successful, redirected to main page");

          const redirectRequest = await this.request(redirectUrl);
          //   logger.info("Redirect response", redirectRequest);

          // Check if redirect to main page
          if (redirectRequest.url.includes("main.html")) {
            this.isLoggined = true;
            logger.info("Logged in successfully");

            this.retryCount = 0; // reset count if success
          } else {
            logger.warn(
              "Redirection did not lead to main page, login might have failed"
            );
          }
        } else if (redirectUrl.includes("login.html")) {
          this.retryCount++;
          logger.info(`Retrying login (${this.retryCount}/${this.maxRetries})`);

          await this.auth(); // Recursively called if authorization failed
        }
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error) {
      logger.error(`Error in auth(): ${error}`);
    }
  }

  async toggleGuestWiFi(enable: boolean): Promise<boolean> {
    await this.auth();
    try {
      const data = new URLSearchParams({
        guestEn: enable ? "1" : "0",
        guestEn_5g: enable ? "1" : "0",
        guestSecurity: "wpapsk",
        guestSecurity_5g: "wpapsk",
        guestSsid: "Free WiFi 2.4G",
        guestSsid_5g: "Free WiFi 5G",
        guestWrlPwd: "",
        guestWrlPwd_5g: "",
        effectiveTime: "0",
        shareSpeed: "6400",
      }).toString();

      const response = await this.request(
        `http://${this.host}/goform/WifiGuestSet`,
        {
          method: "POST",
          headers: this.headers,
          body: data,
        }
      );
      if (response.ok) {
        return true;
      }
    } catch (error) {
      logger.error("Error [toggleGuestWiFi]: ", error);
      return false;
    }
    return false;
  }

  async getGuestWiFiStatus(): Promise<IGuestWifiStatus | null> {
    await this.auth();

    try {
      const response = await this.request(
        `http://${this.host}/goform/WifiGuestGet`,
        {
          method: "GET",
          headers: new Headers({
            Accept: "application/json, text/javascript, */*; q=0.01",
            "X-Requested-With": "XMLHttpRequest",
          }),
        }
      );

      if (response.ok) {
        const status = await response.json();
        const guestWifiEnabled = status.guestEn === "1";
        const guestWifi5gEnabled = status.guestEn_5g === "1";

        logger.info(
          `Guest WiFi 2.4G is ${guestWifiEnabled ? "enabled" : "disabled"}`
        );
        logger.info(
          `Guest WiFi 5G is ${guestWifi5gEnabled ? "enabled" : "disabled"}`
        );

        return { guestWifiEnabled, guestWifi5gEnabled };
      } else {
        const text = await response.text();
        logger.info(`Response is not JSON: ${text}`);

        return null;
      }
    } catch (error) {
      logger.error("Error [getGuestWiFiStatus]: ", error);
      return null;
    }
  }

  async getGuestWiFiUsers(): Promise<IUser[] | null> {
    await this.auth();
    try {
      const response = await this.request(
        `http://${this.host}/goform/getOnlineList`,
        { method: "GET" }
      );

      try {
        const users = await response.json();
        const guestUsers = users.filter(
          (user: IUser) => user.isGuestClient === "true"
        );

        return guestUsers;
      } catch (error) {
        const text = await response.text();

        logger.warn(`Response is not JSON: ${text}`);
        logger.error(error);
        return null;
      }
    } catch (error) {
      logger.error("Error [getGuestWiFiUsers]: ", error);
      return null;
    }
  }

  async getWiFiUsers() {
    await this.auth();
    try {
      const response = await this.request(
        `http://${this.host}/goform/getOnlineList`,
        { method: "GET" }
      );

      try {
        const users = await response.json();

        return users;
      } catch (error) {
        const text = await response.text();

        logger.warn(`Response is not JSON: ${text}`);
        logger.error(error);
        return null;
      }
    } catch (error) {
      logger.error("Error [getWiFiUsers]: ", error);
    }
  }
}

export default TendaClient;
