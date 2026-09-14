import OverflowTooltip from "./OverflowTooltip";
import { highlightMatches } from "./HighlightMatches";
import { linkifyText } from "./Linkify";

interface TruncatedTextProps {
  text: string | null | undefined;
  wrap?: boolean;
  maxLines?: number;
  /** Search keyword to highlight within the rendered text, if any. */
  highlight?: string;
}

export default function TruncatedText({
  text,
  wrap = false,
  maxLines,
  highlight,
}: TruncatedTextProps) {
  if (!text) return <>—</>;

  const renderedText = highlightMatches(linkifyText(text), highlight ?? "");

  return (
    <OverflowTooltip
      title={renderedText}
      wrap={wrap}
      maxLines={maxLines}
      contentKey={`${text}:${highlight ?? ""}`}
      component={wrap ? "div" : "span"}
    >
      {renderedText}
    </OverflowTooltip>
  );
}
