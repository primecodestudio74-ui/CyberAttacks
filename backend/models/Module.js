import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  order: { type: Number, default: 0, index: true },
}, { timestamps: true });

export default mongoose.model('Module', moduleSchema);

