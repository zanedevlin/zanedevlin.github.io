import { useEffect, useRef, useState } from "react";

/**
 * "Closer look" - the full-screen image viewer used from every carousel on
 * the site. Hovering a slide reveals the magnifier button; opening it puts
 * the photograph on a dark backdrop where it can be zoomed and panned.
 *
 * Getting out is deliberately over-served, because the button is small and
 * easy to hit by accident: Escape, the X, a click anywhere off the image,
 * and the browser's own back gesture all leave, and nothing about opening
 * it navigates away from the page underneath.
 */

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const CLICK_ZOOM = 2.2;
// A press that moves further than this was a drag, not a click.
const DRAG_SLOP = 6;

const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

export const CloserLookButton = ({ onOpen, className = "" }) => (
    <button
        type="button"
        className={`closer-look-btn ${className}`.trim()}
        aria-label="Take a closer look"
        title="Closer look"
        // The slides underneath listen for clicks (flip a piece) and for
        // pointer drags (swipe to the next slide), so this button has to
        // keep both to itself.
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpen();
        }}
    >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <line x1="15.5" y1="15.5" x2="20.5" y2="20.5" />
            <line x1="10.5" y1="7.5" x2="10.5" y2="13.5" />
            <line x1="7.5" y1="10.5" x2="13.5" y2="10.5" />
        </svg>
    </button>
);

