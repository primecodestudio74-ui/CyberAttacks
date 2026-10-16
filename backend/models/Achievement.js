import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  badgeImageUrl: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Achievement', achievementSchema);

