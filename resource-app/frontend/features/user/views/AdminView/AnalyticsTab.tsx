import React, { useEffect } from 'react';
import { useResource } from '../../../resource/context';
import { Card, Badge } from '../../../../components/UI';
import { cn } from '../../../../utils/cn';

export const AnalyticsTab = () => {
  const { stats, fetchStats } = useResource();

  useEffect(() => {
    let cancelled = false;

    fetchStats().then(() => {
      if (!cancelled) {
        // Stats loaded successfully
      }
    }).catch(err => {
      if (!cancelled) {
        console.error('Failed to fetch stats:', err);
      }
    });

    return () => {
      cancelled = true; 
    };
  }, [fetchStats]);

  return (
    <div className="space-y-4 animate-in fade-in">
      {stats.map(stat => (
        <Card key={stat.resourceId} className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-sm text-slate-900">{stat.resourceName}</h4>
              <span className="text-[10px] text-slate-500">{stat.resourceType}</span>
            </div>
            <Badge variant={stat.utilizationRate > 70 ? 'success' : stat.utilizationRate > 30 ? 'primary' : 'neutral'}>
              {stat.utilizationRate}% Utilized
            </Badge>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full", stat.utilizationRate > 70 ? "bg-emerald-500" : "bg-primary-500")}
              style={{ width: `${stat.utilizationRate}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Bookings</span>
              <span className="text-lg font-semibold text-slate-900">{stat.bookingCount}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Hours Booked</span>
              <span className="text-lg font-semibold text-slate-900">{stat.totalHours}h</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
