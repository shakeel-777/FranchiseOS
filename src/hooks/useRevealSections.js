import { useEffect } from 'react';

// Mirrors setupLandingInteractions() from the original js/landing.js: reveals
// landing sections as they scroll into view (with immediate + safety-net passes).
export function useRevealSections() {
  useEffect(() => {
    const targets = document.querySelectorAll('.landing-section, .stats-section, .cta-section');

    targets.forEach((t) => {
      const rect = t.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) t.classList.add('revealed');
    });

    let obs;
    if ('IntersectionObserver' in window) {
      obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('revealed');
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.05 }
      );
      targets.forEach((t) => { if (!t.classList.contains('revealed')) obs.observe(t); });
    }

    const timeout = setTimeout(() => { targets.forEach((t) => t.classList.add('revealed')); }, 800);

    return () => {
      clearTimeout(timeout);
      if (obs) obs.disconnect();
    };
  }, []);
}
