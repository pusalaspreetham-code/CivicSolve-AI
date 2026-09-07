import React from 'react';
import { Outlet } from 'react-router-dom';
import GovSidebar from './GovSidebar';
import GovHeader from './GovHeader';

export default function GovLayout() {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <GovSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <GovHeader />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
