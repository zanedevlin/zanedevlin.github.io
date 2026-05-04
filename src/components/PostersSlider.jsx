import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TO ADD A POSTER:
//   { src: "/your-poster.jpg", from: "Project or Film Name", link: "/path" }
//   Leave link out entirely if the project doesn't have a page yet.
// ─────────────────────────────────────────────────────────────────────────────
const slides = [
  { src: "/poster-1.jpg", from: "Sheepskin" },
  { src: "/poster-2.jpg", from: "Organic Technology", link: "/art-design/organic-technology" },
  { src: "/poster-3.jpg", from: "Untitled Film" },
];

const PostersSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const slideImages = (dir) => {
    if (dir === "left" && currentIndex > 0) {
      return setCurrentIndex(currentIndex - 1);
    } else if (dir === "right" && currentIndex < slides.length - 1) {
      return setCurrentIndex(currentIndex + 1);
    }
  };

  const current = slides[currentIndex];

  return (
    <div className="posters-slider">
      <div className="posters-track-wrapper">
        <ul className="posters-track">
          {slides.map((slide, index) => (
            <li key={index}>
              <img
                src={slide.src}
                alt={`Poster ${index + 1}`}
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