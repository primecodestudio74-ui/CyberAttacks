import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';
import Progress from '../models/Progress.js';
import Bookmark from '../models/Bookmark.js';
import Certificate from '../models/Certificate.js';
import Achievement from '../models/Achievement.js';

const getUserProgressDoc = async (userId) => {
  let progress = await Progress.findOne({ userId });
  if (!progress) {
    progress = await Progress.create({ userId, overall: { xp: 0, level: 1, streak: 0 } });
  }
  return progress;
};

const normalizeDateKey = (d = new Date()) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const computeLevelFromXp = (xp) => {
  // Simple scalable curve: level 1 starts at 0 xp.
  // Each level requires (level-1)*200 + 200 xp (linear-ish).
  const level = Math.floor(xp / 200) + 1;
  return Math.max(1, level);
};

const awardStreak = (progressDoc, todayKey) => {
  const last = progressDoc?.overall?.lastActiveDate || '';
  if (!last) {
    progressDoc.overall.streak = 1;
  } else if (last === todayKey) {
    // no change
  } else {
    const lastDate = new Date(last + 'T00:00:00.000Z');
    const todayDate = new Date(todayKey + 'T00:00:00.000Z');
    const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) progressDoc.overall.streak = (progressDoc.overall.streak || 0) + 1;
    else progressDoc.overall.streak = 1;
  }
  progressDoc.overall.lastActiveDate = todayKey;
};

export const listCourses = async (req, res) => {
  try {
    const { search, category, difficulty } = req.query;

    const q = {};
    if (category) q.category = category;
    if (difficulty) q.difficulty = difficulty;

    if (search) {
      q.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { keywords: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }

    const courses = await Course.find(q).sort({ order: 1, createdAt: -1 }).limit(100);
    return res.json({ courses });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list courses' });
  }
};

export const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const modules = await Module.find({ courseId }).sort({ order: 1, createdAt: 1 });

    return res.json({ course, modules });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to get course details' });
  }
};

export const getCourseModules = async (req, res) => {
  try {
    const { courseId } = req.params;
    const modules = await Module.find({ courseId }).sort({ order: 1, createdAt: 1 });
    return res.json({ modules });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to get course modules' });
  }
};

export const getLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId).populate('quizId');
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const module = await Module.findById(lesson.moduleId);
    const course = await Course.findById(module.courseId);

    return res.json({ lesson, module, course });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to get lesson' });
  }
};

export const getPrevNextLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const moduleId = lesson.moduleId;

    const ordered = await Lesson.find({ moduleId }).sort({ order: 1, createdAt: 1 });
    const idx = ordered.findIndex((l) => String(l._id) === String(lesson._id));

    const prev = idx > 0 ? ordered[idx - 1] : null;
    const next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null;

    return res.json({ prev, next });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to get prev/next' });
  }
};

