import { useState, useEffect, useRef } from "react";
import CloserLook, { CloserLookButton } from "./CloserLook.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// TO ADD A POSTER:
//   { src: "/your-poster.jpg", from: "Project or Film Name", link: "/path" }
//   Leave link out entirely if the project doesn't have a page yet.
// ─────────────────────────────────────────────────────────────────────────────
// Ordered to match the filmmaking page's chronological/reference order.
const slides = [
  { src: "/poster-aftv-student-film-night.jpg", from: "AFTV Student Film Night" },
  { src: "/poster-ernst-trail-1.jpg", from: "Ernst Trail", link: "https://www.youtube.com/watch?v=vmqRLrltVJE" },
  { src: "/poster-ernst-trail-2.jpg", from: "Ernst Trail", link: "https://www.youtube.com/watch?v=vmqRLrltVJE" },
  { src: "/poster-ernst-trail-3.jpg", from: "Ernst Trail", link: "https://www.youtube.com/watch?v=vmqRLrltVJE" },
  { src: "/poster-make-keeley-jump.jpg", from: "Make Keeley JUMP.", link: "/filmmaking" },
  { src: "/poster-adaptation-screening.jpg", from: "Adaptation Screening (Amore Mio)", link: "/filmmaking?category=Collaborations" },
  { src: "/poster-chicken-sandwich.jpg", from: "Chicken Sandwich", link: "/filmmaking" },
  { src: "/poster-vigilante.jpg", from: "VIGILANTE", link: "/filmmaking" },
  { src: "/poster-teenage-wasteland-1.jpg", from: "Teenage Wasteland", link: "/filmmaking" },
  { src: "/poster-teenage-wasteland-2.jpg", from: "Teenage Wasteland", link: "/filmmaking" },
  { src: "/poster-teenage-wasteland-3.jpg", from: "Teenage Wasteland", link: "/filmmaking" },
  { src: "/poster-teenage-wasteland-4.jpg", from: "Teenage Wasteland", link: "/filmmaking" },
  { src: "/poster-the-pen-1.jpg", from: "The Pen Scene", link: "/filmmaking" },
  { src: "/poster-the-pen-2.jpg", from: "The Pen Scene", link: "/filmmaking" },
  { src: "/poster-get-out.jpg", from: "Get Out Scene Recreation", link: "/filmmaking" },
  { src: "/poster-surreal.jpg", from: "Surreal", link: "/filmmaking" },
  { src: "/poster-da-bomb-1.jpg", from: "Da Bomb", link: "/filmmaking" },
  { src: "/poster-da-bomb-2.jpg", from: "Da Bomb", link: "/filmmaking" },
  { src: "/poster-game-over.jpg", from: "GAME OVER", link: "/filmmaking" },
  { src: "/poster-vukovich-night-guard.jpg", from: "Vukovich Night Guard", link: "/filmmaking" },
  { src: "/poster-the-space.jpg", from: "The Space", link: "/filmmaking?open=The%20Space" },
  { src: "/poster-the-space-2.jpg", from: "The Space", link: "/filmmaking?open=The%20Space" },
  { src: "/poster-the-space-7.jpg", from: "The Space", link: "/filmmaking?open=The%20Space" },
  { src: "/poster-the-space-3.jpg", from: "The Space", link: "/filmmaking?open=The%20Space" },
  { src: "/poster-the-space-4.jpg", from: "The Space", link: "/filmmaking?open=The%20Space" },
  { src: "/poster-the-space-5.jpg", from: "The Space", link: "/filmmaking?open=The%20Space" },
  { src: "/poster-the-space-6.jpg", from: "The Space", link: "/filmmaking?open=The%20Space" },
  { src: "/poster-the-space-8.jpg", from: "The Space", link: "/filmmaking?open=The%20Space" },
  { src: "/poster-the-space-9.jpg", from: "The Space", link: "/filmmaking?open=The%20Space" },
  { src: "/poster-the-space-10.jpg", from: "The Space", link: "/filmmaking?open=The%20Space" },
];

