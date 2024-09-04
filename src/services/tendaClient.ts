// deno-lint-ignore-file no-explicit-any
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
  private cookie: string | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(host: string, password: string) {
    this.host = host;
    this.password = new Md5().update(password).toString();
    this.headers = new Headers({
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    });
  }

  private async request(
    url: string,
    options?: RequestInit
  ): Promise<{ data: any; response: Response }> {
    if (!this.cookie) {
      logger.warn("No cookie found, initiating login");
      await this.auth();

      if (!this.cookie) {
        throw new Error("Failed to authenticate and retrieve cookie");
      }
    }

    const performRequest = async (): Promise<{
      data: any;
      response: Response;
    }> => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          ...(this.cookie ? { Cookie: this.cookie } : {}),
        },
      });

      if (!response.ok) {
        logger.error(`Error: ${response.status} ${response.statusText}`);
        throw new Error(`Request failed with status ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (_e) {
        logger.warn(
          "Failed to parse JSON response, likely logged out. Retrying login..."
        );
        await this.auth();

        return await performRequest();
      }

      return { data, response };
    };

    return await performRequest();
  }

  private async auth(): Promise<boolean> {
    try {
      if (this.retryCount >= this.maxRetries) {
        throw new Error(`Maximum login attempts reached (${this.maxRetries})`);
      }
      const data = `username=admin&password=${this.password}`;
      const response = await fetch(`http://${this.host}/login/Auth`, {
        method: "POST",
        body: data,
        redirect: "manual",
        headers: {
          ...this.headers,
          ...(this.cookie ? { Cookie: this.cookie } : {}),
        },
      });

      const setCookie = response.headers.get("Set-Cookie");

      if (setCookie) {
        this.cookie = setCookie;
        logger.info("Login is successful!");

        this.retryCount = 0; // reset count
        return true;
      } else {
        this.retryCount++;
        logger.info(`Retrying login (${this.retryCount}/${this.maxRetries})`);

        return await this.auth();
      }
    } catch (error) {
      logger.error(`Error in auth(): ${error}`);
      return false;
    }
  }

  async getGuestWiFiStatusClient(): Promise<IGuestWifiStatus | null> {
    try {
      const { data } = await this.request(
        `http://${this.host}/goform/WifiGuestGet`,
        {
          method: "GET",
          headers: new Headers({
            Accept: "application/json, text/javascript, */*; q=0.01",
            "X-Requested-With": "XMLHttpRequest",
          }),
        }
      );

      const guestWifiEnabled = data.guestEn === "1";
      const guestWifi5gEnabled = data.guestEn_5g === "1";

      logger.info(
        `Guest WiFi 2.4G is ${guestWifiEnabled ? "enabled" : "disabled"}`
      );
      logger.info(
        `Guest WiFi 5G is ${guestWifi5gEnabled ? "enabled" : "disabled"}`
      );

      return { guestWifiEnabled, guestWifi5gEnabled };
    } catch (error) {
      logger.error("Error [getGuestWiFiStatusClient]: ", error);
      return null;
    }
  }

  async toggleGuestWiFiClient(
    enable: boolean
  ): Promise<{ wifiStatus: boolean } | null> {
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
        effectiveTime: "8",
        shareSpeed: "6400",
      }).toString();

      const { response } = await this.request(
        `http://${this.host}/goform/WifiGuestSet`,
        {
          method: "POST",
          headers: this.headers,
          body: data,
        }
      );

      if (response.ok) {
        logger.info(`[toggleGuestWiFiClient]: Guest wifi: ${enable}`);
        return { wifiStatus: enable };
      } else {
        return null;
      }
    } catch (error) {
      logger.error("Error [toggleGuestWiFiClient]: ", error);
      throw new Error("[toggleGuestWiFiClient]", error);
    }
  }

  async getGuestWiFiUsersClient(): Promise<IUser[] | null> {
    try {
      const { data } = await this.request(
        `http://${this.host}/goform/getOnlineList`,
        { method: "GET" }
      );

      const guestUsers = data.filter(
        (user: IUser) => user.isGuestClient === "true"
      );

      logger.info(`[getGuestWiFiUsersClient]: Guest users - ${guestUsers}`);

      return guestUsers;
    } catch (error) {
      logger.error("Error [getGuestWiFiUsersClient]: ", error);
      return null;
    }
  }
}

export default TendaClient;
