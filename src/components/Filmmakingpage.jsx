import { useState, useEffect, useRef } from 'react';

// platform defaults to "youtube" if not specified.
// - youtube: videoId is the id from youtube.com/watch?v=<id>
// - vimeo: set platform: "vimeo", videoId is the number from the vimeo URL
// - instagram: set platform: "instagram", videoId is the post/reel shortcode
//   from instagram.com/p/<shortcode>/ or instagram.com/reel/<shortcode>/
// - anything else (e.g. linkedin, or a platform with no clean embeddable URL):
//   set embedUrl to the full iframe-embeddable URL directly and platform to
//   whatever label you want the icon/copy to reflect.
const videos = [
  {
    title: "Chumbawamba - Tubthumping",
    description: "Music video for Chumbawamba's 'Tubthumping'. A high-energy visual interpretation of this iconic track.",
    thumbnail: "/video-thumb-tubthumping.jpg",
    videoId: "PaPgR2zqfUc",
    duration: "5:00",
    category: "Personal"
  },
  {
    title: "Make Keeley JUMP.",
    description: "Skipping movie night, a film student retreats to a deserted campus lab to finish his final project: a jump-scare movie.",
    thumbnail: "/video-thumb-makekeeley.jpg",
    platform: "instagram",
    videoId: "DLAqiK7JoZT",
    duration: "3:00",
    category: "Personal"
  },
  {
    title: "Chicken Sandwich",
    description: "A chicken sandwich is bestowed the gift of human level consciousness in this comedic and experimental short film.",
    thumbnail: "/video-thumb-chicken.jpg",
    platform: "vimeo",
    videoId: "923885115",
    duration: "2:59",
    category: "Personal"
  },
  {
    title: "VIGILANTE",
    description: "Shot in one continuous take, this tense scene follows a vigilante relentlessly hunting down his target.",
    thumbnail: "/video-thumb-vigilante.jpg",
    platform: "instagram",
    videoId: "C2iGJuPuBpx",
    duration: "2:28",
    category: "Personal"
  },
  {
    title: "Teenage Wasteland",
    description: "A prequel to 'The Pen': as zombie fiction turns real, Alex battles guilt and despair until Morgan offers him hope.",
    thumbnail: "/video-thumb-teenagewasteland.jpg",
    platform: "instagram",
    videoId: "Cu96xNSAO2g",
    // NOTE: source clip was named "Teenage Wasteland (test).mp4" and ran
    // 11:28 - almost certainly raw/rough-cut footage, not the final posted
    // reel length. Flagging this one - swap in the real runtime if it's off.
    duration: "11:28",
    category: "Personal"
  },
  {
    title: "The Pen Scene",
    description: "Trapped in a zombie apocalypse, Morgan and Alex clash over a pen while trying to reach help on the radio.",
    thumbnail: "/video-thumb-thepen.jpg",
    platform: "instagram",
    videoId: "Cuh5Tb2u58y",
    duration: "3:16",
    category: "Personal"
  },
  {
    title: "Get Out Scene Recreation",
    description: "A shot-for-shot recreation of the unforgettable 'Sunken Place' scene from Jordan Peele's Oscar-winning 'Get Out.'",
    thumbnail: "/video-thumb-getout.jpg",
    platform: "instagram",
    videoId: "CuNE4yXtv26",
    duration: "3:48",
    category: "Personal"
  },
  {
    title: "Surreal",
    description: "Music video for Chumbawamba's 'Tubthumping'. A high-energy visual interpretation of this iconic track.",
    thumbnail: "/video-thumb-surreal.jpg",
    platform: "instagram",
    videoId: "CtuG9wdPw-H",
    duration: "4:47",
    category: "Personal"
  },
  {
    title: "Da Bomb",
    description: "General and Sergeant go to absurd lengths to disable Ryan's forgotten lunch box in this hilariously grim short film.",
    thumbnail: "/video-thumb-dabomb.jpg",
    platform: "instagram",
    videoId: "Cs4BeehsDRF",
    duration: "3:02",
    category: "Personal"
  },
  {
    title: "GAME OVER",
    description: "A late-night Ms. Pac-Man session turns dangerous when he steps outside and spots a motionless stranger in the dark.",
    thumbnail: "/video-thumb-gameover.jpg",
    platform: "instagram",
    videoId: "CsmBvKTLxs5",
    duration: "2:16",
    category: "Personal"
  },
  {
    title: "Vukovich Night Guard",
    description: "A mockumentary following Jason Buttlicker, the knife-obsessed guard defending Allegheny's Vukovich Center.",
    thumbnail: "/video-thumb-night.jpg",
    platform: "instagram",
    videoId: "CosRMBIrp4n",
    duration: "4:17",
    category: "Personal"
  },
  {
    title: "The Space",
    description: "Zane's first feature film, written, directed, acted, and produced during his gap year between high school and Allegheny College. The unofficial (official) sequel to 'The Backflip,' this mockumentary follows an exaggerated caricature of Zane determined to go to space — a witty commentary on passion, drive, and the willpower to do what you love.",
    thumbnail: "/video-thumb-space.jpg",
    category: "Personal",
    // Like The Backflip and GoWalkabout Gowanus above, this breaks out into
    // a small overlay - here it's the film's three trailers/teasers plus
    // the film itself, in release order. The trailer/teaser thumbnails carry
    // their own baked-in top/bottom letterbox bars that should stay visible
    // (unlike Woodsman/Bad Luck to Kill a Seabird earlier, which had theirs
    // cropped out) - thumbnailAspect matches each box to its image's native
    // ratio so nothing gets cropped off.
    collection: [
      {
        title: "The Space Trailer",
        thumbnail: "/space-trailer-thumb.jpg",
        thumbnailAspect: "52.396%",
        url: "https://www.instagram.com/p/CfHyllElaWC/",
        description: "A shot-for-shot remake of The Social Network's famous trailer, with the dialogue swapped in to fit The Space's own story - confusing to most, but technically impressive."
      },
      {
        title: "The Space Teaser",
        thumbnail: "/space-teaser-thumb.jpg",
        thumbnailAspect: "51.667%",
        url: "https://www.instagram.com/p/CgAceDdlBDy/",
        description: "Set to \"Amazing Grace\" and inspired by a teaser for Logan, this gave away almost nothing about the film - but looked great doing it."
      },
      {
        title: "Official Trailer",
        thumbnail: "/space-official-trailer-thumb.jpg",
        thumbnailAspect: "56.458%",
        url: "https://www.instagram.com/p/ClbuuohrZeD/",
        description: "The real trailer, and the one that finally made clear what the movie was about - the most interesting of the three."
      },
      {
        title: "The Space",
        thumbnail: "/video-thumb-space.jpg",
        platform: "onedrive",
        duration: "1:11:00",
        // Same raw 1drv.ms share link as before this became a collection
        // tile. OneDrive share links usually refuse to load inside an
        // iframe (X-Frame-Options), which is fine here since collection
        // sub-tiles always open in a new tab rather than an in-page modal.
        url: "https://1drv.ms/v/c/3ffcee0c6e194bad/IQCtSxluDO78IIA_0AgAAAAAASMI3ablQQW25KT87BRka1U?e=sirRnd",
        description: "The full film."
      },
    ]
  },
  {
    title: "The Backflip",
    description: "A mockumentary Zane made in high school, right before COVID, about reclaiming his internet \"clout\" by pulling off the perfect backflip - training montages, man-on-the-street interviews, and a wise dog sensei included. This was the project that convinced him filmmaking was the path forward.",
    thumbnail: "/backflip-cover.jpg",
    platform: "instagram",
    category: "Personal",
    // Instagram posts (not reels) don't reliably embed in an iframe (see
    // EXTERNAL_ONLY_PLATFORMS below), so like GoWalkabout Gowanus, this tile
    // opens a small breakout overlay letting visitors pick the trailer or the
    // movie. Each sub-item sets a full url directly (these are instagram.com/p/
    // posts, not /reel/ links) - see the Collection Modal's onClick below,
    // which prefers sub.url and only falls back to building a /reel/ URL
    // from videoId for entries (like GoWalkabout's) that don't set one.
    collection: [
      { title: "The Backflip Trailer", thumbnail: "/backflip-trailer-thumb.jpg", url: "https://www.instagram.com/p/B_LVypzliEJ/", description: "A teaser released ahead of the film." },
      { title: "The Backflip", thumbnail: "/backflip-movie-thumb.jpg", url: "https://www.instagram.com/p/B_de5UZlBoJ/", description: "The full mockumentary." },
    ]
  },
  {
    title: "The Beat Goes On: 150 years of The Campus",
    description: "A documentary chronicling 150 years of The Campus, Allegheny College's student-run newspaper - from Ida Tarbell's early editorship to today's student journalists chasing stories and covering their community.",
    thumbnail: "/video-thumb-beatgoeson.jpg",
    videoId: "dnKUSWpmSjg",
    duration: "33:47",
    category: "Collaborations",
    // NOTE: "Producer" is a suggested second credit - swap it for whatever
    // actually fits your role on this one.
    involvement: ["Master Editor", "Producer"]
  },
  {
    title: "GoWalkabout Gowanus",
    description: "A five-part video series produced during an internship with Arts Gowanus for GoWalkabout Gowanus, a multimedia walking tour of the neighborhood backed by a Public Realm Grant from the NYC Department of Small Business Services. I took the lead shooting and editing the entire series myself: an intro to the concept plus features on four local stops.",
    thumbnail: "/gowalkabout-cover.jpg",
    platform: "instagram",
    category: "Collaborations",
    involvement: ["Internship"],
    // Instagram reels don't reliably embed in an iframe (see
    // EXTERNAL_ONLY_PLATFORMS below), so rather than pick one video to
    // feature, this tile opens a small breakout overlay letting visitors
    // choose which of the five to open on Instagram. See handleTileClick
    // and the Collection Modal render block below.
    collection: [
      { title: "Introduction", thumbnail: "/gowalkabout-intro.jpg", videoId: "DMtmVivM9pQ", duration: "1:00", description: "An introduction to the GoWalkabout Gowanus concept." },
      { title: "Sixteen Mill Bakeshop", thumbnail: "/gowalkabout-sixteenmill.jpg", videoId: "DMbM1C_xyVo", duration: "1:00", description: "A stop at Sixteen Mill Bakeshop." },
      { title: "Gowanus Wine Studio & Tasting Table", thumbnail: "/gowalkabout-wine.jpg", videoId: "DNMP2IPNvJb", duration: "1:16", description: "A stop at Gowanus Wine Studio & Tasting Table." },
      { title: "Thomas Greene Park", thumbnail: "/gowalkabout-thomasgreene.jpg", videoId: "DNgCUQzNrd7", duration: "1:40", description: "A stop at Thomas Greene Park." },
      { title: "Threes Brewing", thumbnail: "/gowalkabout-threes.jpg", videoId: "DOHFNL0kaNa", duration: "2:13", description: "The standout of the series - 4,186 views, and dual-posted on Threes Brewing's own Instagram account." },
    ]
  },
  {
    title: "Sheepskin",
    description: "A dark comedy short film exploring the psychological toll of assimilation in corporate spaces. Directed by Kofi Mensah, this surreal narrative follows a Black professional's desperate attempt to fit into a predominantly white institution, using body horror and dark humor to critique the cost of conforming to systems not built for you.",
    thumbnail: "/sheepskin-thumb.jpg",
    videoId: "LRjfJfM7vA8",
    duration: "24:14",
    category: "Collaborations",
    involvement: ["Director of Photography", "Actor"]
  },
  {
    title: "FINE LINE",
    creator: "Jack Thibault",
    description: "Two men converge paths.",
    thumbnail: "/fine-line-thumb.jpg",
    videoId: "URx1wtFMPbo",
    duration: "4:41",
    category: "Collaborations",
    involvement: ["Actor"]
  },
  {
    title: "Woodsman",
    creator: "Jack Thibault",
    description: "Two men are stranded in the woods.",
    thumbnail: "/woodsman-thumb.jpg",
    // This one (and Bad Luck to Kill a Seabird below) was shot/exported in a
    // boxier aspect ratio than the standard 16:9 tile - the default
    // object-fit: cover would zoom in tight and crop off a lot of the
    // frame, so thumbnailAspect overrides the box to match the image's own
    // ratio instead (see the video-thumbnail style below).
    thumbnailAspect: "90.729%",
    videoId: "pjNWiZCj_Zs",
    duration: "9:15",
    category: "Collaborations",
    involvement: ["Actor"]
  },
  {
    title: "Bad Luck to Kill a Seabird",
    creator: "Jack Thibault",
    description: "A scene recreation from The Lighthouse (2019).",
    thumbnail: "/bad-luck-seabird-thumb.jpg",
    // Native aspect ratio of this crop, same reasoning as Woodsman above -
    // The Lighthouse (2019) itself was shot in a boxy ~1.19:1 frame, so this
    // recreation naturally carries that same unusually tall aspect ratio.
    thumbnailAspect: "82.708%",
    videoId: "MrnNTQHhADg",
    duration: "4:12",
    category: "Collaborations",
    involvement: ["Actor"]
  },
  {
    title: "Amore Mio",
    description: "An earlier collaboration, made before Sheepskin - not uploaded yet. Placeholder tile as a reminder to get this one online.",
    duration: "15:00",
    category: "Collaborations",
    involvement: ["Producer", "Master Editor", "Actor"],
    // NOTE: reminder tile - no thumbnail/videoId yet since this isn't
    // uploaded/linked anywhere. Once it's online, fill those in and delete
    // this comment + the comingSoon flag below.
    comingSoon: true
  },
  {
    title: "Immunity is Community",
    description: "A county-wide film produced for Crawford County Nonprofits in Meadville, PA, promoting a sense of community and access to resources in the wake of the pandemic. Co-created with Charlie Schmitt, the project included interviewing six local business owners to capture a range of perspectives on health and community belonging - and I opened the community fair premiere with a short speech introducing the film to the room.",
    thumbnail: "/immunity-community-thumb.jpg",
    videoId: "Qur9mPHrqHE",
    duration: "6:26",
    category: "Collaborations",
    involvement: ["Producer"]
  },
];

