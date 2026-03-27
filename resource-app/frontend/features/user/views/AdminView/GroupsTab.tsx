import React, { useState } from 'react';
import { useGroup } from '../../../group/context';
import { Group } from '../../../group/types';
import { Card, Button, EmptyState, Modal, Input, Label } from '../../../../components/UI';
import { Users, Eye, Edit2, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';

export const GroupsTab = () => {
  const { groups, createGroup, updateGroup, deleteGroup, error: groupError } = useGroup();

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const [viewingGroup, setViewingGroup] = useState<Group | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
  
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const handleEditGroupClick = (g: Group) => {
    setEditingGroup(g);
    setEditGroupName(g.name);
    setEditGroupDescription(g.description || '');
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !editGroupName.trim() || isUpdatingGroup) return;
    setIsUpdatingGroup(true);
    try {
      const success = await updateGroup(editingGroup.id, { name: editGroupName, description: editGroupDescription });
      if (success) {
        setEditingGroup(null);
        setEditGroupName('');
        setEditGroupDescription('');
      }
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup || isDeletingGroup) return;
    setIsDeletingGroup(true);
    try {
      const success = await deleteGroup(deletingGroup.id);
      if (success) {
        setDeletingGroup(null);
      }
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || isCreatingGroup) return;
    setIsCreatingGroup(true);
    try {
      const success = await createGroup({ name: newGroupName, description: newGroupDescription });
      if (success) {
        setIsGroupModalOpen(false);
        setNewGroupName('');
        setNewGroupDescription('');
      }
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <>
      <div className="space-y-3 animate-in fade-in pb-16">
        {groups.length === 0 ? (
          <EmptyState icon={Users} message="No groups defined yet." />
        ) : (
          groups.map(g => (
            <Card key={g.id} className="p-4 flex flex-row items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-slate-900 truncate" title={g.name}>{g.name}</h4>
                {g.description && <p className="text-xs text-slate-500 mt-1 truncate" title={g.description}>{g.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-slate-400 shrink-0">Created: {format(new Date(g.createdAt), 'MMM do, yyyy')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setViewingGroup(g)}
                  className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                  title="View Group"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleEditGroupClick(g)}
                  className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                  title="Edit Group"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setDeletingGroup(g)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete Group"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))
        )}
        
        <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto pointer-events-none flex justify-end px-4 z-50">
          <button
            className="w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 active:scale-95 transition-all pointer-events-auto"
            onClick={() => setIsGroupModalOpen(true)}
            title="Create New Group"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false);
          setNewGroupName('');
          setNewGroupDescription('');
        }}
        title="Add New Group"
      >
        <div className="space-y-4">
          {groupError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
              {groupError}
            </div>
          )}
          <div>
            <Label>Group Name</Label>
            <Input 
              value={newGroupName} 
              onChange={(e) => setNewGroupName(e.target.value)} 
              placeholder="e.g. Level 1 Officers" 
              autoFocus
            />
          </div>
          <div>
            <Label>Description (Optional)</Label>
            <Input 
              value={newGroupDescription} 
              onChange={(e) => setNewGroupDescription(e.target.value)} 
              placeholder="e.g. For Level 1 Officers" 
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleCreateGroup} 
            disabled={!newGroupName.trim() || isCreatingGroup}
            isLoading={isCreatingGroup}
          >
            Create Group
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!viewingGroup}
        onClose={() => setViewingGroup(null)}
        title="Group Details"
      >
        {viewingGroup && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500 block mb-1">Group Name</Label>
              <p className="font-semibold text-slate-900 border border-slate-100 bg-slate-50 p-2 rounded-lg">{viewingGroup.name}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500 block mb-1">Description</Label>
              <p className="text-sm text-slate-700 border border-slate-100 bg-slate-50 p-2 rounded-lg min-h-[60px]">{viewingGroup.description || 'No description provided.'}</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2 text-[10px] text-slate-400">
              <span>Created: {format(new Date(viewingGroup.createdAt), 'MMM do, yyyy')}</span>
            </div>
            <Button className="w-full mt-2" onClick={() => setViewingGroup(null)}>Close</Button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!editingGroup}
        onClose={() => {
          setEditingGroup(null);
          setEditGroupName('');
          setEditGroupDescription('');
        }}
        title="Edit Group"
      >
        <div className="space-y-4">
          {groupError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
              {groupError}
            </div>
          )}
          <div>
            <Label>Group Name</Label>
            <Input 
              value={editGroupName} 
              onChange={(e) => setEditGroupName(e.target.value)} 
              placeholder="e.g. Level 1 Officers" 
              autoFocus
            />
          </div>
          <div>
            <Label>Description (Optional)</Label>
            <Input 
              value={editGroupDescription} 
              onChange={(e) => setEditGroupDescription(e.target.value)} 
              placeholder="e.g. For Level 1 Officers" 
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleUpdateGroup} 
            disabled={!editGroupName.trim() || isUpdatingGroup}
            isLoading={isUpdatingGroup}
          >
            Save Changes
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!deletingGroup}
        onClose={() => setDeletingGroup(null)}
        title="Delete Group"
      >
        <div className="space-y-4">
          {groupError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
              {groupError}
            </div>
          )}
          <p className="text-sm text-slate-600">
            Are you sure you want to delete the group <strong>{deletingGroup?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setDeletingGroup(null)}
              disabled={isDeletingGroup}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              className="flex-1" 
              onClick={handleDeleteGroup} 
              isLoading={isDeletingGroup}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
