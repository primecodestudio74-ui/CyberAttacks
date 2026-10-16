import React from 'react';
import { MotionConfig } from 'framer-motion';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    // reducedMotion="user": framer-motion automatically disables transform and
    // layout animations for users with a reduced-motion OS preference, while
    // keeping opacity changes - the CSS-side media queries in index.css cover
    // keyframe animations and transitions app-wide.
    <MotionConfig reducedMotion="user">
      <AppRoutes />
    </MotionConfig>
  );
}
