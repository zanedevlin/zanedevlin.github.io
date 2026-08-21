import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TO ADD A POSTER:
//   { src: "/your-poster.jpg", from: "Project or Film Name", link: "/path" }
//   Leave link out entirely if the project doesn't have a page yet.
// ─────────────────────────────────────────────────────────────────────────────
// Ordered to match the filmmaking page's chronological/reference order.
const slides = [
  { src: "/poster-make-keeley-jump.jpg", from: "Make Keeley JUMP.", link: "/filmmaking" },
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
  { src: "/poster-the-space.jpg", from: "The Space", link: "/filmmaking" },
];

// Gap left between the poster's actual edge and the arrow/close buttons in
// carousel view, so they hug the image instead of sitting out at the
// window edges.
const CAROUSEL_CONTROL_GAP = 20;

const PostersSlider = () => {
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "carousel"
  const [currentIndex, setCurrentIndex] = useState(0);
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

  const openCarousel = (index) => {
    setCurrentIndex(index);
    setViewMode("carousel");
  };

  const closeCarousel = () => setViewMode("grid");

  const slideImages = (dir) => {
    if (dir === "left" && currentIndex > 0) {
      return setCurrentIndex(currentIndex - 1);
    } else if (dir === "right" && currentIndex < slides.length - 1) {
      return setCurrentIndex(currentIndex + 1);
    }
  };

  // Swipe left/right on the poster to move between slides - this is the
  // only way to navigate on mobile, since the arrows are hidden there in
  // favor of giving the poster itself more room (see the mobile media
  // query in style.css).
  const SWIPE_THRESHOLD = 40;
  const touchStartRef = useRef(null);

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
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
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <ul className="posters-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
            {slides.map((slide, index) => (
              <li key={index}>
                <img
                  src={slide.src}
                  alt={`Poster ${index + 1}`}
                  ref={index === currentIndex ? currentImgRef : undefined}
                  loading={index === currentIndex ? "eager" : "lazy"}
                  decoding="async"
                  onLoad={index === currentIndex
                    ? (e) => setHalfImgWidth(e.currentTarget.getBoundingClientRect().width / 2)
                    : undefined}
                />
              </li>
            ))}
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
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}

      {/* Caption */}
      <div className="poster-caption">
        <span className="poster-caption-label">From:</span>
        {current.link
          ? <a href={current.link} className="poster-caption-link">{current.from}</a>
          : <span className="poster-caption-text">{current.from}</span>
        }
        <span className="poster-counter">{currentIndex + 1} / {slides.length}</span>
      </div>
    </div>
  );
};

export default PostersSlider;
