import express from 'express';
import authRequired from '../middleware/authRequired.js';
import {
  listCourses,
  getCourseDetails,
  getCourseModules,
  getLesson,
  getPrevNextLesson,
  completeLesson,
  submitQuiz,
  getMyProgress,
  toggleBookmark,
  listMyBookmarks,
  listMyCertificates,
  listMyAchievements,
} from '../controllers/learningController.js';

const router = express.Router();

// Course browsing (authenticated)
router.get('/courses', authRequired, listCourses);
router.get('/courses/:courseId', authRequired, getCourseDetails);
router.get('/courses/:courseId/modules', authRequired, getCourseModules);

// Lesson viewer
router.get('/lessons/:lessonId', authRequired, getLesson);
router.get('/lessons/:lessonId/prevnext', authRequired, getPrevNextLesson);

// Progress actions
router.post('/progress/complete-lesson', authRequired, completeLesson);
router.post('/quiz/submit', authRequired, submitQuiz);

// User dashboards
router.get('/me/progress', authRequired, getMyProgress);
router.post('/bookmarks/toggle', authRequired, toggleBookmark);
router.get('/me/bookmarks', authRequired, listMyBookmarks);
router.get('/me/certificates', authRequired, listMyCertificates);
router.get('/me/achievements', authRequired, listMyAchievements);

export default router;

