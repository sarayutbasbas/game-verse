import type { IncomingMessage } from "node:http";
import { isIP } from "node:net";
/** Only Vercel's managed ingress is trusted to overwrite X-Forwarded-For. */
export function clientAddress(req: IncomingMessage) {
  if (process.env.VERCEL === "1") {
    const header=req.headers["x-forwarded-for"];
    const ip=typeof header === "string" ? header.split(",")[0].trim() : "";
    if (isIP(ip)) return ip;
  }
  return req.socket.remoteAddress ?? "unknown";
}
