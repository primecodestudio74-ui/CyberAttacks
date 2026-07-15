import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
    index: true,
  },
  coverImageUrl: { type: String, default: '' },
  // Used for user-friendly sorting
  order: { type: Number, default: 0 },
  // Light searchable field
  keywords: [{ type: String, default: [] }],
  // Aggregate stats (optional; can be computed later)
  totalLessons: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);

