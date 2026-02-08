import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accelerometer_x: { type: Number, default: null },
    accelerometer_y: { type: Number, default: null },
    accelerometer_z: { type: Number, default: null },
    gyroscope_x: { type: Number, default: null },
    gyroscope_y: { type: Number, default: null },
    gyroscope_z: { type: Number, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

sensorDataSchema.set('toJSON', {
  virtuals: true,
  transform(_, ret) {
    ret.id = ret._id?.toString();
    ret.user_id = ret.user_id?.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('SensorData', sensorDataSchema);
