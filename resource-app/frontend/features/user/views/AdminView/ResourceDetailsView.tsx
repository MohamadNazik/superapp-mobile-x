import React, { useEffect, useState } from 'react';
import { useResource } from '../../../resource/context';
import { Resource } from '../../../resource/types';
import { ArrowLeft, Edit, Trash2, Plus, Users, Shield, Clock, ChevronRight } from 'lucide-react';
import { Button, Card, PageLoader, Badge, Label, Modal } from '../../../../components/UI';
import { DynamicIcon } from '../../../../components/Icons';
import { cn } from '../../../../utils/cn';
import { AddPermissionModal } from './AddPermissionModal';
import { CreateResourceView } from '../../../resource/views/CreateResourceView';

interface ResourceDetailsViewProps {
  resource: Resource;
  onBack: () => void;
}

export const ResourceDetailsView = ({ resource, onBack }: ResourceDetailsViewProps) => {
  const { permissions, fetchPermissions, isLoading, isPermissionsLoading, deletePermission, deleteResource } = useResource();
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [permissionIdToDelete, setPermissionIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingPermission, setIsDeletingPermission] = useState(false);
  const [deletePermissionError, setDeletePermissionError] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions(resource.id);
  }, [resource.id, fetchPermissions]);

  useEffect(() => {
    if (!permissionIdToDelete) {
      setDeletePermissionError(null);
    }
  }, [permissionIdToDelete]);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteResource(resource.id);
      onBack();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeletePermission = async () => {
    if (!permissionIdToDelete) return;
    setIsDeletingPermission(true);
    setDeletePermissionError(null);
    
    try {
      const res = await deletePermission(permissionIdToDelete);
      if (res.success) {
        setPermissionIdToDelete(null);
      } else {
        setDeletePermissionError(res.error || 'Failed to remove permission');
      }
    } catch (err: any) {
      setDeletePermissionError(err.message || 'An unexpected error occurred');
    } finally {
      setIsDeletingPermission(false);
    }
  };

  if (isEditing) {
    return (
      <CreateResourceView
        onClose={() => setIsEditing(false)}
        initialData={resource}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header Area */}
      <div className="bg-white px-4 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
              <DynamicIcon name={resource.icon} className="w-6 h-6 text-slate-800" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">{resource.name}</h2>
              <Badge variant="primary" className="text-[10px]">{resource.type}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        {/* Core Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-col gap-1 h-20 rounded-2xl shadow-sm border border-slate-200 text-slate-700 font-bold"
            onClick={() => setIsEditing(true)}
          >
            <Edit size={20} className="text-blue-500" />
            <span className="text-[11px] uppercase tracking-wider">Edit Details</span>
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-col gap-1 h-20 rounded-2xl shadow-sm border border-slate-200 text-slate-700 font-bold"
            onClick={() => setIsPermissionModalOpen(true)}
          >
            <Shield size={20} className="text-primary-600" />
            <span className="text-[11px] uppercase tracking-wider">Add Permission</span>
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-col gap-1 h-20 rounded-2xl shadow-sm border border-slate-200 text-red-600 hover:bg-red-50 font-bold"
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            <Trash2 size={20} />
            <span className="text-[11px] uppercase tracking-wider">Delete</span>
          </Button>
        </div>

        {/* Permissions Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <Users size={14} /> Permissions
            </h3>
            <span className="text-[10px] font-bold text-slate-500">{permissions.length} Groups Assigned</span>
          </div>
          
          {isPermissionsLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 bg-white rounded-xl border border-slate-100 shadow-sm animate-pulse" />
              ))}
            </div>
          ) : permissions.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-10 border-dashed bg-white/50 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                <Shield size={24} />
              </div>
              <p className="text-xs text-slate-500 font-medium tracking-tight">No group permissions defined yet.</p>
              <Button size="sm" variant="ghost" className="text-primary-600 text-[10px]" onClick={() => setIsPermissionModalOpen(true)}>
                + Click to Define Access
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {permissions.map((p) => (
                <div key={p.id} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center justify-between group animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{p.groupName || 'Unnamed Group'}</p>
                      <Badge variant={p.permissionType === 'APPROVE' ? 'success' : 'primary'} className="text-[9px] mt-0.5">
                        {p.permissionType}
                      </Badge>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPermissionIdToDelete(p.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Resource Details / Metadata */}
        <section className="space-y-4 pt-2">
          <div className="px-1 border-b border-slate-200 pb-2">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              Resource Info
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-white p-3 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Clock size={12} />
                <span className="text-[10px] font-bold uppercase tracking-tight">Lead Time</span>
              </div>
              <p className="text-xl font-black text-slate-800">{resource.minLeadTimeHours}h</p>
              <p className="text-[10px] text-slate-500 font-medium">Notice required</p>
            </Card>
            
            <Card className="bg-white p-3 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Shield size={12} />
                <span className="text-[10px] font-bold uppercase tracking-tight">Status</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={cn("w-2 h-2 rounded-full", resource.isActive ? "bg-emerald-500" : "bg-slate-300")} />
                <p className="text-sm font-bold text-slate-800 uppercase tracking-tighter">
                  {resource.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </Card>
          </div>

          <Card className="bg-white p-4 space-y-3">
             <div>
                <Label className="text-slate-400 mb-1">Description</Label>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{resource.description}</p>
             </div>
             <div>
                <Label className="text-slate-400 mb-2">Specifications</Label>
                <div className="space-y-1.5">
                   {Object.entries(resource.specs).map(([key, val]) => (
                     <div key={key} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-500">{key}</span>
                        <span className="font-black text-slate-800">{val as string}</span>
                     </div>
                   ))}
                </div>
             </div>
          </Card>
        </section>
      </div>
 
      <AddPermissionModal 
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        resourceId={resource.id}
      />


      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Resource"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <strong>{resource.name}</strong>? This action cannot be undone and will remove all associated permissions and bookings.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
 
      <Modal
        isOpen={!!permissionIdToDelete}
        onClose={() => setPermissionIdToDelete(null)}
        title="Remove Permission"
      >
        <div className="space-y-6 py-2 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <Trash2 size={32} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Confirm Removal</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
              Are you sure you want to remove this group's access? This action will take effect immediately.
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
                variant="ghost" 
                className="flex-1" 
                onClick={() => setPermissionIdToDelete(null)}
                disabled={isDeletingPermission}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              className="flex-1" 
              onClick={handleDeletePermission}
              isLoading={isDeletingPermission}
              disabled={isDeletingPermission}
            >
              Remove
            </Button>
          </div>
          {deletePermissionError && (
              <p className="mt-2 text-xs text-red-500 font-medium bg-red-50 p-2 rounded border border-red-100 animate-in fade-in">
                  {deletePermissionError}
              </p>
          )}
        </div>
      </Modal>
    </div>
  );
};
