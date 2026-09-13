"use client";

import { useSearchContext, SearchProvider } from "fumadocs-ui/contexts/search";
import DefaultSearchDialog from "fumadocs-ui/components/dialog/search-default";
import { NextProvider } from "fumadocs-core/framework/next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import SearchIcon from "@mui/icons-material/Search";
import { useSyncExternalStore, type ReactNode } from "react";

/**
 * One SearchProvider mounted at the root layout gives every surface -
 * landing, viewer, docs - the same Cmd/Ctrl+K dialog backed by /api/search.
 * The docs layout's own RootProvider runs with search disabled so only this
 * instance mounts a dialog and listens for the hotkey.
 */
export function DocsSearchProvider({ children }: { children: ReactNode }) {
  return (
    // The search dialog navigates with the framework router, so the provider
    // needs a FrameworkProvider above it - the docs layout only supplies one
    // inside /docs.
    <NextProvider>
      <SearchProvider
        SearchDialog={DefaultSearchDialog}
        options={{ api: "/api/search" }}
      >
        {children}
      </SearchProvider>
    </NextProvider>
  );
}

/** Header button that opens the docs search dialog. Renders the same
 *  affordance everywhere: magnifier, label, and the OS-appropriate hotkey. */
const noop = () => () => {};
const getIsMac = () => !/Windows|Linux/i.test(window.navigator.userAgent);
const getIsMacServer = () => false;

export function SearchTrigger() {
  const { setOpenSearch } = useSearchContext();
  // Server render says "Ctrl K"; after hydration, useSyncExternalStore
  // re-reads the real platform so macOS clients get "⌘K". (A plain
  // window check plus suppressHydrationWarning would leave the
  // server text unpatched.)
  const isMac = useSyncExternalStore(noop, getIsMac, getIsMacServer);

  return (
    <Button
      onClick={() => setOpenSearch(true)}
      color="inherit"
      startIcon={<SearchIcon sx={{ fontSize: 18 }} />}
      sx={{
        textTransform: "none",
        color: "text.secondary",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        px: 1.5,
        py: 0.5,
        mr: 1,
        fontSize: "0.8125rem",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      Search docs
      <Box
        component="kbd"
        sx={{
          ml: 1,
          fontSize: "0.7rem",
          fontFamily: "monospace",
          color: "text.disabled",
          border: 1,
          borderColor: "divider",
          borderRadius: 0.75,
          px: 0.5,
          lineHeight: 1.4,
        }}
      >
        {isMac ? "⌘K" : "Ctrl K"}
      </Box>
    </Button>
  );
}
