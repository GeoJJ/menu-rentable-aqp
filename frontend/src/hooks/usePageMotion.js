import { useEffect } from "react";

const targets = [
  ".home-page > section",
  ".home-step",
  ".home-tip-grid > article",
  ".flow-welcome",
  ".section-intro",
  ".plan-metrics",
  ".record-metrics",
].join(",");

// Reveal each section once; dynamically loaded cards join the same observer.
export function usePageMotion(page) {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!window.IntersectionObserver) return;
    let stop = () => {};
    function start() {
      stop();
      if (preference.matches) return;
      const tracked = new Set();
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.dataset.motion = "visible";
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0, rootMargin: "0px 0px -24px 0px" },
      );
      function scan() {
        document.querySelectorAll(targets).forEach((element) => {
          if (tracked.has(element) || element.closest("[hidden]")) return;
          tracked.add(element);
          element.dataset.motion = "pending";
          observer.observe(element);
        });
      }
      scan();
      const mutations = new MutationObserver(scan);
      mutations.observe(document.getElementById("main-content"), {
        childList: true,
        subtree: true,
      });
      stop = () => {
        observer.disconnect();
        mutations.disconnect();
        tracked.forEach((element) => delete element.dataset.motion);
      };
    }
    start();
    preference.addEventListener("change", start);
    return () => {
      stop();
      preference.removeEventListener("change", start);
    };
  }, [page]);
}
