import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';

const LearningDashboard = lazy(() => import('../pages/Learning/LearningDashboard.jsx'));
const CourseListing = lazy(() => import('../pages/Learning/CourseListing.jsx'));
const CourseDetails = lazy(() => import('../pages/Learning/CourseDetails.jsx'));
const LessonViewer = lazy(() => import('../pages/Learning/LessonViewer.jsx'));

export default function LearningRoutes() {
  return (
    <>
      <Navigate to="/dashboard/learning" replace />
      {/* The actual route declarations live in AppRoutes.jsx for simplicity. */}
      {/* This file exists to keep future expansion modular. */}
      <LearningDashboard />
      <CourseListing />
      <CourseDetails />
      <LessonViewer />
    </>
  );
}

