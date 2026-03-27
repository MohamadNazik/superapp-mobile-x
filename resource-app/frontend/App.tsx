
import React, { useState } from 'react';
import { useUser, UserProvider } from './features/user';
import { ResourceProvider, useResource } from './features/resource/context';
import { BookingProvider, useBookingContext } from './features/booking/context';
import { UserRole } from './features/user/types';
import { Resource } from './features/resource/types';

// Views
import { CalendarView } from './features/calendar/views/CalendarView';
import { CatalogView } from './features/resource/views/CatalogView';
import { AdminView } from './features/user/views/AdminView';
import { BookingView } from './features/booking/views/BookingView';
import { PageLoader, Button } from './components/UI';
import { BottomNav, Header } from './components/Layout';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const AppContent = () => {
  const { currentUser, isLoading: isUserLoading } = useUser();
  const { isLoading: isResourceLoading, error: resourceError, refreshResources } = useResource();
  const { isLoading: isBookingLoading, error: bookingError, refreshBookings } = useBookingContext();
  const [currentTab, setCurrentTab] = useState('calendar');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  if (isUserLoading || isResourceLoading || isBookingLoading) return <PageLoader />;

  const combinedError = resourceError || bookingError;

  if (combinedError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-slate-50">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Connection Failed</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-xs">
          {combinedError}.<br />Please ensure the backend server is running on port 3001.
        </p>
        <Button onClick={() => { refreshResources(); refreshBookings(); }} variant="primary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Connection
        </Button>
      </div>
    );
  }

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // Booking Flow Overlay
  if (selectedResource) {
    return (
      <BookingView
        resource={selectedResource}
        onBack={() => setSelectedResource(null)}
        onSuccess={() => {
          setSelectedResource(null);
          setCurrentTab('calendar');
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">

      {/* Conditional Headers */}
      {currentTab === 'calendar' && <Header title="My Schedule" subtitle="Upcoming Bookings" />}
      {currentTab === 'catalog' && <Header title="Resource Catalog" subtitle="Find & Book" />}
      {currentTab === 'admin' && <Header title="Admin Dashboard" subtitle="Management & Analytics" />}

      {/* Main Content - Scrollable Area */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-[80px] max-w-md mx-auto w-full animate-in fade-in no-scrollbar">
        {currentTab === 'calendar' && <CalendarView />}
        {currentTab === 'catalog' && <CatalogView onSelect={setSelectedResource} />}
        {currentTab === 'admin' && isAdmin && <AdminView />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={currentTab}
        onTabChange={setCurrentTab}
        showAdmin={isAdmin}
      />
    </div >
  );
};

import { HolidayProvider } from './features/holiday/context';

const App = () => (
  <UserProvider>
    <HolidayProvider>
      <ResourceProvider>
        <BookingProvider> 
            <AppContent />
        </BookingProvider>
      </ResourceProvider>
    </HolidayProvider>
  </UserProvider>
);

export default App;
