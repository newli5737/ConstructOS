import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { User } from '../types';

interface LayoutProps {
  currentUser: User | null;
  onLogout: () => void;
  onSwitchRole: (role: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ currentUser, onLogout, onSwitchRole }) => {
  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      <Navbar
        currentUser={currentUser}
        onLogout={onLogout}
        onSwitchRole={onSwitchRole}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar userRole={currentUser?.roles?.[0]} />
        <main className="flex-1 overflow-y-auto bg-slate-100/80 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
