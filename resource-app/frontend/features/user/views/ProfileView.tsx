
import React from 'react';
import { useUser } from '../context';
import { Card, Badge, Select, Button } from '../../../components/UI';
import { UserRole } from '../types';
import { Code, LogOut } from 'lucide-react';

export const ProfileView = () => {
  const { currentUser, allUsers, switchUser, isAdmin } = useUser();

  return (
    <div className="space-y-6 animate-in fade-in pb-6">
      {/* User Info Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
         <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-md shrink-0">
            <img src={currentUser?.avatar} alt="Avatar" className="w-full h-full object-cover" />
         </div>
         <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">{currentUser?.email}</h2>
            <p className="text-sm text-slate-500 mb-1.5">{currentUser?.department || 'General Member'}</p>
            <Badge variant={isAdmin ? 'primary' : 'neutral'}>
               {currentUser?.role}
            </Badge>
         </div>
      </div>

      {/* Debug / Account Switcher */}
      <section>
         <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 px-1 tracking-wide flex items-center gap-1">
            <Code size={12} /> Debug: Switch Account
         </h3>
         <Card className="bg-slate-50 border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-3">
              Select a user to simulate their role and permissions:
            </p>
            <Select 
               value={currentUser?.id}
               onChange={(e) => switchUser(e.target.value)}
               className="bg-white"
            >
               {allUsers.map(u => (
                  <option key={u.id} value={u.id}>
                     {u.email} ({u.role})
                  </option>
               ))}
            </Select>
         </Card>
      </section>

      {/* Placeholder Sign Out */}
      <Button variant="ghost" className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 h-12 mt-auto">
         <LogOut size={18} className="mr-2" />
         Sign Out
      </Button>
    </div>
  );
};
