import mongoose, { Schema } from 'mongoose';

const DailyCampaignMetricSchema = new Schema({
  workspace_id: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  import_job_id: { type: Schema.Types.ObjectId, ref: 'ImportJob', required: false, index: true },
  date: { type: Date, required: true, index: true },
  campaign_id: { type: String, required: true, index: true },
  campaign_name: { type: String, required: true, trim: true },
  channel: {
    type: String,
    enum: ['META', 'GOOGLE', 'LINKEDIN', 'OTHER'],
    default: 'OTHER',
    index: true
  },
  spend: { type: Number, required: true, min: 0 },
  impressions: { type: Number, required: true, min: 0 },
  clicks: { type: Number, required: true, min: 0 },
  leads: { type: Number, min: 0, default: null },
  conversions: { type: Number, min: 0, default: null },
  revenue: { type: Number, min: 0, default: null },

  // Computed analytical fields persisted for zero-latency indexing
  ctr: { type: Number, default: null },
  cpc: { type: Number, default: null },
  cvr: { type: Number, default: null },
  cpa: { type: Number, default: null },
  roas: { type: Number, default: null },
  is_revenue_tracked: { type: Boolean, required: true, default: false },
  created_at: { type: Date, default: Date.now }
});

// Composite Indexes for dashboard multi-dimension range queries
DailyCampaignMetricSchema.index({ workspace_id: 1, date: 1, channel: 1 });
DailyCampaignMetricSchema.index({ workspace_id: 1, campaign_id: 1, date: 1 });

export const DailyCampaignMetric =
  mongoose.models.DailyCampaignMetric ||
  mongoose.model('DailyCampaignMetric', DailyCampaignMetricSchema);
