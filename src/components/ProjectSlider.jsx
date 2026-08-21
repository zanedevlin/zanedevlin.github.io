import { useState, useRef, useEffect } from "react";

const ProjectSlider = ({ slides }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Functional update so this never closes over a stale currentIndex -
    // needed because the touch listeners below are attached once via a
    // plain DOM addEventListener (not React's synthetic props), so they
    // can't rely on re-render to pick up a fresh currentIndex each time.
    const slideImages = (dir) => {
        setCurrentIndex((prev) => {
            if (dir === "left" && prev > 0) return prev - 1;
            if (dir === "right" && prev < slides.length - 1) return prev + 1;
            return prev;
        });
    };

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
    }, [slides.length]);

    return (
        <div className="image-slider">
            <div className="image-slider-frame">
                <div
                    className="image-slider-lr-toggle left-toggle"
                    onClick={() => slideImages("left")}
                >&#8592;</div>

                <div className="image-slider-track" ref={trackRef}>
                    <ul style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                        {slides.map((slide, index) => (
                            <li key={index}>
                                <img
                                    src={slide}
                                    alt={`Slide ${index + 1}`}
                                    loading={index === 0 ? "eager" : "lazy"}
                                    decoding="async"
                                />
                            </li>
                        ))}
                    </ul>

                    {slides.length > 1 && (
                        <div className="slide-counter">{currentIndex + 1} / {slides.length}</div>
                    )}
                </div>

                <div
                    className="image-slider-lr-toggle right-toggle"
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
                            aria-label={`Go to slide ${index + 1}`}
                            onClick={() => setCurrentIndex(index)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectSlider;
