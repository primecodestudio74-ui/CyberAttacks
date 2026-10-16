import mongoose from 'mongoose';

// Rich content blocks (simple, scalable):
// [{ type: 'heading'|'paragraph'|'list'|'code'|'note'|'tip'|'image'|'diagram'|'example'|'key_takeaways', ... }]
const lessonContentBlockSchema = new mongoose.Schema({}, { strict: false });

const lessonSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  learningObjectives: [{ type: String, default: '' }],
  content: [lessonContentBlockSchema],
  // Quiz definition (optional). Keep flexible so we can evolve.
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
  order: { type: Number, default: 0, index: true },
  // Mark lesson as requiring quiz to be considered completed (optional)
  requireQuizToComplete: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Lesson', lessonSchema);

