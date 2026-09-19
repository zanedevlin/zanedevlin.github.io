import { useState, useRef, useEffect } from "react";
import CloserLook, { CloserLookButton } from "./CloserLook.jsx";

/**
 * slides accepts a plain image path, a captioned photograph, or a
 * two-sided piece:
 *   "/photo.jpg"                          - an ordinary slide
 *   { src: "/photo.jpg", caption: "..." } - the same, with a caption
 *   { src: "/photo.jpg", feature: true }  - shown double width in the album
 *   { front: "/a.jpg", back: "/b.jpg" }   - a slide that flips in place
 *
 * A caption belongs on the photograph it describes rather than in the
 * project's write-up: it is read at the moment the visitor is looking at
 * the thing it refers to, and it keeps the description above from
 * swelling into an essay.
 *
 * The flip case exists for the Italy textiles, which are printed on both
 * sides of the fabric: the two photographs are one object, so turning the
 * piece over belongs on the slide itself rather than as the next slide.
 *
 * album: opens on a grid of every photo (the album view) and drops into
 * the carousel at whichever one is clicked, the same way the posters page
 * behaves. Set it on any project holding six or more photos.
 *
 * albumOpensViewer: an album whose photographs go straight to the closer-look
 * viewer when clicked, rather than into the carousel. For a set of separate
 * photographs that is the shorter route - grid, look, out - and the arrows
 * inside the viewer still walk the whole album. It is opt-in because an album
 * holding two-sided pieces needs the carousel: the flip lives on the slide,
 * and the viewer has no way to turn a piece over.
 */
const isFlipSlide = (slide) => typeof slide === "object" && slide !== null && slide.back;
const slideSrc = (slide) => {
    if (typeof slide === "string") return slide;
    return isFlipSlide(slide) ? slide.front : slide.src;
};
const slideCaption = (slide) =>
    (typeof slide === "object" && slide !== null ? slide.caption : undefined);

