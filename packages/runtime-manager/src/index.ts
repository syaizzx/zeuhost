import express from "express";
import dotenv from "dotenv";
import { verifyHmacAuth } from "./security/hmac";
import { instancesRouter } from "./routes/instances";
import { dockerSandbox } from "./docker/client";

dotenv.config();

const app = express();
const PORT = process.env.RUNTIME_MANAGER_PORT ? parseInt(process.env.RUNTIME_MANAGER_PORT, 10) : 4001;

app.use(express.json());

// Public healthcheck
app.get("/health", async (_req, res) => {
  const dockerAlive = await dockerSandbox.ping();
  res.json({
    service: "zeuhost-runtime-manager",
    status: "ok",
    docker: dockerAlive ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Protect all other routes with HMAC authentication
app.use(verifyHmacAuth);
app.use("/instances", instancesRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[zeuhost-runtime-manager] Daemon listening on port ${PORT}`);
  });
}

export default app;
