import { useEffect, useState } from "react";

/**
 * The written comp, opened to read rather than handed over as a download.
 *
 * On a desktop browser the PDF goes into an iframe inside the site's own
 * modal, where the browser's built-in viewer takes over: scrolling, zoom,
 * page numbers, search, print and a download button of its own. Nothing is
 * reimplemented, which is the whole reason this is worth doing at all.
 *
 * Phones are the exception. iOS Safari and Android Chrome will not scroll a
 * PDF inside an iframe - historically they render the first page and stop -
 * so there the link simply opens in a new tab, where the operating system's
 * own full-screen reader is better than anything that could be built here.
 * The filmmaking page already draws this distinction for Instagram and
 * OneDrive (see EXTERNAL_ONLY_PLATFORMS); this is the same idea.
 *
 * The anchor stays a real link to the file, so with JavaScript off, or if the
 * check below is ever wrong, clicking it still opens the comp.
 *
 * Two frame shapes, toggled beside the close button. Page view is the shape of
 * the paper, 8.5 by 11, and shows one whole sheet. Wide view is the shape of
 * the window, which suits the sixteen pages of photographic documentation at
 * the back better than a letter-shaped box does. Only the frame changes: the
 * iframe's src is untouched, so switching never reloads the file or loses the
 * reader's place in it.
 */
const CompReader = ({ doc, pages, label = "Read the written comp" }) => {
    const [open, setOpen] = useState(false);
    const [wide, setWide] = useState(false);
    // The iframe waits two frames after the modal is in the DOM. Opening it
    // locks the body's scrollbar, which changes the viewport width, and the
    // PDF viewer reads its size once as it boots: started in the same frame,
    // it can come up fitted to a width the frame no longer has and stay
    // there. Two frames is enough for the lock and the layout to settle.
    const [frameReady, setFrameReady] = useState(false);

    // Resolved on the client only, so the server-rendered markup is just the
    // link and nothing depends on guessing the browser at build time.
    const canReadInline = () => {
        if (typeof navigator === "undefined") return false;
        // A real, standardised signal: the browser says whether it will
        // display a PDF itself rather than download it. The width test is the
        // phone guard - `pdfViewerEnabled` is true on mobile Safari, which is
        // exactly where the iframe does not work.
        const viewer = navigator.pdfViewerEnabled;
        return (viewer === undefined || viewer === true) && window.innerWidth >= 820;
    };

    const onClick = (e) => {
        if (!canReadInline()) return;   // let the link open a new tab
        e.preventDefault();
        setOpen(true);
    };

    useEffect(() => {
        if (!open) {
            setFrameReady(false);
            return;
        }
        let inner;
        const outer = requestAnimationFrame(() => {
            inner = requestAnimationFrame(() => setFrameReady(true));
        });
        const onKeyDown = (event) => {
            if (event.key !== "Escape") return;
            event.stopImmediatePropagation();
            setOpen(false);
        };
        window.addEventListener("keydown", onKeyDown, true);
        // The document is tall and the page behind it is taller; letting the
        // page scroll under an open reader is disorienting.
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            cancelAnimationFrame(outer);
            if (inner) cancelAnimationFrame(inner);
            window.removeEventListener("keydown", onKeyDown, true);
            document.body.style.overflow = previous;
        };
    }, [open]);

    return (
        <div className="eclipse-doc">
            <a
                className="watch-btn"
                href={doc}
                target="_blank"
                rel="noopener"
                onClick={onClick}
            >
                <svg className="eclipse-doc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                {label}
            </a>
            {pages && <span className="duration-label">{pages} pages</span>}

            {open && (
                <div
                    className="video-modal doc-modal"
                    style={{ display: "flex" }}
                    onClick={(e) => {
                        if (e.target.classList.contains("doc-modal")) setOpen(false);
                    }}
                >
                    <div className={`modal-content modal-content--doc${wide ? " is-wide" : ""}`}>
                        <div className="modal-doc-controls">
                            <button
                                type="button"
                                className="album-back-btn doc-view-toggle"
                                onClick={() => setWide((prev) => !prev)}
                                aria-pressed={wide}
                                title={wide ? "Fit the frame to a page" : "Fit the frame to the window"}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                     strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    {wide
                                        ? <rect x="7" y="3" width="10" height="18" rx="1.5" />
                                        : <rect x="3" y="6" width="18" height="12" rx="1.5" />}
                                </svg>
                                {wide ? "Page view" : "Wide view"}
                            </button>
                            <button className="modal-close" onClick={() => setOpen(false)} type="button">&times;</button>
                        </div>
                        <div className={`modal-doc-wrapper${wide ? " is-wide" : ""}`}>
                            {/* `FitH` fits the page to the frame's width, and
                                the viewer re-applies that on every resize, so
                                the zoom follows the toggle by itself. Page
                                view's frame is sized so a width-fitted page is
                                exactly one sheet tall (see the CSS), which is
                                why one mode serves both. `navpanes=0` closes
                                the page-thumbnail rail, which in a frame this
                                shape was taking half the width. The toolbar
                                stays: it is the page counter, zoom, search,
                                print and download. */}
                            {frameReady && (
                                <iframe src={`${doc}#view=FitH&navpanes=0`} title="The Eclipse Project, the written comp" />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompReader;
