import { useEffect, useRef, useState } from "react";
import CloserLook, { CloserLookButton } from "./CloserLook.jsx";

/**
 * The numbered exhibition index for The Eclipse.
 *
 * The show itself is numbered - every piece stands on a stained plywood base
 * with a laser-etched plaque reading "<numeral> of VIII" - so the page is
 * built as that index rather than as another carousel.
 *
 * It is laid out in two columns because the room was: the cast pieces stood
 * along the fireplace on the left, the foam stunt doubles along the bar on
 * the right. Reading the page left to right is walking the room.
 *
 * Each entry is one piece, and everything inside an entry stays inside it: a
 * piece photographed from more than one angle carries its own small carousel,
 * the thumbnails beside it select a view in that carousel, and opening Closer
 * Look from the entry walks that piece's photographs and its plaque - not the
 * whole page. Eight separate short sequences, rather than one long one you
 * can get lost in.
 *
 * sides:  [{ title, note, pieces: [...] }]
 * pieces: [{ numeral, name, subtitle, note, photo, alts: [{src, label}],
 *            plaque (the cropped strip), plaqueFull (the whole frame),
 *            video: { id, thumb, href, label } }]
 *
 * On a phone the same two columns hold, so a stunt double still sits directly
 * opposite the helmet it doubles for, but each entry is reduced to its cover:
 * the photograph, the numeral, the name, and the other angles as thumbnails
 * beside them. The note and the plaque are not dropped, they move into the
 * closer-look viewer, whose caption on the main photograph carries the note.
 * Nothing expands and nothing takes over the screen. See the phone block in
 * style.css - the markup is identical at every width.
 *
 * A piece with a `video` carries the film it belongs to. It behaves exactly
 * like a tile on the filmmaking page: a poster frame with a play button that
 * opens the site's own video modal, reusing that page's markup and classes so
 * the two look and act the same. The YouTube iframe only exists while the
 * modal is open, so nothing third party loads on the way in.
 */

const SWIPE_THRESHOLD = 40;

