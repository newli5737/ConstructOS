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
    <div className="flex flex-col h-screen w-full bg-zinc-100 overflow-hidden font-sans">
      <Navbar
        currentUser={currentUser}
        onLogout={onLogout}
        onSwitchRole={onSwitchRole}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar userRole={currentUser?.roles?.[0]} />
        <main className="flex-1 overflow-y-auto bg-zinc-50 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