// Shared "app icon" chip: a small white rounded-square badge with the
// platform's glyph inside, in that platform's brand color. Started as the
// fix for the Vimeo icon (white on blue was reading as Venmo), now used for
// all platforms so the watch button always shows a consistent, distinct
// little logo badge no matter what site a video lives on.
const PlatformChip = ({ children }) => (
  <span style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '5px', backgroundColor: '#fff', marginRight: '8px', flexShrink: 0}}>
    {children}
  </span>
);

const YouTubeIcon = () => (
  <PlatformChip>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0000">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  </PlatformChip>
);

// Traced directly from Vimeo's actual app-icon glyph (the cursive "V"
// wordmark, not the older brand swoosh) so this matches what Vimeo itself
// ships, at high fidelity.
const VimeoIcon = () => (
  <PlatformChip>
    <svg width="13" height="11.3" viewBox="0 0 796.830878 691.448753" style={{display: 'block'}}>
      <g transform="translate(-114.000000,854.602131) scale(0.100000,-0.100000)" fill="#1ab7ea">
        <path d="M7675 8544 c-88 -5 -232 -32 -350 -66 -133 -37 -249 -88 -451 -198 -133 -72 -428 -314 -553 -452 -236 -262 -404 -553 -512 -881 -30 -93 -72 -257 -67 -262 2 -2 32 5 68 16 98 30 161 45 290 70 36 7 130 13 210 13 209 0 296 -27 388 -123 61 -63 118 -174 138 -271 17 -78 19 -326 3 -402 -51 -257 -109 -404 -270 -678 -111 -191 -387 -608 -508 -770 -215 -287 -401 -460 -496 -460 -62 0 -172 77 -238 168 -81 111 -173 322 -206 472 -12 55 -22 99 -42 188 -13 60 -28 125 -40 180 -5 23 -13 62 -19 87 -5 25 -14 64 -19 88 -5 23 -14 63 -20 90 -6 26 -15 67 -21 92 -5 25 -14 65 -20 90 -5 25 -14 64 -19 88 -6 23 -12 53 -14 67 -3 14 -24 117 -47 230 -23 113 -46 223 -50 245 -5 22 -13 67 -20 100 -7 33 -15 78 -20 100 -4 22 -15 76 -24 120 -16 78 -26 134 -46 255 -5 33 -15 88 -21 123 -6 34 -15 85 -19 112 -5 28 -14 79 -20 115 -21 115 -29 164 -40 225 -42 245 -80 380 -147 520 -66 138 -113 205 -217 313 -115 119 -301 221 -476 262 -68 16 -273 17 -320 2 -19 -7 -56 -18 -81 -26 -25 -8 -86 -34 -135 -57 -80 -38 -120 -60 -289 -163 -123 -75 -402 -282 -660 -490 -269 -216 -1135 -978 -1135 -998 0 -5 71 -100 158 -211 87 -111 169 -217 182 -234 13 -18 29 -33 34 -33 6 0 67 40 135 89 108 77 352 231 366 231 3 0 24 9 48 19 68 31 123 40 165 29 216 -60 397 -321 513 -743 6 -22 15 -51 19 -65 5 -14 18 -59 30 -100 12 -41 26 -86 31 -100 7 -20 107 -374 160 -565 6 -22 15 -51 19 -65 4 -14 13 -45 20 -70 7 -25 17 -58 21 -75 8 -25 62 -221 120 -430 6 -22 15 -51 19 -65 8 -25 14 -47 50 -180 36 -133 42 -155 50 -180 4 -14 13 -45 20 -70 7 -25 17 -58 21 -75 5 -16 23 -79 39 -140 46 -169 52 -188 60 -215 4 -14 13 -43 19 -65 49 -176 87 -301 131 -425 28 -80 59 -170 69 -200 68 -201 196 -469 303 -629 85 -127 254 -300 343 -351 267 -153 545 -169 904 -51 401 132 960 521 1396 972 305 316 823 934 1131 1349 271 364 311 419 420 580 458 676 763 1265 883 1705 52 191 52 194 82 430 7 58 9 173 6 315 -9 323 -16 388 -77 670 -4 19 -15 55 -25 80 -9 25 -26 70 -38 100 -126 329 -412 538 -842 615 -81 15 -341 26 -450 19z"/>
      </g>
    </svg>
  </PlatformChip>
);

