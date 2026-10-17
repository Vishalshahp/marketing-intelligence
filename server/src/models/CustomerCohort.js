import mongoose, { Schema } from 'mongoose';

const CustomerCohortSchema = new Schema({
  workspace_id: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  customer_id: { type: String, required: true },
  customer_email: { type: String, trim: true },
  last_interaction_date: { type: Date, required: true },
  order_count: { type: Number, required: true, min: 0 },
  monetary_total_spend: { type: Number, required: true, min: 0 },
  recency_days: { type: Number, required: true, min: 0 },
  cluster_name: {
    type: String,
    enum: [
      'High-Value Champions',
      'At-Risk High Spenders',
      'Occasional Low-Spend Browsers',
      'Unassigned'
    ],
    default: 'Unassigned'
  },
  created_at: { type: Date, default: Date.now }
});

CustomerCohortSchema.index({ workspace_id: 1, customer_id: 1 });

export const CustomerCohort =
  mongoose.models.CustomerCohort ||
  mongoose.model('CustomerCohort', CustomerCohortSchema);
