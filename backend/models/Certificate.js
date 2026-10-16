import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  issuedAt: { type: Date, default: Date.now },
  certificateNumber: { type: String, default: '' },
  // Store template variables / minimal metadata
  meta: { type: Object, default: {} },
}, { timestamps: true });

certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model('Certificate', certificateSchema);

