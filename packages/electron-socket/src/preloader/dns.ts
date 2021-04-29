// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import dns from "dns";
import type packet from "dns-packet";
import MulticastDns from "multicast-dns";

const getaddrinfo = dns.lookup.bind(dns);

type DnsCacheEntry = {
  address: string;
  family: number;
  expires: Date;
};

const dnsCache = new Map<string, DnsCacheEntry>();

function addDnsEntry(hostname: string, address: string, family: number, ttl: number): void {
  // Scan for any entries that should be expired
  const now = new Date();
  dnsCache.forEach((entry, key) => {
    if (entry.expires >= now) {
      dnsCache.delete(key);
    }
  });

  dnsCache.set(hostname, { address, family, expires: new Date(+now + ttl) });
}

function removeDnsEntry(hostname: string): void {
  dnsCache.delete(hostname);
}

function getDnsEntry(hostname: string): DnsCacheEntry | undefined {
  // Check if this entry exists
  const entry = dnsCache.get(hostname);
  if (entry == undefined) {
    return entry;
  }

  // Check if this entry is expired
  const now = new Date();
  if (entry.expires >= now) {
    dnsCache.delete(hostname);
    return undefined;
  }

  return entry;
}

export function dnsLookup(
  hostname: string,
  options: dns.LookupOneOptions,
  // eslint-disable-next-line no-restricted-syntax
  callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void,
): void {
  if (!/\.local$/.test(hostname)) {
    getaddrinfo(hostname, options, callback);
  } else {
    mdnsLookup(hostname, options, callback);
  }
}

export function mdnsLookup(
  hostname: string,
  options: dns.LookupOneOptions,
  // eslint-disable-next-line no-restricted-syntax
  callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void,
): void {
  const MAX_ATTEMPTS = 5;
  const MIN_RETRY_MS = 750;
  const RETRY_JITTER_MS = 500;
  const DEFAULT_TTL_SEC = 120;

  // DNS cache check
  const entry = getDnsEntry(hostname);
  if (entry != undefined) {
    // eslint-disable-next-line no-restricted-syntax
    return callback(null, entry.address, entry.family);
  }

  const mdns = MulticastDns({ reuseAddr: true });
  const recordType = options.family === 6 ? "AAAA" : "A";
  let attempts = 0;
  let timer: NodeJS.Timeout;
  query();

  mdns.on("response", (res: packet.Packet) => {
    if (res.answers == undefined) {
      // Ignore this response, wait and see if another comes in
      return;
    }

    for (const answer of res.answers) {
      if (answer.name === hostname && answer.type === recordType) {
        cleanup();

        const address = answer.data;
        const family = answer.type === "AAAA" ? 6 : 4;

        if (answer.ttl === 0) {
          removeDnsEntry(hostname);
        } else {
          addDnsEntry(hostname, address, family, answer.ttl ?? DEFAULT_TTL_SEC);
        }

        // eslint-disable-next-line no-restricted-syntax
        return callback(null, address, family);
      }
    }
  });

  function cleanup() {
    mdns.destroy();
    clearInterval(timer);
  }

  function query() {
    if (++attempts >= MAX_ATTEMPTS) {
      cleanup();
      callback(new Error("Query timed out"), "", 0);
      return;
    }

    timer = setTimeout(query, MIN_RETRY_MS + Math.random() * RETRY_JITTER_MS);
    mdns.query([{ type: recordType, name: hostname }]);
  }
}
