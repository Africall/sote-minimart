
import React from 'react';
import ExpiryTracker from '../components/inventory/ExpiryTracker';

const ExpiryTrackerPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Expiry Tracker</h1>
        <p className="text-muted-foreground">
          Monitor products approaching or past their expiry dates
        </p>
      </div>
      <ExpiryTracker />
    </div>
  );
};

export default ExpiryTrackerPage;
