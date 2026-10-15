import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

const SECRET_KEY = process.env.RUNTIME_MANAGER_SECRET || "default_dev_hmac_secret_32_bytes_long";
const MAX_TIME_DRIFT_SECONDS = 300; // 5 minutes

export function verifyHmacAuth(req: Request, res: Response, next: NextFunction): void {
  // Allow health check without auth
  if (req.path === "/health") {
    next();
    return;
  }

  const timestamp = req.headers["x-zeuhost-timestamp"];
  const signature = req.headers["x-zeuhost-signature"];

  if (!timestamp || !signature || typeof timestamp !== "string" || typeof signature !== "string") {
    res.status(401).json({ error: "Missing authentication headers" });
    return;
  }

  // Prevent replay attacks with timestamp check
  const requestTime = parseInt(timestamp, 10);
  const currentTime = Math.floor(Date.now() / 1000);

  if (isNaN(requestTime) || Math.abs(currentTime - requestTime) > MAX_TIME_DRIFT_SECONDS) {
    res.status(401).json({ error: "Timestamp expired or invalid" });
    return;
  }

  // Calculate expected signature
  const payload = `${timestamp}:${req.method}:${req.path}:${JSON.stringify(req.body || {})}`;
  const expectedSignature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(payload)
    .digest("hex");

  try {
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      res.status(403).json({ error: "Invalid HMAC signature" });
      return;
    }
  } catch {
    res.status(403).json({ error: "Signature verification failed" });
    return;
  }

  next();
}

export function generateHmacHeaders(method: string, path: string, body: Record<string, unknown> = {}) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = `${timestamp}:${method}:${path}:${JSON.stringify(body)}`;
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(payload)
    .digest("hex");

  return {
    "x-zeuhost-timestamp": timestamp,
    "x-zeuhost-signature": signature,
  };
}
