import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** Apply after the destination page commits, including lazy-loaded pages. */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      try {
        const target = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (target) {
          target.scrollIntoView({ behavior: "instant" });
          return;
        }
      } catch {
        // A malformed anchor must not prevent opening the destination page.
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
}
