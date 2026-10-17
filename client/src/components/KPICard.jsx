import React from 'react';
import { Info, HelpCircle } from 'lucide-react';

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeType = 'default',
  boundaryNote,
  untracked = false
}) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between text-muted mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-canvas flex items-center justify-center text-muted">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex items-baseline space-x-2">
          {untracked ? (
            <span className="text-xl font-bold text-muted">Untracked</span>
          ) : (
            <span className="text-2xl font-black text-text tracking-tight">{value}</span>
          )}

          {badge && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                badgeType === 'success'
                  ? 'bg-success-light text-success'
                  : badgeType === 'warning'
                  ? 'bg-warning-light text-warning'
                  : badgeType === 'error'
                  ? 'bg-error-light text-error'
                  : 'bg-canvas text-muted border border-border'
              }`}
            >
              {badge}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-border/60">
        {boundaryNote ? (
          <p className="text-[11px] text-warning flex items-center space-x-1 font-medium">
            <Info className="w-3 h-3 shrink-0" />
            <span>{boundaryNote}</span>
          </p>
        ) : subtitle ? (
          <p className="text-[11px] text-muted">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
