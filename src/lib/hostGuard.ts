// Parses a Postgres connection string and makes sure the server will not be
// tricked into connecting to private or internal addresses (SSRF).

import dns from "node:dns/promises";
import net from "node:net";

export class GuardError extends Error {
  status = 400;
}

export type SslMode = "verify" | "no-verify" | "disable";

export type ConnectionTarget = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  sslMode: SslMode;
};

const blocked = new net.BlockList();

const BLOCKED_V4: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16], // cloud metadata addresses live here
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

const BLOCKED_V6: [string, number][] = [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["2001:db8::", 32],
  ["64:ff9b::", 96],
];

for (const [addr, prefix] of BLOCKED_V4) blocked.addSubnet(addr, prefix, "ipv4");
for (const [addr, prefix] of BLOCKED_V6) blocked.addSubnet(addr, prefix, "ipv6");

export function isPrivateIp(ip: string): boolean {
  const lower = ip.toLowerCase();

  // IPv4 written inside IPv6, like ::ffff:127.0.0.1
  const mappedDotted = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
  if (mappedDotted) return blocked.check(mappedDotted[1], "ipv4");

  // Same thing in hex form, like ::ffff:7f00:1
  const mappedHex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(lower);
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16);
    const lo = parseInt(mappedHex[2], 16);
    const v4 = `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
    return blocked.check(v4, "ipv4");
  }

  if (net.isIPv4(ip)) return blocked.check(ip, "ipv4");
  if (net.isIPv6(ip)) return blocked.check(ip, "ipv6");
  return true; // not a valid IP: treat as unsafe
}

export function parseConnectionString(
  raw: string,
  allowPrivate: boolean
): ConnectionTarget {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new GuardError("The connection string is not valid");
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new GuardError("The connection string must start with postgresql://");
  }

  // URL keeps IPv6 hosts inside [brackets]
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host) throw new GuardError("The connection string has no host");

  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!user) throw new GuardError("The connection string has no user name");
  if (!database) throw new GuardError("The connection string has no database name");

  const port = url.port ? Number(url.port) : 5432;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new GuardError("The port number is not valid");
  }

  const sslParam = url.searchParams.get("sslmode");
  let sslMode: SslMode = "verify";
  if (sslParam === "no-verify") sslMode = "no-verify";
  if (sslParam === "disable") {
    if (!allowPrivate) {
      throw new GuardError("SSL is required for connections to this tool");
    }
    sslMode = "disable";
  }

  return { host, port, user, password, database, sslMode };
}

// Looks up the host and returns ONE safe IP address.
// The caller must connect to this IP (not the name), so the address cannot
// change between the check and the connection (DNS rebinding).
export async function resolveSafeAddress(
  host: string,
  allowPrivate: boolean
): Promise<string> {
  let addresses: string[];

  if (net.isIP(host)) {
    addresses = [host];
  } else {
    try {
      const found = await dns.lookup(host, { all: true, verbatim: true });
      addresses = found
        .sort((a, b) => a.family - b.family) // IPv4 first
        .map((entry) => entry.address);
    } catch {
      throw new GuardError("Could not find that host");
    }
  }

  if (addresses.length === 0) throw new GuardError("Could not find that host");

  if (!allowPrivate && addresses.some(isPrivateIp)) {
    throw new GuardError("That host is not allowed");
  }

  return addresses[0];
}
