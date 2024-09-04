import {
  ResponseBody,
  errorResponse,
  successResponse,
} from "../types/response.ts";
import { toggleGuestWiFiRequest } from "../types/request.ts";
import { ENV_VARIABLES } from "../constants/constants.ts";
import logger from "../utils/logger.ts";
import TendaClient from "./tendaClient.ts";
import { Request, Response } from "npm:express@4.19.2";

class TendaServices {
  private client;
  constructor() {
    if (!ENV_VARIABLES.HOST && !ENV_VARIABLES.PASSWORD)
      throw new Error("Environment variables not found!");
    
    this.client = new TendaClient(ENV_VARIABLES.HOST, ENV_VARIABLES.PASSWORD);
  }

  async toggleGuestWifi(
    req: Request<object, object, toggleGuestWiFiRequest>,
    res: Response<ResponseBody>
  ) {
    try {
      const { turnOnWifi } = req.body;

      const toggleGuestWifi = await this.client.toggleGuestWiFiClient(turnOnWifi);

      if (toggleGuestWifi) {
        return res.status(200).json(successResponse({ data: toggleGuestWifi }));
      } else {
        return res.status(400).json(
          errorResponse({
            message: "Не вдалося перемкнути Guest WiFi",
            error: null,
          })
        );
      }
    } catch (error) {
      logger.error("Error [toggleGuestWifi]", error);
      return res.status(500).json(errorResponse({ message: error, error }));
    }
  }

  async getGuestWifiStatus(
    _req: Request<object, object, object>,
    res: Response<ResponseBody>
  ) {
    try {
      const wifiStatus = await this.client.getGuestWiFiStatusClient();

      if (wifiStatus) {
        return res.status(200).json(
          successResponse({
            data: wifiStatus,
          })
        );
      } else {
        return res.status(400).json(
          errorResponse({
            message: "Не вдалося отримати дані Guest WiFi",
            error: null,
          })
        );
      }
    } catch (error) {
      logger.error("Error [getGuestWifiStatus]", error);
      return res.status(500).json(errorResponse({ message: error, error }));
    }
  }

  async getGuestWifiUsers(
    _req: Request<object, object, object>,
    res: Response<ResponseBody>
  ) {
    try {
      const guestWifiUsers = await this.client.getGuestWiFiUsersClient();

      if (guestWifiUsers) {
        return res.status(200).json(
          successResponse({
            data: { guestWifiUsers },
          })
        );
      } else {
        return res.status(400).json(
          errorResponse({
            message: "Не вдалося отримати дані Guest Users",
            error: null,
          })
        );
      }
    } catch (error) {
      logger.error("Error [getGuestWifiUsers]", error);
      return res.status(500).json(errorResponse({ message: error, error }));
    }
  }
}

export default TendaServices;
