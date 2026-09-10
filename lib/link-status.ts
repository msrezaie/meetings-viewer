export type LinkCheckState =
  "checking" | "ok" | "not-found" | "http-error" | "error";

export interface LinkCheckResult {
  state: LinkCheckState;
  status?: number;
  message?: string;
}

export type LinkStatusMap = Record<string, LinkCheckResult>;
