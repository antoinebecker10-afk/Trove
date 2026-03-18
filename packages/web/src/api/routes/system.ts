import type { IncomingMessage, ServerResponse } from "node:http";
import { execFile } from "node:child_process";
import { totalmem, freemem, cpus, platform, homedir } from "node:os";
import type { RouteContext } from "../types.js";
import { json } from "../middleware.js";

export async function handleSystemRoutes(
  url: string,
  method: string,
  _req: IncomingMessage,
  res: ServerResponse,
  _ctx: RouteContext,
): Promise<boolean> {
  // GET /api/system — system info
  if (url.startsWith("/api/system") && method === "GET") {
    const totalMem = totalmem();
    const freeMem = freemem();
    const cpuList = cpus();

    // Disk info via execFile (safe, no shell)
    let diskInfo = { total: 0, free: 0, used: 0 };
    try {
      const diskData = await new Promise<string>((resolvePromise) => {
        if (process.platform === "win32") {
          execFile("powershell", ["-Command", "(Get-PSDrive C).Free, (Get-PSDrive C).Used"], (err, stdout) => resolvePromise(err ? "" : stdout.trim()));
        } else {
          execFile("df", ["-B1", "/"], (err, stdout) => {
            if (err || !stdout) return resolvePromise("");
            const lines = stdout.trim().split("\n");
            resolvePromise(lines.length > 1 ? lines[1] : "");
          });
        }
      });
      if (diskData) {
        const parts = diskData.split(/\s+/).map(Number);
        if (process.platform === "win32") {
          diskInfo = { free: parts[0] || 0, used: parts[1] || 0, total: (parts[0] || 0) + (parts[1] || 0) };
        } else {
          diskInfo = { total: parts[1] || 0, used: parts[2] || 0, free: parts[3] || 0 };
        }
      }
    } catch { /* ignore */ }

    json(res, {
      platform: platform(),
      cpus: cpuList.length,
      cpuModel: cpuList[0]?.model ?? "unknown",
      totalMem,
      freeMem,
      usedMem: totalMem - freeMem,
      disk: diskInfo,
      homedir: homedir(),
      nodeVersion: process.version,
    });
    return true;
  }

  return false;
}
