import logger from "./utils/logger.ts";
import express from "npm:express@4.19.2";
// import { getFreePort } from "https://deno.land/x/free_port@v1.2.0/mod.ts";
import router from "./server/router.ts";

// const PORT = await getFreePort(3001);
const PORT = 3001;

logger.info("Start tenda controls...");

const app = express();

app.use(express.json());

app.use("/api", router);

app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}...`);
});
