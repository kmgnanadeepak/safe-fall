import mongoose from 'mongoose';

const fallEventSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    is_emergency: { type: Boolean, default: false },
    resolved: { type: Boolean, default: false },
    resolved_at: { type: Date, default: null },
    resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

fallEventSchema.set('toJSON', {
  virtuals: true,
  transform(_, ret) {
    ret.id = ret._id?.toString();
    ret.user_id = ret.user_id?.toString();
    ret.resolved_by = ret.resolved_by?.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('FallEvent', fallEventSchema);
