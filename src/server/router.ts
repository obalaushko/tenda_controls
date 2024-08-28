import { Router, Request, Response } from "npm:express@4.19.2";
import { toggleGuestWiFiRequest } from "../types/request.ts";
import { ResponseBody } from "../types/response.ts";
import TendaServices from "../services/tendaServices.ts";

const router = Router();
const tendaServices = new TendaServices();

router.post(
  "/toggleGuestWifi",
  (
    req: Request<object, object, toggleGuestWiFiRequest>,
    res: Response<ResponseBody>
  ) => tendaServices.toggleGuestWifi(req, res)
);

router.post(
  "/getGuestWifiStatus",
  (req: Request<object, object, object>, res: Response<ResponseBody>) =>
    tendaServices.getGuestWifiStatus(req, res)
);

router.post(
    "/getGuestWifiUsers",
    (req: Request<object, object, object>, res: Response<ResponseBody>) =>
      tendaServices.getGuestWifiUsers(req, res)
  );

export default router;
