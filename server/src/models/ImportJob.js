import mongoose, { Schema } from 'mongoose';

const ImportJobSchema = new Schema({
  workspace_id: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  filename: { type: String, required: true },
  file_size: { type: Number, default: 0 },
  row_count: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['PENDING', 'VALIDATING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  validation_errors: [
    {
      row: { type: Number },
      field: { type: String },
      message: { type: String }
    }
  ],
  created_at: { type: Date, default: Date.now }
});

export const ImportJob = mongoose.models.ImportJob || mongoose.model('ImportJob', ImportJobSchema);