const InstagramIcon = () => (
  <PlatformChip>
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E4405F">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.645-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
    </svg>
  </PlatformChip>
);

// NOTE: this is a generic cloud glyph in Microsoft's official blue (#0078D4),
// not Microsoft's actual OneDrive brand mark - unlike the Vimeo icon, no
// licensed source for the real OneDrive logo was available to trace from.
// Send a reference image (like you did for Vimeo) if you want this swapped
// for a pixel-accurate version.
const OneDriveIcon = () => (
  <PlatformChip>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#0078D4">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  </PlatformChip>
);

// Picks the right badge for whatever platform a video is hosted on.
// Defaults to the YouTube icon so untagged videos (platform omitted) still get one.
const PlatformIcon = ({ platform }) => {
  if (platform === "vimeo") return <VimeoIcon />;
  if (platform === "instagram") return <InstagramIcon />;
  if (platform === "onedrive") return <OneDriveIcon />;
  return <YouTubeIcon />;
};

// Caps a description to `lines` lines (via -webkit-line-clamp, which also
// draws the native "..." at the cut point) and, only if the text actually
// overflows that many lines, adds a tappable "more" link beneath it to
// reveal the rest - and a "less" link to re-collapse. This is what keeps
// tiles with a short description from towering next to ones with a long
// description: every tile's text block tops out at the same height, and
// growing past that is an explicit, per-tile action instead of something
// that happens to the whole row.
const ClampedText = ({ text, className, lines }) => {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // Re-measure whenever the element's own box size changes, not just on
    // mount - the clamp CSS only applies below the mobile breakpoint (see
    // .is-clamped in style.css), so this also naturally clears
    // `overflowing` back to false if the window gets resized/rotated past
    // that breakpoint, instead of leaving a stale "more" link showing.
    const measure = () => {
      if (expanded) return;
      setOverflowing(el.scrollHeight - el.clientHeight > 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, expanded, lines]);

  return (
    <div className="clamped-text">
      <p
        ref={textRef}
        className={`${className || ''} ${!expanded ? 'is-clamped' : ''}`.trim()}
        style={{ '--clamp-lines': lines }}
      >
        {text}
      </p>
      {overflowing && (
        <button
          type="button"
          className="clamp-toggle-btn"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
        >
          {expanded ? 'less' : 'more'}
        </button>
      )}
    </div>
  );
};

