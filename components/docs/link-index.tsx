import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import { DOC_LINKS } from "@/docs-platform/links";

/** Category heading -> deep-link anchor id ("Spider examples" -> #spider-examples). */
export function categoryAnchor(category: string): string {
  return category
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .replace(/\s+/g, "-");
}

/**
 * Renders the curated outbound-link index from docs-platform/links.ts - the
 * single registry every "useful links" mention points back to.
 */
export function LinkIndex() {
  return (
    <div>
      {DOC_LINKS.map((group) => (
        <Paper
          key={group.category}
          variant="outlined"
          id={categoryAnchor(group.category)}
          sx={{ mb: 2, p: 2 }}
        >
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {group.category}
          </Typography>
          <List dense disablePadding>
            {group.items.map((item) => (
              <ListItem key={item.url} disablePadding sx={{ py: 0.25 }}>
                <ListItemText
                  primary={
                    <Link href={item.url} target="_blank" rel="noreferrer">
                      {item.label}
                    </Link>
                  }
                  secondary={item.note}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      ))}
    </div>
  );
}