const ExhibitPiece = ({ piece }) => {
    // The piece's own photographs, main one first.
    const views = [{ src: piece.photo, label: piece.subtitle }, ...(piece.alts || [])];
    const count = views.length;
    const loop = count > 1;

    // Same clone-based track as the site's other carousels: a copy of the
    // last view in front and of the first behind, so stepping off either end
    // animates forward onto a clone and is then swapped for the real view
    // with the transition off. Nothing ever rewinds past everything else to
    // get back to the start.
    const extended = loop ? [views[count - 1], ...views, views[0]] : views;
    const [pos, setPos] = useState(loop ? 1 : 0);
    const [animate, setAnimate] = useState(true);
    const current = loop ? (((pos - 1) % count) + count) % count : 0;

    const step = (dir) => {
        if (!loop) return;
        setAnimate(true);
        setPos((prev) => (dir === "left" ? prev - 1 : prev + 1));
    };

    const goTo = (index) => {
        setAnimate(true);
        setPos(loop ? index + 1 : 0);
    };

    const handleTransitionEnd = (e) => {
        if (e.propertyName !== "transform" || !loop) return;
        if (pos === count + 1) { setAnimate(false); setPos(1); }
        else if (pos === 0) { setAnimate(false); setPos(count); }
    };

    // The transition is re-armed only after the browser has painted the
    // un-animated jump; batched into one frame, the snap shows as a rewind.
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

    // What the viewer can reach from this entry: this piece's photographs in
    // carousel order, then its plaque. Closer Look's arrows are bounded by
    // this list, so a closer look at one piece stays on that piece.
    const label = `${piece.numeral}. ${piece.name}`;
    const shots = views.map((view, i) => ({
        src: view.src,
        alt: i === 0 ? `${piece.name}, ${piece.subtitle}` : `${piece.name}, ${view.label.toLowerCase()}`,
        caption: i === 0 && piece.note
            ? `${label}, ${piece.subtitle}. ${piece.note}`
            : `${label}: ${view.label}`,
    }));
    if (piece.plaque) {
        shots.push({
            src: piece.plaqueFull || piece.plaque,
            alt: `Plaque: ${piece.numeral} of VIII, ${piece.name}, ${piece.subtitle}`,
            caption: `${label}: plaque`,
        });
    }

    const [open, setOpen] = useState(null);
    const navigate = (dir) =>
        setOpen((prev) => (prev === null ? prev : (prev + dir + shots.length) % shots.length));

    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        if (!playing) return;
        const onKeyDown = (e) => {
            if (e.key !== "Escape") return;
            e.stopImmediatePropagation();
            setPlaying(false);
        };
        window.addEventListener("keydown", onKeyDown, true);
        return () => window.removeEventListener("keydown", onKeyDown, true);
    }, [playing]);

    // A swipe that ends on the photograph also fires a click on a touch
    // screen; without this guard, swiping between angles would open the
    // viewer on the way past.
    const swiped = useRef(false);
    const trackRef = useRef(null);

    useEffect(() => {
        const el = trackRef.current;
        if (!el || !loop) return;

        let start = null;
        let axis = null;

        const onStart = (e) => {
            const t = e.touches[0];
            start = { x: t.clientX, y: t.clientY };
            axis = null;
            swiped.current = false;
        };
        const onMove = (e) => {
            if (!start) return;
            const t = e.touches[0];
            const dx = t.clientX - start.x;
            const dy = t.clientY - start.y;
            if (axis === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
                axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
            }
            // Once the drag reads as horizontal, claim it and block the page's
            // native vertical scroll - otherwise the browser hands the gesture
            // to scrolling before touchend ever fires.
            if (axis === "x") e.preventDefault();
        };
        const onEnd = (e) => {
            const s = start;
            start = null;
            if (!s) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - s.x;
            const dy = t.clientY - s.y;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
                swiped.current = true;
                step(dx < 0 ? "right" : "left");
                setTimeout(() => { swiped.current = false; }, 350);
            }
        };

        // touchmove has to be a real listener with { passive: false } - React's
        // onTouchMove attaches passively, which ignores preventDefault().
        el.addEventListener("touchstart", onStart, { passive: true });
        el.addEventListener("touchmove", onMove, { passive: false });
        el.addEventListener("touchend", onEnd, { passive: true });
        return () => {
            el.removeEventListener("touchstart", onStart);
            el.removeEventListener("touchmove", onMove);
            el.removeEventListener("touchend", onEnd);
        };
    }, [loop, count]);

    return (
        <article className="exhibit-piece">
            <div className="exhibit-photo">
                <div className="exhibit-track" ref={trackRef}>
                    <ul
                        style={{
                            transform: `translateX(-${pos * 100}%)`,
                            transition: animate ? undefined : "none",
                        }}
                        onTransitionEnd={handleTransitionEnd}
                    >
                        {extended.map((view, k) => (
                            <li key={k}>
                                <img
                                    src={view.src}
                                    alt={view.label === piece.subtitle
                                        ? `${piece.name}, ${piece.subtitle}`
                                        : `${piece.name}, ${view.label.toLowerCase()}`}
                                    loading="lazy"
                                    decoding="async"
                                    onClick={() => {
                                        if (swiped.current) return;
                                        setOpen(loop ? (((k - 1) % count) + count) % count : k);
                                    }}
                                />
                            </li>
                        ))}
                    </ul>
                </div>

                <CloserLookButton onOpen={() => setOpen(current)} />
                <span className="exhibit-tag">{piece.numeral}</span>

                {loop && (
                    <>
                        <button type="button" className="exhibit-nav exhibit-nav--prev"
                                aria-label="Previous angle" onClick={() => step("left")}>&#8592;</button>
                        <button type="button" className="exhibit-nav exhibit-nav--next"
                                aria-label="Next angle" onClick={() => step("right")}>&#8594;</button>
                        <span className="exhibit-count">{current + 1} / {count}</span>
                        <div className="exhibit-dots">
                            {views.map((view, i) => (
                                <button
                                    key={view.src}
                                    type="button"
                                    className={`exhibit-dot${i === current ? " is-active" : ""}`}
                                    aria-label={`View ${i + 1} of ${count}`}
                                    onClick={() => goTo(i)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="exhibit-detail">
                <div className="exhibit-head">
                    <p className="exhibit-numeral">
                        {piece.numeral}<span className="exhibit-of"> of VIII</span>
                    </p>
                    <h4 className="exhibit-name">{piece.name}</h4>
                    <p className="exhibit-subtitle">{piece.subtitle}</p>
                </div>
                {piece.note && <p className="exhibit-note">{piece.note}</p>}

                {/* The thumbnails drive the carousel above rather than opening
                    the viewer: clicking one brings that angle into the frame,
                    which is where the magnifier then acts on it. */}
                {((piece.alts && piece.alts.length > 0) || piece.video) && (
                    <div className="exhibit-alts">
                        {(piece.alts || []).map((alt, i) => (
                            <button
                                type="button"
                                className={`exhibit-alt${current === i + 1 ? " is-active" : ""}`}
                                key={alt.src}
                                onClick={() => goTo(i + 1)}
                                aria-pressed={current === i + 1}
                                title={alt.label}
                            >
                                <img
                                    src={alt.src}
                                    alt={`${piece.name}, ${alt.label.toLowerCase()}`}
                                    loading="lazy"
                                    decoding="async"
                                />
                                <span>{alt.label}</span>
                            </button>
                        ))}

                        {piece.video && (
                            <button
                                type="button"
                                className="exhibit-alt exhibit-alt--video"
                                onClick={() => setPlaying(true)}
                                title={piece.video.label}
                                aria-label={`Play ${piece.video.label}`}
                            >
                                <span className="exhibit-video-shot">
                                    <img src={piece.video.thumb} alt="" loading="lazy" decoding="async" />
                                    <span className="play-button" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21" /></svg>
                                    </span>
                                </span>
                                <span>Music video</span>
                            </button>
                        )}
                    </div>
                )}

                {piece.plaque && (
                    <button
                        type="button"
                        className="exhibit-plaque"
                        onClick={() => setOpen(shots.length - 1)}
                        title="Closer look at the plaque"
                    >
                        <img
                            src={piece.plaque}
                            alt={`Plaque: ${piece.numeral} of VIII, ${piece.name}, ${piece.subtitle}`}
                            loading="lazy"
                            decoding="async"
                        />
                    </button>
                )}
            </div>

            {playing && piece.video && (
                <div
                    className="video-modal"
                    style={{ display: "flex" }}
                    onClick={(e) => { if (e.target.className === "video-modal") setPlaying(false); }}
                >
                    <div className="modal-content">
                        <button className="modal-close" onClick={() => setPlaying(false)} type="button">&times;</button>
                        <div className="modal-video-wrapper">
                            <iframe
                                width="100%"
                                height="600"
                                src={`https://www.youtube.com/embed/${piece.video.id}?autoplay=1`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <h2 style={{ marginTop: "20px", color: "white" }}>{piece.video.label}</h2>
                        {piece.video.href && (
                            <a className="exhibit-video-link" href={piece.video.href}>See it on the filmmaking page</a>
                        )}
                    </div>
                </div>
            )}

            {open !== null && (
                <CloserLook
                    src={shots[open].src}
                    alt={shots[open].alt}
                    caption={shots[open].caption}
                    onNavigate={shots.length > 1 ? navigate : undefined}
                    onClose={() => setOpen(null)}
                />
            )}
        </article>
    );
};

const ExhibitionIndex = ({ sides }) => {
    // Entries fade up as they are reached. An exhibition is walked through
    // rather than taken in at once, and it keeps the two columns from landing
    // as a wall.
    //
    // Deliberately a scroll handler rather than an IntersectionObserver: an
    // observer only reports a *change* in intersection, so an entry that is
    // jumped straight past - an in-page anchor, a restored scroll position, a
    // full-page screenshot, a flick on a phone - can go from "below the fold"
    // to "above the fold" without ever intersecting, and would then sit at
    // opacity 0 for good. A handful of elements re-measured on scroll costs
    // nothing and cannot leave content invisible.
    const rootRef = useRef(null);
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const items = Array.from(root.querySelectorAll(".exhibit-piece"));

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            items.forEach((el) => el.classList.add("is-in"));
            return;
        }

        let pending = items.slice();
        const reveal = () => {
            const line = window.innerHeight * 0.92;
            pending = pending.filter((el) => {
                if (el.getBoundingClientRect().top >= line) return true;
                el.classList.add("is-in");
                return false;
            });
            if (!pending.length) stop();
        };

        const onScroll = () => {
            if (onScroll.queued) return;
            onScroll.queued = true;
            requestAnimationFrame(() => { onScroll.queued = false; reveal(); });
        };
        const stop = () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };

        reveal();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return stop;
    }, [sides]);

    return (
        <div className="exhibit-sides" ref={rootRef}>
            {sides.map((side) => (
                <section className="exhibit-side" key={side.title}>
                    <header className="exhibit-side-head">
                        <h3>{side.title}</h3>
                        {side.note && <p>{side.note}</p>}
                    </header>
                    {side.pieces.map((piece) => (
                        <ExhibitPiece piece={piece} key={piece.numeral} />
                    ))}
                </section>
            ))}
        </div>
    );
};

export default ExhibitionIndex;