// Instagram's base64-ish shortcode (the part of /p/<code>/ and /reel/<code>/
// URLs) is just its numeric media id encoded with this alphabet - decoding
// it back is what lets a tap open the native app directly via its
// undocumented instagram://media?id=<id> deep link, instead of window.open
// always landing in Safari on instagram.com first. That matters because
// Instagram's own "Open in app" banner there doesn't reliably detect the
// app - on a device where it's installed but out of date, tapping the
// banner can send the visitor to the App Store instead of just opening the
// post, on top of the pointless Safari detour every time either way.
const INSTAGRAM_SHORTCODE_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const shortcodeToMediaId = (shortcode) => {
  try {
    let id = 0n;
    for (const char of shortcode) {
      const value = INSTAGRAM_SHORTCODE_ALPHABET.indexOf(char);
      if (value === -1) return null;
      id = id * 64n + BigInt(value);
    }
    return id.toString();
  } catch {
    return null;
  }
};

// Opens an Instagram post/reel URL, trying the native app first and only
// falling back to the normal web URL (in a new tab, same as before) if the
// app doesn't actually take over the tab within a beat. Detecting "did the
// app open" is done via the page's visibility - if instagram:// successfully
// handed off to the app, this tab gets backgrounded almost immediately; if
// nothing happened (app not installed, scheme blocked, etc.) the tab stays
// visible and the fallback timer fires instead.
const openInstagramLink = (webUrl) => {
  const match = webUrl.match(/instagram\.com\/(?:p|reel)\/([^/?]+)/);
  const mediaId = match ? shortcodeToMediaId(match[1]) : null;

  if (!mediaId) {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  let settled = false;
  const openFallback = () => {
    if (settled || document.hidden) return;
    settled = true;
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  };

  const timer = setTimeout(openFallback, 1500);
  const onVisibilityChange = () => {
    if (document.hidden) {
      settled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  window.location.href = `instagram://media?id=${mediaId}`;
};

// Reads ?category=Personal / ?category=Collaborations off the URL so the
// hamburger dropdown's two Filmmaking sub-links actually land on the right
// tab instead of both just opening the page on whatever the default is.
const getInitialCategory = () => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("category") === "Collaborations";
};

const FilmmakingPage = () => {
  const [isCollaborations, setIsCollaborations] = useState(getInitialCategory);
  const [activeVideo, setActiveVideo] = useState(null);
  // Holds the video object for a multi-video "collection" tile (currently
  // just GoWalkabout Gowanus) while its breakout overlay is open.
  const [activeCollection, setActiveCollection] = useState(null);

  // Little "Clippy"-style reminder pointing visitors at the Art/Design
  // posters while they're browsing the video tiles. Fades in once the grid
  // scrolls into view and fades out if they scroll away from it again -
  // but once dismissed via the close button it stays gone for the rest of
  // this page load (a fresh visit/reload brings it back).
  const gridRef = useRef(null);
  const [reminderInView, setReminderInView] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  useEffect(() => {
    if (reminderDismissed) return;
    const grid = gridRef.current;
    if (!grid || typeof IntersectionObserver === "undefined") return;
    let showTimer = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Small delay so the widget doesn't pop in the instant the grid
          // touches the viewport - gives it a beat to feel like a nudge
          // rather than an ambush.
          showTimer = setTimeout(() => setReminderInView(true), 1200);
        } else {
          if (showTimer) clearTimeout(showTimer);
          setReminderInView(false);
        }
      },
      // Was 0.15 (15% of the *grid's own height* visible) - fine on desktop
      // where the grid is a few rows of multi-column tiles, but on mobile
      // it's one tall single-image-per-row column, often much taller than
      // the viewport itself, so 15% of it could never fit on screen at
      // once and the reminder could never trigger. threshold: 0 fires as
      // soon as any part of the grid is on screen instead - still gated by
      // the 1200ms delay above so it doesn't feel instant.
      { threshold: 0 }
    );
    observer.observe(grid);
    return () => {
      if (showTimer) clearTimeout(showTimer);
      observer.disconnect();
    };
  }, [reminderDismissed]);

  // Auto-opens a specific collection tile's breakout when linked to via
  // ?open=<exact tile title> - e.g. the Posters page links "The Space"
  // poster straight to that film's breakout instead of just dropping the
  // visitor on the general Personal video grid. Runs once on mount; only
  // matches tiles that actually have a collection to open.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const title = params.get("open");
    if (!title) return;
    const match = videos.find(v => v.title === title && v.collection);
    if (match) setActiveCollection(match);
  }, []);

  const HandleToggleChange = () => {
    setIsCollaborations(isCollaborations => {
      const next = !isCollaborations;
      // Keep the URL in sync so a manual toggle also reflects in the
      // address bar (and survives a refresh/share/back-button).
      const url = new URL(window.location.href);
      url.searchParams.set("category", next ? "Collaborations" : "Personal");
      window.history.replaceState({}, "", url);
      return next;
    });
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

  // Only used for platforms that actually open in the in-page modal
  // (YouTube, Vimeo, and anything else using the embedUrl escape hatch that
  // IS reliably iframe-able). Instagram and OneDrive are routed to a new
  // tab instead by handleTileClick below, since their embeds don't behave.
  const getEmbedUrl = (video) => {
    if (video.embedUrl) {
      return video.embedUrl;
    }
    if (video.platform === "vimeo") {
      return `https://player.vimeo.com/video/${video.videoId}?autoplay=1`;
    }
    return `https://www.youtube.com/embed/${video.videoId}?autoplay=1`;
  };

  // Instagram's iframe embed is unreliable - a lot of reels just show a
  // "Play on Instagram" fallback instead of actually playing inline. OneDrive
  // share links refuse to load in an iframe at all (they send
  // X-Frame-Options specifically to block this - no per-file setting
  // changes that). Rather than fight either, these platforms skip the
  // in-page modal entirely and just open the real link in a new tab.
  const EXTERNAL_ONLY_PLATFORMS = ["instagram", "onedrive"];

  const getExternalUrl = (video) => {
    if (video.platform === "instagram") {
      return `https://www.instagram.com/reel/${video.videoId}/`;
    }
    // onedrive, and anything else relying on the embedUrl escape hatch that
    // isn't reliably iframe-able: just open the original link as-is.
    return video.embedUrl;
  };

  const handleTileClick = (video) => {
    // Placeholder tiles for stuff that isn't uploaded/linked yet - nothing
    // to open, so just no-op.
    if (video.comingSoon) return;
    // Multi-video tiles (an Instagram-only project made of several reels)
    // open the collection breakout instead of a single-video modal or a
    // direct external link - checked before EXTERNAL_ONLY_PLATFORMS below
    // since these tiles also set platform: "instagram" (for the WATCH-button
    // icon) and would otherwise get swept into that branch instead.
    if (video.collection) {
      setActiveCollection(video);
      return;
    }
    if (EXTERNAL_ONLY_PLATFORMS.includes(video.platform)) {
      const url = getExternalUrl(video);
      if (!url) return;
      if (video.platform === 'instagram') {
        openInstagramLink(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    setActiveVideo(video);
  };

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
      <div className="videos-grid" ref={gridRef}>
        {filtered.map((video, index) => (
          <div
            key={index}
            className={`video-tile ${video.comingSoon ? 'video-tile--placeholder' : ''}`}
            onClick={() => handleTileClick(video)}
          >
            <div
              className="video-thumbnail"
              style={video.thumbnailAspect ? { paddingBottom: video.thumbnailAspect } : undefined}
            >
              {video.comingSoon ? (
                <div className="thumbnail-placeholder">NEEDS TO BE ADDED</div>
              ) : (
                <>
                  <img src={video.thumbnail} alt={video.title} loading="lazy" decoding="async" />
                  {/* Collection tiles (GoWalkabout Gowanus) open a breakout
                      overlay, not a video - no play affordance since there's
                      nothing to play directly from this tile. */}
                  {!video.collection && (
                    <div className="play-button">
                      <svg viewBox="0 0 24 24" fill="white">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                  )}
                </>
              )}
            </div>
            {video.involvement && (
              <div className="involvement-badges">
                {video.involvement.map((role, i) => (
                  <span key={i} className="involvement-badge">{role}</span>
                ))}
              </div>
            )}
            <div className="video-info">
              <h3>{video.title}</h3>
              {video.creator && <p className="video-creator">Created by {video.creator}</p>}
              <ClampedText text={video.description} lines={4} />
              <div className="tile-footer">
                {video.comingSoon ? (
                  <span className="watch-btn watch-btn--disabled">NOT UPLOADED YET</span>
                ) : (
                  <button className="watch-btn" type="button">
                    {/* Collection tiles (GoWalkabout Gowanus) open a
                        breakout overlay, not an Instagram link directly -
                        the platform icon belongs on the sub-tiles inside
                        that overlay (each of which really does open
                        Instagram), not here. */}
                    {!video.collection && <PlatformIcon platform={video.platform} />}
                    {video.collection ? "LEARN MORE" : "WATCH"}
                  </button>
                )}
                {video.duration && (
                  <span className="duration-label">{video.duration}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Poster reminder */}
      {!reminderDismissed && (
        <div className={`poster-reminder ${reminderInView ? 'poster-reminder--visible' : ''}`}>
          <div className="poster-reminder-bubble">
            <button
              className="poster-reminder-close"
              type="button"
              aria-label="Dismiss"
              onClick={() => setReminderDismissed(true)}
            >
              &times;
            </button>
            <p>I design posters too! Visit the Art &amp; Design section.</p>
            <a href="/art-design" className="poster-reminder-visit-btn">Visit</a>
            <span className="poster-reminder-tail" aria-hidden="true"></span>
          </div>
          <div className="poster-reminder-avatar">
            <img src="/poster-reminder-avatar.png" alt="" />
          </div>
        </div>
      )}

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
                src={getEmbedUrl(activeVideo)}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <h2 style={{marginTop: '20px', color: 'white'}}>{activeVideo.title}</h2>
          </div>
        </div>
      )}

      {/* Collection Modal - see the collection field on GoWalkabout Gowanus
          above and the handleTileClick branch that opens this instead of
          the single-video modal. */}
      {activeCollection && (
        <div
          className="video-modal"
          style={{display: 'flex'}}
          onClick={(e) => { if (e.target.className === 'video-modal') setActiveCollection(null); }}
        >
          <div className="modal-content modal-content--collection">
            <button className="modal-close" onClick={() => setActiveCollection(null)} type="button">&times;</button>
            <h2 className="collection-modal-title">{activeCollection.title}</h2>
            <p className="collection-modal-description">{activeCollection.description}</p>
            {/* --single (mobile-only via the .collection-grid--single CSS
                rule): collections with 2 or fewer sub-items already fit on
                one screen in a single column without scrolling, so they
                skip the 2-column mobile layout used for longer ones (The
                Space, GoWalkabout Gowanus) - no point splitting 2 tiles
                into side-by-side halves when 1-up already fits. */}
            <div className={`collection-grid ${activeCollection.collection.length <= 2 ? 'collection-grid--single' : ''}`}>
              {activeCollection.collection.map((sub, i) => (
                <div
                  key={i}
                  className="collection-tile"
                  onClick={() => {
                    const url = sub.url || `https://www.instagram.com/reel/${sub.videoId}/`;
                    // Sub-items default to Instagram (see the collection
                    // comments above) - OneDrive is the one platform here
                    // that explicitly opts out, since its share link isn't
                    // an Instagram URL and has no app to deep-link into.
                    if (sub.platform === 'onedrive') {
                      window.open(url, '_blank', 'noopener,noreferrer');
                    } else {
                      openInstagramLink(url);
                    }
                  }}
                >
                  <div
                    className="collection-tile-thumbnail"
                    style={sub.thumbnailAspect ? { paddingBottom: sub.thumbnailAspect } : undefined}
                  >
                    <img src={sub.thumbnail} alt={sub.title} loading="lazy" decoding="async" />
                    <div className="play-button">
                      <svg viewBox="0 0 24 24" fill="white">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                  </div>
                  <div className="collection-tile-info">
                    <h4>{sub.title}</h4>
                    <ClampedText text={sub.description} lines={3} />
                    <div className="collection-tile-footer">
                      <button className="watch-btn" type="button">
                        <PlatformIcon platform={sub.platform || "instagram"} />
                        WATCH NOW
                      </button>
                      {sub.duration && (
                        <span className="duration-label">{sub.duration}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilmmakingPage;