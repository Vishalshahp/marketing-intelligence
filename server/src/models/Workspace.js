import mongoose, { Schema } from 'mongoose';

const WorkspaceSchema = new Schema({
  name: { type: String, required: true, trim: true },
  owner_user_id: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  is_demo: { type: Boolean, default: false },
  settings: {
    currency: { type: String, enum: ['USD', 'INR', 'EUR'], default: 'USD' },
    timezone: { type: String, default: 'UTC' }
  },
  created_at: { type: Date, default: Date.now }
});

export const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema);
