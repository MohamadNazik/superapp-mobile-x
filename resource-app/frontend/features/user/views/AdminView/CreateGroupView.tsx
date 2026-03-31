import React, { useState, useMemo } from 'react';
import { ArrowLeft, Save, CheckSquare, Square, Search } from 'lucide-react';
import { Button, Input, Label } from '../../../../components/UI';
import { useGroup } from '../../../group/context';
import { useUser } from '../../context';

interface CreateGroupViewProps {
  onClose: () => void;
}

export const CreateGroupView = ({ onClose }: CreateGroupViewProps) => {
  const { createGroup, error: groupError } = useGroup();
  const { allUsers } = useUser();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allUsers.filter(u =>
      u.email.toLowerCase().includes(query) ||
      (u.department || '').toLowerCase().includes(query)
    );
  }, [allUsers, searchQuery]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const success = await createGroup({
        name: name.trim(),
        description: description.trim(),
        userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      });
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-3 shrink-0 shadow-sm">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Create New Group</h2>
          <p className="text-xs text-slate-500">Define group details and assign members</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-24">

        {/* 1. Basic Details */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 px-1 tracking-wide border-b border-slate-200 pb-2">Group Details</h3>

          <div>
            <Label required>Group Name</Label>
            <Input
              placeholder="e.g. Level 1 Officers"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <Label>Description</Label>
            <Input
              placeholder="e.g. Officers assigned to Level 1 resources"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </section>

        {/* 2. Assign Users */}
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold uppercase text-slate-400 px-1 tracking-wide">
              Assign Users
              {selectedUserIds.length > 0 && (
                <span className="ml-2 bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-[10px] font-semibold normal-case">
                  {selectedUserIds.length} selected
                </span>
              )}
            </h3>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search users by email or department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* User List */}
          <div className="space-y-1 max-h-[40vh] overflow-y-auto rounded-lg border border-slate-200 bg-white">
            {filteredUsers.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 text-center">No users found.</p>
            ) : (
              filteredUsers.map(user => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleUser(user.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-50 last:border-b-0 ${
                      isSelected ? 'bg-primary-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="shrink-0">
                      {isSelected ? (
                        <CheckSquare size={18} className="text-primary-600" />
                      ) : (
                        <Square size={18} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                      <p className="text-[10px] text-slate-400">{user.department || 'No Department'} • {user.role}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        {groupError && (
          <div className="mb-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
            <span className="font-semibold">Error:</span> {groupError}
          </div>
        )}
        <Button
          className="w-full h-12 text-base shadow-lg shadow-primary-500/20"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={!name.trim()}
        >
          <Save size={18} className="mr-2" />
          Create Group
        </Button>
      </div>
    </div>
  );
};