const ProjectSlider = ({ slides, album = false, albumOpensViewer = false }) => {
    const [viewMode, setViewMode] = useState(album ? "grid" : "carousel");

    // ── Infinite carousel ────────────────────────────────────────────
    // The track carries a clone of the last slide in front and a clone of
    // the first slide behind, so stepping off either end animates forward
    // onto a clone and is then swapped for the real slide with the
    // transition switched off. The visitor only ever sees one slide move
    // in the direction they asked for - never the whole strip rewinding
    // past every photo to get back to the start.
    const count = slides.length;
    const loop = count > 1;
    // Two-sided pieces are one slide but two photographs - count them as
    // two so the album's own total matches the count badge on its tile.
    const photoCount = slides.reduce((n, s) => n + (isFlipSlide(s) ? 2 : 1), 0);
    const extended = loop ? [slides[count - 1], ...slides, slides[0]] : slides;

    // Position in `extended` (1 is the first real slide when looping).
    const [pos, setPos] = useState(loop ? 1 : 0);
    const [animate, setAnimate] = useState(true);
    const currentIndex = loop ? (((pos - 1) % count) + count) % count : 0;

    // Keyed by real slide index so a piece stays turned the way the
    // visitor left it, clones included.
    const [flipped, setFlipped] = useState({});

    // Functional update so this never closes over a stale position -
    // needed because the touch listeners below are attached once via a
    // plain DOM addEventListener (not React's synthetic props), so they
    // can't rely on re-render to pick up a fresh position each time.
    const slideImages = (dir) => {
        if (!loop) return;
        setAnimate(true);
        setPos((prev) => (dir === "left" ? prev - 1 : prev + 1));
    };

    const goTo = (index) => {
        setAnimate(true);
        setPos(loop ? index + 1 : 0);
    };

    // The swap off a clone and back onto the real slide, once the
    // animation onto the clone has finished.
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
    // snap is visible as a rewind.
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

    const openAt = (index) => {
        setAnimate(false);
        setPos(loop ? index + 1 : 0);
        setViewMode("carousel");
    };

    // ── Album gutters ────────────────────────────────────────────────
    // Gutters so the photographs never run to the edge of the screen,
    // derived the same way the posters album derives its own (see
    // PostersSlider.jsx) but capped - see the note on the cap below. This mirrors the browser's own
    // auto-fill/minmax column maths (see .album-grid in style.css) and
    // solves for the gutter that makes a tile-shaped column sit flush
    // against each edge. On phone widths a small fixed margin is used
    // instead - a full tile width there would collapse the grid to one
    // column. Ported from PostersSlider.jsx; keep the two in step.
    const ALBUM_TILE_MIN = 240;
    const ALBUM_GAP = 16;
    const [gutter, setGutter] = useState(40);
    const albumWrapRef = useRef(null);

    useEffect(() => {
        if (viewMode !== "grid") return;

        const MOBILE_GUTTER = 24;

        const computeGutter = () => {
            const el = albumWrapRef.current;
            if (!el) return;

            if (window.innerWidth <= 768) {
                setGutter((prev) => (Math.abs(prev - MOBILE_GUTTER) > 0.5 ? MOBILE_GUTTER : prev));
                return;
            }

            // offsetWidth is unaffected by this element's own padding - a
            // block fills its parent either way - so this stays stable as
            // the gutter it produces is applied back to it.
            const totalWidth = el.offsetWidth;

            let lo = 0;
            let hi = totalWidth / 2;
            for (let i = 0; i < 30; i++) {
                const g = (lo + hi) / 2;
                const contentWidth = totalWidth - 2 * g;
                if (contentWidth <= 0) { hi = g; continue; }
                const cols = Math.max(1, Math.floor((contentWidth + ALBUM_GAP) / (ALBUM_TILE_MIN + ALBUM_GAP)));
                const tileWidth = (contentWidth - (cols - 1) * ALBUM_GAP) / cols;
                if (tileWidth > g) lo = g; else hi = g;
            }
            // Capped. Solving for a gutter exactly one tile wide is the
            // posters grid's rule, and it works there because a poster
            // tile is 150px. At the album's 240px tiles the same rule
            // eats the page - 272px of margin a side, and only two
            // columns left at 1280px - so the solved value is treated as
            // an upper bound rather than the answer.
            const next = Math.max(16, Math.min(140, (lo + hi) / 2));
            setGutter((prev) => (Math.abs(prev - next) > 0.5 ? next : prev));
        };

        computeGutter();
        window.addEventListener("resize", computeGutter);
        return () => window.removeEventListener("resize", computeGutter);
    }, [viewMode]);

    // ── Album grid layout ────────────────────────────────────────────
    // Every preview keeps its own photograph's shape, so the grid rows
    // are 8px tall and each item is given however many of them its
    // rendered height needs. That is what CSS `columns` would do for free,
    // but columns fill top-to-bottom - the album would read 1, 4, 7 across
    // the first row instead of 1, 2, 3 - so the spans are measured here
    // and the normal left-to-right grid order is kept.
    /* A slide marked { feature: true } is given two columns in the album
       grid instead of one, so the photograph that explains the whole
       project is the one the eye lands on first. The masonry measures
       each tile after it renders (below), so a wider tile simply comes
       back taller and the layout still packs. */
    const isFeature = (slide) =>
        typeof slide === "object" && slide !== null && slide.feature === true;

    const gridRef = useRef(null);

    useEffect(() => {
        if (viewMode !== "grid") return;
        const grid = gridRef.current;
        if (!grid) return;

        const items = Array.from(grid.querySelectorAll(".album-thumb"));
        const layout = () => {
            // Read the row height and gap off the stylesheet rather than
            // hard-coding them, so the mobile breakpoint's tighter gap
            // stays correct.
            const cs = getComputedStyle(grid);
            const row = parseFloat(cs.gridAutoRows) || 8;
            const gap = parseFloat(cs.rowGap) || 0;
            items.forEach((el) => {
                const height = el.getBoundingClientRect().height;
                if (!height) return;
                const span = Math.ceil((height + gap) / (row + gap));
                el.style.gridRowEnd = `span ${span}`;
            });
            grid.classList.add("is-laid-out");
        };

        layout();

        // Each image is measured again once it has actually decoded, and
        // whenever its width changes. Observing the images rather than the
        // grid matters: setting a row span resizes the grid, which would
        // feed an observer on the grid straight back into itself.
        const imgs = Array.from(grid.querySelectorAll("img"));
        const ro = new ResizeObserver(layout);
        imgs.forEach((img) => {
            ro.observe(img);
            if (!img.complete) img.addEventListener("load", layout, { once: true });
        });
        window.addEventListener("resize", layout);

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", layout);
        };
    }, [viewMode, count]);

    // Index of the slide open in the closer-look viewer, or null. Holding
    // the index rather than a URL is what lets the arrow keys walk the
    // carousel from inside the viewer.
    const [closerLook, setCloserLook] = useState(null);

    // For a two-sided piece this follows whichever face is showing.
    const faceOf = (index) => {
        const slide = slides[index];
        const caption = slideCaption(slide);
        if (!isFlipSlide(slide)) {
            return { src: slideSrc(slide), alt: caption || `Slide ${index + 1}`, caption };
        }
        return flipped[index]
            ? { src: slide.back, alt: `Piece ${index + 1}, reverse`, caption }
            : { src: slide.front, alt: `Piece ${index + 1}, front`, caption };
    };

    // Moving inside the viewer moves the carousel too, so closing it leaves
    // the visitor on the photograph they were just looking at.
    const navigateCloserLook = (dir) => {
        setCloserLook((prev) => {
            if (prev === null) return prev;
            const next = (prev + dir + count) % count;
            goTo(next);
            return next;
        });
    };

    // A swipe that lands on a flip card also fires a click on touch
    // devices - without this, swiping between textiles would turn every
    // piece over on the way past.
    const swiped = useRef(false);

    const toggleFlip = (index) => {
        if (swiped.current) return;
        setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    // Left/right arrows walk the carousel from anywhere on the page. While
    // the viewer is open it handles them itself and stops the event, so
    // these two never both fire.
    useEffect(() => {
        if (viewMode !== "carousel" || !loop) return;
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

    // Swipe left/right on the image to move between slides - the arrows
    // are hidden on mobile (see the mobile media query in style.css) in
    // favor of this.
    const SWIPE_THRESHOLD = 40;
    const trackRef = useRef(null);

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;

        const touchStart = { current: null };
        // Which axis this drag turned out to be, decided from the first
        // few pixels of movement and then locked in for the rest of the
        // gesture - see the comment on handleTouchMove below for why this
        // exists at all.
        const swipeAxis = { current: null };

        const handleTouchStart = (e) => {
            const t = e.touches[0];
            touchStart.current = { x: t.clientX, y: t.clientY };
            swipeAxis.current = null;
            swiped.current = false;
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
            // Once a drag reads as mostly horizontal, claim it as a swipe
            // and block the page's native vertical scroll underneath it.
            // Without this, a real touchscreen hands any drag with even a
            // slight vertical wobble over to native scrolling before
            // touchend ever fires (the browser sends touchcancel instead),
            // so the slide never advances - a real swipe always has some
            // wobble, so this bit for real fingers even though it never
            // showed up testing with synthetic touch events, which don't
            // go through the browser's scroll-vs-gesture arbitration at
            // all.
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

            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
                swiped.current = true;
                slideImages(dx < 0 ? "right" : "left");
                // Cleared after the click that follows this touchend has
                // had its chance to fire.
                setTimeout(() => { swiped.current = false; }, 350);
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
    }, [viewMode, count]);

    // ── Album view ───────────────────────────────────────────────────
    if (viewMode === "grid") {
        return (
            <div
                className="album-view"
                ref={albumWrapRef}
                style={{ paddingLeft: `${gutter}px`, paddingRight: `${gutter}px` }}
            >
                <div className="album-view-head">
                    <span className="album-view-count">{photoCount} photos</span>
                </div>
                <div className="album-grid" ref={gridRef}>
                    {slides.map((slide, index) => (
                        <button
                            key={index}
                            type="button"
                            className={`album-thumb${isFeature(slide) ? " album-thumb--feature" : ""}`}
                            onClick={() => (albumOpensViewer ? setCloserLook(index) : openAt(index))}
                            aria-label={albumOpensViewer
                                ? `Take a closer look at photo ${index + 1} of ${count}`
                                : `Open item ${index + 1} of ${count}`}
                        >
                            <img
                                src={slideSrc(slide)}
                                alt={slideCaption(slide) || `Photo ${index + 1}`}
                                title={slideCaption(slide)}
                                loading="lazy"
                                decoding="async"
                            />
                            {isFlipSlide(slide) && (
                                <span className="album-thumb-flag">
                                    <span aria-hidden="true">&#8635;</span> 2 sides
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {closerLook !== null && (
                    <CloserLook
                        src={faceOf(closerLook).src}
                        alt={faceOf(closerLook).alt}
                        caption={faceOf(closerLook).caption}
                        onNavigate={count > 1 ? navigateCloserLook : undefined}
                        onClose={() => setCloserLook(null)}
                    />
                )}
            </div>
        );
    }

    // ── Carousel view ────────────────────────────────────────────────
    return (
        <div className={`image-slider${album ? " image-slider--standalone" : ""}`}>
            {album && (
                <div className="album-back-row">
                    <button
                        type="button"
                        className="album-back-btn"
                        onClick={() => setViewMode("grid")}
                    >&#8592; All {photoCount} photos</button>
                </div>
            )}

            <div className="image-slider-frame">
                <div
                    className="image-slider-lr-toggle left-toggle"
                    onClick={() => slideImages("left")}
                >&#8592;</div>

                <div className="image-slider-track" ref={trackRef}>
                    <ul
                        style={{
                            transform: `translateX(-${pos * 100}%)`,
                            transition: animate ? undefined : "none",
                        }}
                        onTransitionEnd={handleTransitionEnd}
                    >
                        {extended.map((slide, k) => {
                            // Map a position in the padded track back onto
                            // the real slide it stands for, so clones share
                            // their original's flip state and labels.
                            const index = loop ? (((k - 1) % count) + count) % count : k;
                            return (
                                <li key={k}>
                                    {isFlipSlide(slide) ? (
                                        <div className={`flip-card ${flipped[index] ? "is-flipped" : ""}`}>
                                            <div
                                                className="flip-card-inner"
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`Turn piece ${index + 1} over`}
                                                aria-pressed={!!flipped[index]}
                                                onClick={() => toggleFlip(index)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        toggleFlip(index);
                                                    }
                                                }}
                                            >
                                                <img
                                                    className="flip-face flip-face--front"
                                                    src={slide.front}
                                                    alt={`Piece ${index + 1}, front`}
                                                    loading={index === 0 ? "eager" : "lazy"}
                                                    decoding="async"
                                                />
                                                <img
                                                    className="flip-face flip-face--back"
                                                    src={slide.back}
                                                    alt={`Piece ${index + 1}, reverse`}
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            </div>
                                            <CloserLookButton onOpen={() => setCloserLook(index)} />
                                            <button
                                                type="button"
                                                className="flip-hint"
                                                onClick={() => toggleFlip(index)}
                                            >
                                                <span className="flip-hint-icon" aria-hidden="true">&#8635;</span>
                                                {flipped[index] ? "Back" : "Front"}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="slide-media">
                                            <img
                                                src={slideSrc(slide)}
                                                alt={slideCaption(slide) || `Slide ${index + 1}`}
                                                loading={index === 0 ? "eager" : "lazy"}
                                                decoding="async"
                                                // The photograph itself opens the viewer - the
                                                // magnifier cursor over it is the affordance. The
                                                // swipe guard keeps a finger-swipe on a phone from
                                                // being read as a tap on the way past.
                                                onClick={() => { if (!swiped.current) setCloserLook(index); }}
                                            />
                                            <CloserLookButton onOpen={() => setCloserLook(index)} />
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    {count > 1 && (
                        <div className="slide-counter">{currentIndex + 1} / {count}</div>
                    )}
                </div>

                <div
                    className="image-slider-lr-toggle right-toggle"
                    onClick={() => slideImages("right")}
                >&#8594;</div>
            </div>

            {closerLook !== null && (
                <CloserLook
                    src={faceOf(closerLook).src}
                    alt={faceOf(closerLook).alt}
                    caption={faceOf(closerLook).caption}
                    onNavigate={count > 1 ? navigateCloserLook : undefined}
                    onClose={() => setCloserLook(null)}
                />
            )}

            {slideCaption(slides[currentIndex]) && (
                <p className="slide-caption">{slideCaption(slides[currentIndex])}</p>
            )}

            {count > 1 && (
                <div className="slide-dots">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            className={`slide-dot ${index === currentIndex ? "active" : ""}`}
                            aria-label={`Go to slide ${index + 1}`}
                            onClick={() => goTo(index)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectSlider;