export const completeLesson = async (req, res) => {
  try {
    const { lessonId } = req.body;
    const userId = req.user.id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const progressDoc = await getUserProgressDoc(userId);

    const hasCompleted = (progressDoc.overall.completedLessonIds || []).some(
      (id) => String(id) === String(lessonId)
    );

    if (!hasCompleted) {
      progressDoc.overall.completedLessonIds.push(lessonId);
    }

    // XP for completing lesson.
    const xpEarned = 25;
    progressDoc.overall.xp += xpEarned;
    progressDoc.overall.level = computeLevelFromXp(progressDoc.overall.xp);

    // Update streak based on today activity.
    const todayKey = normalizeDateKey();
    awardStreak(progressDoc, todayKey);

    // Mark course completion when all lessons for course are done.
    const module = await Module.findById(lesson.moduleId);
    const courseId = module.courseId;

    const courseModules = await Module.find({ courseId });
    const courseLessonIds = await Lesson.find({ moduleId: { $in: courseModules.map((m) => m._id) } }).select('_id');
    const courseLessonIdStr = courseLessonIds.map((l) => String(l._id));

    const completedLessonStr = (progressDoc.overall.completedLessonIds || []).map((id) => String(id));
    const allCompleted = courseLessonIdStr.length > 0 && courseLessonIdStr.every((id) => completedLessonStr.includes(id));

    if (allCompleted) {
      const hasCourse = (progressDoc.overall.completedCourseIds || []).some((id) => String(id) === String(courseId));
      if (!hasCourse) progressDoc.overall.completedCourseIds.push(courseId);

      // Certificate generation (idempotent)
      const cert = await Certificate.findOne({ userId, courseId });
      if (!cert) {
        await Certificate.create({ userId, courseId, certificateNumber: `HA-${userId.toString().slice(-6)}-${Date.now()}` });
      }
    }

    await progressDoc.save();

    return res.json({
      success: true,
      xpEarned,
      overall: progressDoc.overall,
    });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to complete lesson' });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId, answers } = req.body;

    const lesson = await Lesson.findById(lessonId).populate('quizId');
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    if (!lesson.quizId) return res.status(400).json({ message: 'This lesson has no quiz' });

    const quiz = lesson.quizId;

    // answers is expected as array matching quiz.questions indices.
    // Because quizQuestionSchema is strict:false, we support several shapes:
    // - question.type: 'multiple_choice'|'true_false'|'multiple_select'
    // - question.correctAnswer (for single)
    // - question.correctAnswers (for multi)
    let total = quiz.questions?.length || 0;
    let correct = 0;

    const detailed = (quiz.questions || []).map((q, idx) => {
      const a = answers?.[idx];
      let isCorrect = false;

      if (q.type === 'multiple_select') {
        const correctArr = q.correctAnswers || [];
        const userArr = Array.isArray(a) ? a : [];
        const sortA = [...userArr].sort();
        const sortC = [...correctArr].sort();
        isCorrect = JSON.stringify(sortA) === JSON.stringify(sortC);
      } else {
        // multiple_choice or true_false default
        isCorrect = a === (q.correctAnswer ?? q.correct);
      }

      if (isCorrect) correct += 1;
      return { idx, correct: isCorrect };
    });

    const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;

    const xpEarned = Math.round((scorePercent / 100) * (quiz.xpForPerfect || 100));
    const progressDoc = await getUserProgressDoc(userId);

    // store attempt
    progressDoc.overall.quizAttempts = progressDoc.overall.quizAttempts || [];
    progressDoc.overall.quizAttempts.push({
      lessonId,
      scorePercent,
      xpEarned,
      submittedAt: new Date(),
    });

    // Award streak + xp
    progressDoc.overall.xp += xpEarned;
    progressDoc.overall.level = computeLevelFromXp(progressDoc.overall.xp);

    const todayKey = normalizeDateKey();
    awardStreak(progressDoc, todayKey);

    // Mark lesson completed if passes OR if quiz is not required.
    const pass = scorePercent >= (quiz.passingScorePercent || 70);
    const shouldComplete = lesson.requireQuizToComplete ? pass : true;

    if (shouldComplete) {
      const hasCompleted = (progressDoc.overall.completedLessonIds || []).some((id) => String(id) === String(lessonId));
      if (!hasCompleted) progressDoc.overall.completedLessonIds.push(lessonId);
    }

    await progressDoc.save();

    return res.json({
      success: true,
      scorePercent,
      xpEarned,
      passed: pass,
      overall: progressDoc.overall,
      detailed,
    });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to submit quiz' });
  }
};

export const getMyProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const progressDoc = await getUserProgressDoc(userId);

    return res.json({
      overall: progressDoc.overall,
      bookmarks: (await Bookmark.find({ userId })).map((b) => b.lessonId),
    });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to get progress' });
  }
};

export const toggleBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.body;

    const existing = await Bookmark.findOne({ userId, lessonId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ bookmarked: false });
    }

    await Bookmark.create({ userId, lessonId });
    return res.json({ bookmarked: true });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to toggle bookmark' });
  }
};

export const listMyBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookmarks = await Bookmark.find({ userId }).populate('lessonId');
    return res.json({
      bookmarks: bookmarks.map((b) => ({
        lesson: b.lessonId,
      })),
    });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to load bookmarks' });
  }
};

export const listMyCertificates = async (req, res) => {
  try {
    const userId = req.user.id;
    const certificates = await Certificate.find({ userId }).populate('courseId');
    return res.json({ certificates });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to load certificates' });
  }
};

export const listMyAchievements = async (req, res) => {
  try {
    const userId = req.user.id;
    const progressDoc = await getUserProgressDoc(userId);
    // Map stored achievement ObjectIds to docs
    const ids = progressDoc.overall.achievements || [];
    const achievements = ids.length ? await Achievement.find({ _id: { $in: ids } }) : [];
    return res.json({ achievements });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to load achievements' });
  }
};

export default {
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
};

