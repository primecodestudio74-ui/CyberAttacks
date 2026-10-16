import { useEffect, useSyncExternalStore } from 'react';
import { animate, useMotionValue } from 'framer-motion';
import { SCENE_SECONDS } from '../utils/xssSimulation.js';

const motionQuery = '(prefers-reduced-motion: reduce)';
const getMotionPreference = () => window.matchMedia(motionQuery).matches;
const serverMotionPreference = () => false;
const subscribeMotionPreference = (onChange) => {
  const query = window.matchMedia(motionQuery);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

// The installed Framer Motion hook snapshots this preference on mount. Using
// React's external-store hook also responds if it changes while the lab is open.
export function useReducedMotionPreference() {
  return useSyncExternalStore(subscribeMotionPreference, getMotionPreference, serverMotionPreference);
}

/** One cancellable clock drives both scene timing and the traveling packet.
 * Pausing preserves the fraction already played. Manual scene selection,
 * resets, and mode changes start a fresh clock. There are no network timers.
 */
export default function useXSSPlayback({ scene, runId, playing }, dispatch) {
  const progress = useMotionValue(0);

  useEffect(() => {
    progress.set(0);
  }, [scene, runId, progress]);

  useEffect(() => {
    if (!playing || scene < 0 || scene >= 3) return;
    const playback = animate(progress, 1, {
      duration: SCENE_SECONDS * (1 - progress.get()),
      ease: 'linear',
      onComplete: () => dispatch({ type: 'ADVANCE', scene, runId }),
    });
    return () => playback.stop();
  }, [playing, scene, runId, progress, dispatch]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) dispatch({ type: 'PAUSE' });
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, [dispatch]);

  return progress;
}
