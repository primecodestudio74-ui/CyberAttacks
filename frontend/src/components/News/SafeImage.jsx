import React, { useState } from 'react';
import { ShieldAlert, ImageOff } from 'lucide-react';

/**
 * Article thumbnail with layout reservation and a branded fallback.
 *
 * - Reserves the aspect ratio before the image loads (no layout shift).
 * - Lazy-loads everything except the featured image.
 * - Falls back to a branded placeholder when the image is missing, blocked by
 *   the publisher (hotlink protection) or simply fails to load - the card
 *   layout never breaks and the broken-image icon never appears.
 */
export default function SafeImage({
  src,
  alt = '',
  label,
  ratio = '16 / 9',
  className = '',
  imgClassName = '',
  priority = false,
  sizes,
}) {
  // Derived state: when the incoming src changes (list re-filter, refresh),
  // the load status resets during render instead of in an effect - React's
  // documented "adjust state when a prop changes" pattern.
  const [state, setState] = useState(() => ({ src, status: src ? 'loading' : 'missing' }));
  if (state.src !== src) {
    setState({ src, status: src ? 'loading' : 'missing' });
  }
  const { status } = state;
  const setStatus = (next) => setState((previous) => ({ ...previous, status: next }));

  const showImage = Boolean(src) && status !== 'error';

  return (
    <div
      className={`relative overflow-hidden bg-slate-900/60 ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {showImage ? (
        <>
          <img
            src={src}
            alt={alt}
            sizes={sizes}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            referrerPolicy="no-referrer"
            onError={() => setStatus('error')}
            onLoad={() => setStatus('loaded')}
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              status === 'loaded' ? 'opacity-100' : 'opacity-0'
            } ${imgClassName}`}
          />
          {status !== 'loaded' && <div className="absolute inset-0 animate-pulse bg-slate-800/40" aria-hidden="true" />}
        </>
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))] text-slate-600"
          role="img"
          aria-label={label ? `${label} (no image available)` : 'No image available'}
        >
          <div className="flex items-center gap-2 text-cyan-500/50">
            <ShieldAlert size={18} aria-hidden="true" />
            <ImageOff size={14} aria-hidden="true" />
          </div>
          {label && (
            <span className="max-w-[85%] truncate px-3 text-center text-[9px] font-black uppercase tracking-[0.25em] text-slate-600">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
