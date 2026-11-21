import { Fragment } from "react";

/**
 * Text with «quoted» words, shown as bold words instead of quote marks: the
 * dictionary and messages keep «» as a marker, readers see emphasis.
 */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/«([^»]+)»/g);
  return parts.map((part, i) =>
    i % 2 ? (
      <strong key={i} className="font-bold text-navy">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
