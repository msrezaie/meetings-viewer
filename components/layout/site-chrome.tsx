"use client";

import Box from "@mui/material/Box";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

/**
 * Site chrome (header + footer + main wrapper). The Keystatic editor at
 * /keystatic renders bare - its own shell owns the viewport, and site
 * chrome would wrap it in an extra header/footer.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/keystatic")) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <SiteHeader />
      <Box
        component="main"
        sx={{ display: "flex", flexDirection: "column", flex: 1 }}
      >
        {children}
      </Box>
      <SiteFooter />
    </Box>
  );
}
