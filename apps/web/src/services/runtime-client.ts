import crypto from "crypto";

const RUNTIME_MANAGER_URL = process.env.RUNTIME_MANAGER_URL || "http://127.0.0.1:4001";
const HMAC_SECRET = process.env.RUNTIME_MANAGER_SECRET || "default_dev_hmac_secret_32_bytes_long";

interface SpawnPayload {
  instanceId: string;
  image: string;
  env: Record<string, string>;
  memoryMb: number;
  cpuCores: number;
}

export class RuntimeClient {
  private generateHeaders(method: string, path: string, body?: Record<string, unknown>) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = `${timestamp}:${method}:${path}:${JSON.stringify(body || {})}`;
    const signature = crypto
      .createHmac("sha256", HMAC_SECRET)
      .update(payload)
      .digest("hex");

    return {
      "Content-Type": "application/json",
      "x-zeuhost-timestamp": timestamp,
      "x-zeuhost-signature": signature,
    };
  }

  async spawnContainer(data: SpawnPayload) {
    const path = "/instances/spawn";
    const res = await fetch(`${RUNTIME_MANAGER_URL}${path}`, {
      method: "POST",
      headers: this.generateHeaders("POST", path, data as unknown as Record<string, unknown>),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown runtime manager error" }));
      throw new Error(`Runtime Manager error: ${err.error || res.statusText}`);
    }

    return (await res.json()) as { success: boolean; containerId: string; status: string };
  }

  async startContainer(containerId: string) {
    const path = `/instances/${containerId}/start`;
    const res = await fetch(`${RUNTIME_MANAGER_URL}${path}`, {
      method: "POST",
      headers: this.generateHeaders("POST", path),
    });

    if (!res.ok) {
      throw new Error(`Failed to start container ${containerId}: ${res.statusText}`);
    }
    return res.json();
  }

  async stopContainer(containerId: string) {
    const path = `/instances/${containerId}/stop`;
    const res = await fetch(`${RUNTIME_MANAGER_URL}${path}`, {
      method: "POST",
      headers: this.generateHeaders("POST", path),
    });

    if (!res.ok) {
      throw new Error(`Failed to stop container ${containerId}: ${res.statusText}`);
    }
    return res.json();
  }

  async restartContainer(containerId: string) {
    const path = `/instances/${containerId}/restart`;
    const res = await fetch(`${RUNTIME_MANAGER_URL}${path}`, {
      method: "POST",
      headers: this.generateHeaders("POST", path),
    });

    if (!res.ok) {
      throw new Error(`Failed to restart container ${containerId}: ${res.statusText}`);
    }
    return res.json();
  }

  async removeContainer(containerId: string) {
    const path = `/instances/${containerId}`;
    const res = await fetch(`${RUNTIME_MANAGER_URL}${path}`, {
      method: "DELETE",
      headers: this.generateHeaders("DELETE", path),
    });

    if (!res.ok) {
      throw new Error(`Failed to remove container ${containerId}: ${res.statusText}`);
    }
    return res.json();
  }

  async getLogs(containerId: string, tail = 100): Promise<string> {
    const path = `/instances/${containerId}/logs?tail=${tail}`;
    const res = await fetch(`${RUNTIME_MANAGER_URL}${path}`, {
      method: "GET",
      headers: this.generateHeaders("GET", path),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch logs for container ${containerId}: ${res.statusText}`);
    }
    const data = await res.json();
    return data.logs || "";
  }

  async getStats(containerId: string) {
    const path = `/instances/${containerId}/stats`;
    const res = await fetch(`${RUNTIME_MANAGER_URL}${path}`, {
      method: "GET",
      headers: this.generateHeaders("GET", path),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch stats for container ${containerId}: ${res.statusText}`);
    }
    const data = await res.json();
    return data.stats;
  }
}

export const runtimeClient = new RuntimeClient();
