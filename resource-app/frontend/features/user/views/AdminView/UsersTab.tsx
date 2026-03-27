import React, { useState } from 'react';
import { useUser } from '../../context';
import { UserRole } from '../../types';
import { Card, Button, Badge } from '../../../../components/UI';
import { Shield, User } from 'lucide-react';
import { cn } from '../../../../utils/cn';

export const UsersTab = () => {
  const { allUsers, currentUser, updateUserRole } = useUser();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  return (
    <div className="space-y-3 animate-in fade-in">
      {allUsers.map(user => {
        const isSelf = user.id === currentUser?.id;
        return (
          <Card key={user.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                user.role === UserRole.ADMIN ? "bg-primary-100 text-primary-600" : "bg-slate-100 text-slate-500"
              )}>
                {user.role === UserRole.ADMIN ? <Shield size={20} /> : <User size={20} />}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">{user.email}</h4>
                <p className="text-xs text-slate-500">{user.department || 'No Dept'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={user.role === UserRole.ADMIN ? 'primary' : 'neutral'}>{user.role}</Badge>
              {user.role === UserRole.USER ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updatingUserId === user.id}
                  isLoading={updatingUserId === user.id}
                  onClick={async () => {
                    setUpdatingUserId(user.id);
                    try {
                      await updateUserRole(user.id, UserRole.ADMIN);
                    } finally {
                      setUpdatingUserId(null);
                    }
                  }}
                >
                  Make Admin
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn("text-red-500 hover:bg-red-50", isSelf && "opacity-50 cursor-not-allowed")}
                  disabled={isSelf || updatingUserId === user.id}
                  isLoading={updatingUserId === user.id}
                  onClick={async () => {
                    setUpdatingUserId(user.id);
                    try {
                      await updateUserRole(user.id, UserRole.USER);
                    } finally {
                      setUpdatingUserId(null);
                    }
                  }}
                  title={isSelf ? "Cannot revoke your own access" : "Revoke Admin Access"}
                >
                  Revoke
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
