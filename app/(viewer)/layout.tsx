import Box from "@mui/material/Box";
import { PAGE_PADDING, SECTION_GAP } from "@/lib/ui-constants";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: SECTION_GAP,
        flex: 1,
        minHeight: 0,
        height: { sm: "100%" },
        overflow: { sm: "hidden" },
        p: PAGE_PADDING,
      }}
    >
      {children}
    </Box>
  );
}
