import { useState } from "react";

const ProjectSlider = ({ slides }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const slideImages = (dir) => {
        if (dir === "left" && currentIndex > 0) {
            return setCurrentIndex(currentIndex - 1);
        } else if (dir === "right" && currentIndex < slides.length - 1) {
            return setCurrentIndex(currentIndex + 1);
        }
    };

    return (
        <div className="image-slider">
            <ul>
                {slides.map((slide, index) => (
                    <li key={index}>
                        <img
                            src={slide}
                            alt={`Slide ${index + 1}`}
                            style={{
                                transform: `translateX(calc(-${currentIndex * 100}% - ${currentIndex * 3}rem))`
                            }}
                        />
                    </li>
                ))}
            </ul>
            <div
                className="image-slider-lr-toggle right-toggle"
                onClick={() => slideImages("right")}
            >&#8594;</div>
            <div
                className="image-slider-lr-toggle left-toggle"
                onClick={() => slideImages("left")}
            >&#8592;</div>
        </div>
    );
};

export default ProjectSlider;