import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

bookmarkSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export default mongoose.model('Bookmark', bookmarkSchema);

