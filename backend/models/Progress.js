import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  overall: {
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: '' }, // YYYY-MM-DD
    completedCourseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    completedLessonIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    quizAttempts: [{
      lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
      scorePercent: { type: Number, default: 0 },
      xpEarned: { type: Number, default: 0 },
      submittedAt: { type: Date, default: Date.now },
    }],
    // Module completion can be derived later; storing is optional
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
  },
}, { timestamps: true });

export default mongoose.model('Progress', progressSchema);

