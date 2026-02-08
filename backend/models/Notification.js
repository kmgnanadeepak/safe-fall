import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    related_event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FallEvent', default: null },
  },
  { timestamps: true }
);

notificationSchema.set('toJSON', {
  virtuals: true,
  transform(_, ret) {
    ret.id = ret._id?.toString();
    ret.user_id = ret.user_id?.toString();
    ret.related_event_id = ret.related_event_id?.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Notification', notificationSchema);
