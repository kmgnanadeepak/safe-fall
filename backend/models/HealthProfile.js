import mongoose from 'mongoose';

const healthProfileSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    age: { type: Number, default: null },
    gender: { type: String, default: null },
    blood_group: { type: String, default: null },
    conditions: { type: String, default: null },
    allergies: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

healthProfileSchema.set('toJSON', {
  virtuals: true,
  transform(_, ret) {
    ret.id = ret._id?.toString();
    ret.user_id = ret.user_id?.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('HealthProfile', healthProfileSchema);