const CloserLook = ({ src, alt = "", caption, counter, onClose, onNavigate }) => {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [panning, setPanning] = useState(false);

    const overlayRef = useRef(null);
    const imgRef = useRef(null);
    const closeRef = useRef(null);

    // Live copies for the native (non-React) wheel listener and the pointer
    // handlers, which would otherwise close over the first render's state.
    const stateRef = useRef({ scale: 1, offset: { x: 0, y: 0 } });
    stateRef.current = { scale, offset };

    const pointers = useRef(new Map());
    const gesture = useRef(null);

    // Keeps the image from being thrown off screen: at scale s it may be
    // pushed by at most half the growth in each direction.
    const clampOffset = (next, s) => {
        const el = imgRef.current;
        if (!el) return { x: 0, y: 0 };
        const maxX = Math.max(0, (el.offsetWidth * s - el.offsetWidth) / 2);
        const maxY = Math.max(0, (el.offsetHeight * s - el.offsetHeight) / 2);
        return { x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
    };

    // Zooms about a point on screen, so whatever is under the cursor or
    // between the fingers stays put instead of sliding away.
    const zoomAbout = (nextScale, clientX, clientY) => {
        const el = imgRef.current;
        if (!el) return;
        const { scale: s1, offset: o1 } = stateRef.current;
        const s2 = clamp(nextScale, MIN_SCALE, MAX_SCALE);
        if (s2 === s1) return;

        if (s2 === MIN_SCALE) {
            setScale(MIN_SCALE);
            setOffset({ x: 0, y: 0 });
            return;
        }

        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (clientX ?? cx) - cx;
        const dy = (clientY ?? cy) - cy;
        const k = s2 / s1;

        setScale(s2);
        setOffset(clampOffset({ x: o1.x + dx * (1 - k), y: o1.y + dy * (1 - k) }, s2));
    };

    const reset = () => {
        setScale(MIN_SCALE);
        setOffset({ x: 0, y: 0 });
    };

    // ── Keyboard, scroll lock, focus ────────────────────────────────
    useEffect(() => {
        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeRef.current?.focus();

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                // Only the topmost layer should answer one Escape. The
                // posters carousel closes on Escape too, and both listen on
                // window - without stopping the event here, a single press
                // would shut the viewer AND drop the carousel back to its
                // grid. Registered in the capture phase below so this runs
                // first whatever order things mounted in.
                e.stopImmediatePropagation();
                e.preventDefault();
                onClose();
            } else if (e.key === "+" || e.key === "=") {
                e.preventDefault();
                zoomAbout(stateRef.current.scale * 1.4);
            } else if (e.key === "-" || e.key === "_") {
                e.preventDefault();
                zoomAbout(stateRef.current.scale / 1.4);
            } else if (e.key === "0") {
                e.preventDefault();
                reset();
            } else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && onNavigate) {
                // Step between the carousel's photographs without leaving
                // the viewer. Stopped here so the slider's own arrow-key
                // handler underneath doesn't move a second time.
                e.stopImmediatePropagation();
                e.preventDefault();
                onNavigate(e.key === "ArrowLeft" ? -1 : 1);
            }
        };

        window.addEventListener("keydown", onKeyDown, true);
        return () => {
            window.removeEventListener("keydown", onKeyDown, true);
            document.body.style.overflow = previousOverflow;
            if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
        };
    }, []);

    // Every photograph opens at fit: carrying the last one's zoom and pan
    // across an arrow-key step would land the viewer somewhere arbitrary.
    useEffect(() => {
        setScale(MIN_SCALE);
        setOffset({ x: 0, y: 0 });
    }, [src]);

    // Wheel has to be a real listener with { passive: false } - React
    // attaches its own as passive, which ignores preventDefault and lets
    // the trackpad scroll the page behind the viewer.
    useEffect(() => {
        const el = overlayRef.current;
        if (!el) return;
        const onWheel = (e) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
            zoomAbout(stateRef.current.scale * factor, e.clientX, e.clientY);
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, []);

    // ── Drag to pan, two fingers to pinch ───────────────────────────
    const onPointerDown = (e) => {
        if (e.button != null && e.button !== 0) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        e.currentTarget.setPointerCapture?.(e.pointerId);

        if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            gesture.current = {
                kind: "pinch",
                distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
                scale: stateRef.current.scale,
            };
        } else {
            gesture.current = {
                kind: "drag",
                startX: e.clientX,
                startY: e.clientY,
                offset: { ...stateRef.current.offset },
                moved: false,
            };
        }
    };

    const onPointerMove = (e) => {
        if (!pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const g = gesture.current;
        if (!g) return;

        if (g.kind === "pinch" && pointers.current.size >= 2) {
            const [a, b] = [...pointers.current.values()];
            const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
            zoomAbout(g.scale * (distance / g.distance), (a.x + b.x) / 2, (a.y + b.y) / 2);
            return;
        }

        if (g.kind === "drag") {
            const dx = e.clientX - g.startX;
            const dy = e.clientY - g.startY;
            if (!g.moved && Math.hypot(dx, dy) > DRAG_SLOP) {
                g.moved = true;
                if (stateRef.current.scale > MIN_SCALE) setPanning(true);
            }
            if (g.moved && stateRef.current.scale > MIN_SCALE) {
                setOffset(clampOffset({ x: g.offset.x + dx, y: g.offset.y + dy }, stateRef.current.scale));
            }
        }
    };

    const endPointer = (e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size === 0) {
            setPanning(false);
            // A press that never moved is a click: zoom in where it landed,
            // or step back out if it is already zoomed.
            if (gesture.current?.kind === "drag" && !gesture.current.moved) {
                if (stateRef.current.scale > MIN_SCALE) reset();
                else zoomAbout(CLICK_ZOOM, e.clientX, e.clientY);
            } else if (
                // Not zoomed in, so a sideways drag has nothing to pan: read
                // it as a swipe to the next or previous photo instead.
                gesture.current?.kind === "drag" && onNavigate &&
                stateRef.current.scale <= MIN_SCALE
            ) {
                const dx = e.clientX - gesture.current.startX;
                const dy = e.clientY - gesture.current.startY;
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) onNavigate(dx < 0 ? 1 : -1);
            }
            gesture.current = null;
        }
    };

    const zoomed = scale > MIN_SCALE;

    return (
        <div
            className="closer-look"
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-label="Closer look"
            // Anywhere off the photograph closes - the most forgiving exit
            // for a button someone hit by accident.
            onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <button
                type="button"
                className="closer-look-close"
                ref={closeRef}
                onClick={onClose}
                aria-label="Close closer look"
            >&#10005;</button>

            <img
                ref={imgRef}
                className={`closer-look-img ${zoomed ? "is-zoomed" : ""} ${panning ? "is-panning" : ""}`}
                src={src}
                alt={alt}
                draggable="false"
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    transition: panning ? "none" : undefined,
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endPointer}
                onPointerCancel={endPointer}
            />

            {counter && <p className="closer-look-counter">{counter}</p>}

            {onNavigate && (
                <>
                    <button type="button" className="closer-look-nav closer-look-nav--prev"
                            aria-label="Previous photo"
                            onClick={() => onNavigate(-1)}>&#8592;</button>
                    <button type="button" className="closer-look-nav closer-look-nav--next"
                            aria-label="Next photo"
                            onClick={() => onNavigate(1)}>&#8594;</button>
                </>
            )}

            <div className="closer-look-bar">
                <button type="button" aria-label="Zoom out"
                        onClick={() => zoomAbout(stateRef.current.scale / 1.4)}>&#8722;</button>
                <button type="button" className="closer-look-reset" onClick={reset}>
                    {Math.round(scale * 100)}%
                </button>
                <button type="button" aria-label="Zoom in"
                        onClick={() => zoomAbout(stateRef.current.scale * 1.4)}>&#43;</button>
            </div>

            {caption && <p className="closer-look-caption">{caption}</p>}

            <p className="closer-look-hint">
                Scroll or pinch to zoom · ← → for the next photo · Esc to close
            </p>
        </div>
    );
};

export default CloserLook;
