import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema({}, { strict: false });

const quizSchema = new mongoose.Schema({
  // Can attach quiz to a lesson
  title: { type: String, default: '' },
  questions: [quizQuestionSchema],
  // XP scaling
  xpForPerfect: { type: Number, default: 100 },
  passingScorePercent: { type: Number, default: 70 },
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);

