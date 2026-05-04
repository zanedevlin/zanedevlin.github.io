import { useState, useEffect } from 'react';

const videos = [
  {
    title: "Chumbawamba - Tubthumping",
    description: "Music video for Chumbawamba's 'Tubthumping'. A high-energy visual interpretation of this iconic track.",
    thumbnail: "/video-thumb-tubthumping.jpg",
    youtubeId: "PaPgR2zqfUc",
    category: "Personal"
  },
  {
    title: "Sheepskin",
    description: "A dark comedy short film exploring the psychological toll of assimilation in corporate spaces. Directed by Kofi Mensah, this surreal narrative follows a Black professional's desperate attempt to fit into a predominantly white institution, using body horror and dark humor to critique the cost of conforming to systems not built for you.",
    thumbnail: "/sheepskin-thumb.jpg",
    youtubeId: "LRjfJfM7vA8",
    category: "Collaborations",
    involvement: ["Director of Photography", "Actor"]
  }
];

const FilmmakingPage = () => {
  const [isCollaborations, setIsCollaborations] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  const HandleToggleChange = () => {
    setIsCollaborations(isCollaborations => !isCollaborations);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (isCollaborations) {
      root.setAttribute("data-tab", "collaborations");
    } else {
      root.setAttribute("data-tab", "personal");
    }
  });

  const filtered = videos.filter(v =>
    isCollaborations ? v.category === "Collaborations" : v.category === "Personal"
  );

  return (
    <div className="filmmaking-page">

      {/* Toggle */}
      <div className="tab-nav-wrapper">
        <div className="seg-control" onClick={HandleToggleChange}>
          <div className={`seg-indicator ${isCollaborations ? 'seg-indicator--right' : ''}`}></div>
          <span className={`seg-label ${!isCollaborations ? 'seg-label--active' : ''}`}>Personal</span>
          <span className={`seg-label ${isCollaborations ? 'seg-label--active' : ''}`}>Collaborations</span>
        </div>
      </div>

      {/* Videos */}
      <div className="videos-grid">
        {filtered.map(video => (
          <div
            key={video.youtubeId}
            className="video-tile"
            onClick={() => setActiveVideo(video)}
          >
            <div className="video-thumbnail">
              <img src={video.thumbnail} alt={video.title} />
              <div className="play-button">
                <svg viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21" />
                </svg>
              </div>
            </div>
            {video.involvement && (
              <div className="involvement-badges">
                {video.involvement.map(role => (
                  <span key={role} className="involvement-badge">{role}</span>
                ))}
              </div>
            )}
            <div className="video-info">
              <h3>{video.title}</h3>
              <p>{video.description}</p>
              <button className="watch-btn" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{display: 'inline', marginRight: '8px'}}>
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                WATCH
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {activeVideo && (
        <div
          className="video-modal"
          style={{display: 'flex'}}
          onClick={(e) => { if (e.target.className === 'video-modal') setActiveVideo(null); }}
        >
          <div className="modal-content">
            <button className="modal-close" onClick={() => setActiveVideo(null)} type="button">&times;</button>
            <div className="modal-video-wrapper">
              <iframe
                width="100%"
                height="600"
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <h2 style={{marginTop: '20px', color: 'white'}}>{activeVideo.title}</h2>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilmmakingPage;