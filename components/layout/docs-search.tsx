"use client";

import { SearchProvider } from "fumadocs-ui/contexts/search";
import DefaultSearchDialog from "fumadocs-ui/components/dialog/search-default";
import { NextProvider } from "fumadocs-core/framework/next";
import type { ReactNode } from "react";

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