// Gap left between the poster's actual edge and the arrow/close buttons in
// carousel view, so they hug the image instead of sitting out at the
// window edges.
const CAROUSEL_CONTROL_GAP = 20;

const PostersSlider = () => {
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "carousel"
  // true when the closer-look viewer is showing the current poster
  const [closerLook, setCloserLook] = useState(false);
  // Infinite carousel: the track carries a clone of the last poster in
  // front and a clone of the first behind, so stepping off either end
  // animates one poster forward and is then swapped for the real one with
  // the transition switched off - never a rewind through the whole strip.
  // Same treatment as ProjectSlider.jsx.
  const count = slides.length;
  const loop = count > 1;
  const extended = loop ? [slides[count - 1], ...slides, slides[0]] : slides;
  const [pos, setPos] = useState(loop ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const currentIndex = loop ? (((pos - 1) % count) + count) % count : 0;
  const [gutter, setGutter] = useState(40);
  const gridWrapperRef = useRef(null);

  // Half the rendered width of the currently-visible poster, in px. Used to
  // position the prev/next arrows and the close button relative to the
  // poster itself (which varies in width per aspect ratio) instead of
  // pinning them to the edges of the whole slider/window.
  const [halfImgWidth, setHalfImgWidth] = useState(170);
  const currentImgRef = useRef(null);

  useEffect(() => {
    if (viewMode !== "carousel") return;

    const measure = () => {
      const img = currentImgRef.current;
      const width = img?.getBoundingClientRect().width;
      if (width) setHalfImgWidth(width / 2);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [viewMode, currentIndex]);

  // The page-level "← Back" link above the title lives outside this
  // component (it's static Astro markup, since it's shared across every
  // project page). In carousel view it's easy to mistake for "close the
  // carousel" - relabel it here so it's clear it actually navigates away.
  useEffect(() => {
    const backLink = document.getElementById("postersBackLink");
    if (!backLink) return;
    backLink.textContent = viewMode === "carousel" ? "← Back to Home" : "← Back";
  }, [viewMode]);

  // Size the left/right gutters in the album view to match the width of one
  // poster tile exactly, at any viewport width - not an approximation.
  // Mirrors the browser's own auto-fill/minmax column math (see the
  // .posters-grid values in style.css) to solve for the gutter that makes a
  // tile-shaped column fit flush against each edge. On phone-width screens
  // this is skipped in favor of a small fixed margin - matching a full tile
  // width there would collapse the grid down to a single column.
  useEffect(() => {
    if (viewMode !== "grid") return;

    const MOBILE_GUTTER = 24;

    const computeGutter = () => {
      const el = gridWrapperRef.current;
      if (!el) return;

      if (window.innerWidth <= 768) {
        setGutter((prev) => (Math.abs(prev - MOBILE_GUTTER) > 0.5 ? MOBILE_GUTTER : prev));
        return;
      }

      const totalWidth = el.offsetWidth; // unaffected by this element's own padding
      const tileMin = 150;
      const gap = 16;

      let lo = 0;
      let hi = totalWidth / 2;
      for (let i = 0; i < 30; i++) {
        const g = (lo + hi) / 2;
        const contentWidth = totalWidth - 2 * g;
        if (contentWidth <= 0) { hi = g; continue; }
        const cols = Math.max(1, Math.floor((contentWidth + gap) / (tileMin + gap)));
        const tileWidth = (contentWidth - (cols - 1) * gap) / cols;
        if (tileWidth > g) lo = g; else hi = g;
      }
      const next = Math.max(16, Math.min(320, (lo + hi) / 2));
      setGutter((prev) => (Math.abs(prev - next) > 0.5 ? next : prev));
    };

    computeGutter();
    window.addEventListener("resize", computeGutter);
    return () => window.removeEventListener("resize", computeGutter);
  }, [viewMode]);

  // ?open=<the poster's "from" value> opens that poster straight into the
  // carousel, so another page can point at one specific poster rather than
  // at the grid. Matched case-insensitively against `from` because the
  // link is written by hand on the other page and a trailing full stop or
  // a capital is an easy thing to get slightly wrong.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const want = new URLSearchParams(window.location.search).get("open");
    if (!want) return;
    const norm = (v) => (v || "").trim().toLowerCase().replace(/\.$/, "");
    const index = slides.findIndex((s) => norm(s.from) === norm(want));
    if (index === -1) return;
    setAnimate(false);
    setPos(loop ? index + 1 : 0);
    setViewMode("carousel");
    // Drop the parameter so a refresh or a shared URL is not stuck on it.
    const url = new URL(window.location.href);
    url.searchParams.delete("open");
    window.history.replaceState({}, "", url);
  }, []);

  const openCarousel = (index) => {
    setAnimate(false);
    setPos(loop ? index + 1 : 0);
    setViewMode("carousel");
  };

  const closeCarousel = () => setViewMode("grid");

  // Functional update so this never closes over a stale currentIndex -
  // needed because the touch listeners below are attached once via a
  // plain DOM addEventListener (not React's synthetic props), so they
  // can't rely on re-render to pick up a fresh currentIndex each time.
  const slideImages = (dir) => {
    if (!loop) return;
    setAnimate(true);
    setPos((prev) => (dir === "left" ? prev - 1 : prev + 1));
  };

  const goTo = (index) => {
    setAnimate(true);
    setPos(loop ? index + 1 : 0);
  };

  // Swap off a clone and back onto the real poster once the animation
  // onto the clone has finished.
  const handleTransitionEnd = (e) => {
    if (e.propertyName !== "transform" || !loop) return;
    if (pos === count + 1) {
      setAnimate(false);
      setPos(1);
    } else if (pos === 0) {
      setAnimate(false);
      setPos(count);
    }
  };

  // Re-arm the transition only after the browser has painted the
  // un-animated jump, otherwise React batches the two together and the
  // snap shows up as a rewind.
  useEffect(() => {
    if (animate) return;
    let inner;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setAnimate(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      if (inner) cancelAnimationFrame(inner);
    };
  }, [animate]);

  // Swipe left/right on the poster to move between slides - this is the
  // only way to navigate on mobile, since the arrows are hidden there in
  // favor of giving the poster itself more room (see the mobile media
  // query in style.css).
  const SWIPE_THRESHOLD = 40;
  const trackClipRef = useRef(null);

  useEffect(() => {
    const el = trackClipRef.current;
    if (!el) return;

    const touchStart = { current: null };
    // Which axis this drag turned out to be, decided from the first few
    // pixels of movement and then locked in for the rest of the gesture -
    // see the comment on handleTouchMove below for why this exists.
    const swipeAxis = { current: null };

    const handleTouchStart = (e) => {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
      swipeAxis.current = null;
    };

    const handleTouchMove = (e) => {
      const start = touchStart.current;
      if (!start) return;
      const t = e.touches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;

      if (swipeAxis.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        swipeAxis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      // Once a drag reads as mostly horizontal, claim it as a swipe and
      // block the page's native vertical scroll underneath it. Without
      // this, a real touchscreen hands any drag with even a slight
      // vertical wobble over to native scrolling before touchend ever
      // fires (the browser sends touchcancel instead), so the poster
      // never advances - a real swipe always has some wobble, so this
      // bites for real fingers even though it never showed up testing
      // with synthetic touch events, which don't go through the
      // browser's scroll-vs-gesture arbitration at all.
      if (swipeAxis.current === "x") {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;

      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;

      // Only treat it as a slide-swipe if the motion is mostly horizontal -
      // otherwise a vertical scroll on the page would also flip slides.
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
        slideImages(dx < 0 ? "right" : "left");
      }
    };

    // touchmove must be a real (non-React) listener registered with
    // { passive: false } - React's onTouchMove prop, like the browser
    // default, attaches touch listeners as passive, which silently
    // ignores preventDefault() and lets the page scroll anyway.
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [viewMode, slides.length]);

  // Left/right arrows walk the carousel. The viewer, when open, handles
  // them itself and stops the event, so these never both fire.
  useEffect(() => {
    if (viewMode !== "carousel") return;
    const onKeyDown = (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const el = e.target;
      const tag = el && el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el && el.isContentEditable)) return;
      e.preventDefault();
      slideImages(e.key === "ArrowLeft" ? "left" : "right");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewMode, loop, count]);

  // Let Escape back out of the carousel, same as clicking the close button.
  useEffect(() => {
    if (viewMode !== "carousel") return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeCarousel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewMode]);

  if (viewMode === "grid") {
    return (
      <div
        className="posters-grid-wrapper"
        ref={gridWrapperRef}
        style={{ paddingLeft: `${gutter}px`, paddingRight: `${gutter}px` }}
      >
        <div className="posters-grid">
          {slides.map((slide, index) => (
            <button
              key={index}
              type="button"
              className="poster-grid-item"
              onClick={() => openCarousel(index)}
              aria-label={`Open poster from ${slide.from}`}
            >
              <img src={slide.src} alt={`Poster from ${slide.from}`} loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const current = slides[currentIndex];

  return (
    <div className="posters-slider">
      <button
        type="button"
        className="closer-look-btn closer-look-btn--poster"
        style={{ left: `calc(50% - ${halfImgWidth - 12}px)` }}
        aria-label="Take a closer look"
        title="Closer look"
        onClick={() => setCloserLook(true)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <line x1="15.5" y1="15.5" x2="20.5" y2="20.5" />
          <line x1="10.5" y1="7.5" x2="10.5" y2="13.5" />
          <line x1="7.5" y1="10.5" x2="13.5" y2="10.5" />
        </svg>
      </button>

      {closerLook && (
        <CloserLook
          src={current.src}
          alt={`Poster from ${current.from}`}
          onNavigate={loop ? (dir) => slideImages(dir < 0 ? "left" : "right") : undefined}
          onClose={() => setCloserLook(false)}
        />
      )}

      <button
        type="button"
        className="posters-close-btn"
        style={{ left: `calc(50% + ${halfImgWidth - 18}px)` }}
        onClick={closeCarousel}
        aria-label="Back to all posters"
      >&#10005;</button>

      <div className="posters-track-wrapper">
        <div
          className="image-slider-lr-toggle left-toggle"
          style={{ right: `calc(50% + ${halfImgWidth + CAROUSEL_CONTROL_GAP}px)` }}
          onClick={() => slideImages("left")}
        >&#8592;</div>

        <div
          className="posters-track-clip"
          ref={trackClipRef}
        >
          <ul
            className="posters-track"
            style={{
              transform: `translateX(-${pos * 100}%)`,
              transition: animate ? undefined : "none",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {extended.map((slide, k) => {
              // Map a position in the padded track back onto the real
              // poster it stands for; measurement follows the position
              // on screen, not the real index, so clones measure too.
              const index = loop ? (((k - 1) % count) + count) % count : k;
              return (
                <li key={k}>
                  <img
                    src={slide.src}
                    alt={`Poster ${index + 1}`}
                    ref={k === pos ? currentImgRef : undefined}
                    onClick={() => { if (k === pos) setCloserLook(true); }}
                    loading={k === pos ? "eager" : "lazy"}
                    decoding="async"
                    onLoad={k === pos
                      ? (e) => setHalfImgWidth(e.currentTarget.getBoundingClientRect().width / 2)
                      : undefined}
                  />
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className="image-slider-lr-toggle right-toggle"
          style={{ left: `calc(50% + ${halfImgWidth + CAROUSEL_CONTROL_GAP}px)` }}
          onClick={() => slideImages("right")}
        >&#8594;</div>
      </div>

      {slides.length > 1 && (
        <div className="slide-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`slide-dot ${index === currentIndex ? "active" : ""}`}
              aria-label={`Go to poster ${index + 1}`}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      )}

      {/* Caption */}
      <div className="poster-caption">
        <span className="poster-caption-label">From:</span>
        {current.link
          ? <a
              href={current.link}
              className="poster-caption-link"
              {...(/^https?:/.test(current.link) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >{current.from}</a>
          : <span className="poster-caption-text">{current.from}</span>
        }
        <span className="poster-counter">{currentIndex + 1} / {slides.length}</span>
      </div>
    </div>
  );
};

export default PostersSlider;
