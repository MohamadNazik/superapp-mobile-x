import React, { useState } from 'react';
import { useResource } from '../../../resource/context';
import { useBookingContext } from '../../../../features/booking/context';
import { cn } from '../../../../utils/cn';
import { PageLoader } from '../../../../components/UI';
import { BookingStatus } from '../../../../features/booking/types';
import { GroupProvider } from '../../../group/context';

import { ApprovalsTab } from './ApprovalsTab';
import { UsersTab } from './UsersTab';
import { ResourcesTab } from './ResourcesTab';
import { AnalyticsTab } from './AnalyticsTab';
import { GroupsTab } from './GroupsTab';

type AdminTab = 'approvals' | 'users' | 'groups' | 'resources' | 'analytics';
const ADMIN_TABS: readonly AdminTab[] = ['approvals', 'users', 'groups', 'resources', 'analytics'];

export const AdminView = () => {
  const { isLoading } = useResource();
  const { bookings } = useBookingContext();
  const [tab, setTab] = useState<AdminTab>('approvals');
  const [isFullScreenActive, setIsFullScreenActive] = useState(false);

  if (isLoading) return <PageLoader />;

  const pendingBookings = bookings.filter(b => b.status === BookingStatus.PENDING);

  return (
    <div className={cn(isFullScreenActive ? "w-full" : "space-y-4 pt-[24px]")}>
      {/* Tab Control */}
      {!isFullScreenActive && (
        <div className="fixed top-[68px] left-0 right-0 z-40 px-4 py-2 bg-slate-50/95 backdrop-blur-md max-w-md mx-auto">
          <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar shadow-inner">
          {ADMIN_TABS.map(t => (
            <button
              key={t}
              onClick={(e) => {
                setTab(t);
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }}
              className={cn(
                "flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap capitalize",
                tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              )}
            >
              {t}
              {t === 'approvals' && pendingBookings.length > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white px-1.5 py-0.5 rounded-full text-[9px]">{pendingBookings.length}</span>
              )}
            </button>
          ))}
          </div>
        </div>
      )}

      {/* Tab Contents */}
      {tab === 'approvals' && <ApprovalsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'resources' && <ResourcesTab onActiveFullScreen={setIsFullScreenActive} />}
      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'groups' && <GroupProvider><GroupsTab /></GroupProvider>}
    </div>
  );
};
