"use client";

import { useCallback, useMemo, useState } from "react";
import type { MeetingRecord } from "@/lib/scraper-data";
import type { LinkStatusMap } from "@/lib/link-status";

const API_BATCH_SIZE = 50;

export interface MeetingLinkStatusState {
  statusByUrl: LinkStatusMap;
  totalLinks: number;
  checkedCount: number;
  isChecking: boolean;
  checkAllLinks: () => Promise<void>;
  checkLink: (url: string) => void;
}

function uniqueLinkUrls(records: MeetingRecord[]): string[] {
  return [
    ...new Set(
      records.flatMap((record) =>
        (record.links ?? []).map((link) => link.href).filter(Boolean)
      )
    ),
  ];
}

export function useMeetingLinkStatus(
  records: MeetingRecord[]
): MeetingLinkStatusState {
  const urls = useMemo(() => uniqueLinkUrls(records), [records]);
  const [statusByUrl, setStatusByUrl] = useState<LinkStatusMap>({});
  const [isChecking, setIsChecking] = useState(false);

  const requestStatuses = useCallback(async (urlsToCheck: string[]) => {
    if (!urlsToCheck.length) return;

    setStatusByUrl((previous) => {
      const next = { ...previous };
      for (const url of urlsToCheck) next[url] = { state: "checking" };
      return next;
    });

    try {
      const response = await fetch("/api/link-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlsToCheck }),
      });
      if (!response.ok) throw new Error("Link status request failed");

      const body = (await response.json()) as { statuses?: LinkStatusMap };
      setStatusByUrl((previous) => ({
        ...previous,
        ...(body.statuses ?? {}),
      }));
    } catch {
      setStatusByUrl((previous) => {
        const next = { ...previous };
        for (const url of urlsToCheck) {
          next[url] = { state: "error", message: "Status check failed" };
        }
        return next;
      });
    }
  }, []);

  const checkLink = useCallback(
    (url: string) => {
      void requestStatuses([url]);
    },
    [requestStatuses]
  );

  const checkAllLinks = useCallback(async () => {
    if (!urls.length || isChecking) return;

    setIsChecking(true);
    try {
      for (let index = 0; index < urls.length; index += API_BATCH_SIZE) {
        await requestStatuses(urls.slice(index, index + API_BATCH_SIZE));
      }
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, requestStatuses, urls]);

  const checkedCount = useMemo(
    () =>
      urls.filter((url) => {
        const status = statusByUrl[url];
        return status && status.state !== "checking";
      }).length,
    [statusByUrl, urls]
  );

  return {
    statusByUrl,
    totalLinks: urls.length,
    checkedCount,
    isChecking,
    checkAllLinks,
    checkLink,
  };
}
