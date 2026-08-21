import { useState, useRef } from "react";

const ProjectSlider = ({ slides }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const slideImages = (dir) => {
        if (dir === "left" && currentIndex > 0) {
            return setCurrentIndex(currentIndex - 1);
        } else if (dir === "right" && currentIndex < slides.length - 1) {
            return setCurrentIndex(currentIndex + 1);
        }
    };

    // Swipe left/right on the image to move between slides - the arrows
    // are hidden on mobile (see the mobile media query in style.css) in
    // favor of this, mirroring PostersSlider's touch handling.
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

        // Only treat it as a slide-swipe if the motion is mostly horizontal
        // - otherwise a vertical scroll on the page would also flip slides.
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
            slideImages(dx < 0 ? "right" : "left");
        }
    };

    return (
        <div className="image-slider">
            <div className="image-slider-frame">
                <div
                    className="image-slider-lr-toggle left-toggle"
                    onClick={() => slideImages("left")}
                >&#8592;</div>

                <div
                    className="image-slider-track"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
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