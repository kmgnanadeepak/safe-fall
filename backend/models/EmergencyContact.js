import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    relation: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { timestamps: true }
);

emergencyContactSchema.set('toJSON', {
  virtuals: true,
  transform(_, ret) {
    ret.id = ret._id?.toString();
    ret.user_id = ret.user_id?.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('EmergencyContact', emergencyContactSchema);
