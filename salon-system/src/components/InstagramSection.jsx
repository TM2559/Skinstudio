import React, { useEffect, useRef } from 'react';
import { INSTAGRAM_POST_URLS } from '../firebaseConfig';

const INSTAGRAM_EMBED_SCRIPT = 'https://www.instagram.com/embed.js';

/** Renders only the Instagram post embed grid (for use inside footer). */
export default function InstagramSection({ embedOnly = false }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (INSTAGRAM_POST_URLS.length === 0) return;
    if (document.querySelector('script[src="' + INSTAGRAM_EMBED_SCRIPT + '"]')) {
      if (window.instgrm) window.instgrm.Embeds.process();
      return;
    }
    const script = document.createElement('script');
    script.src = INSTAGRAM_EMBED_SCRIPT;
    script.async = true;
    script.onload = () => {
      if (window.instgrm) window.instgrm.Embeds.process();
    };
    document.body.appendChild(script);
    return () => {};
  }, []);

  if (embedOnly) {
    if (INSTAGRAM_POST_URLS.length === 0) return null;
    return (
      <div
        ref={containerRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl mx-auto mt-12"
      >
        {INSTAGRAM_POST_URLS.slice(0, 6).map((url) => (
          <blockquote
            key={url}
            className="instagram-media rounded-lg overflow-hidden"
            data-instgrm-permalink={url}
            data-instgrm-version="14"
            style={{ minWidth: 280, maxWidth: 540 }}
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              Příspěvek na Instagramu
            </a>
          </blockquote>
        ))}
      </div>
    );
  }

  return null;
}
