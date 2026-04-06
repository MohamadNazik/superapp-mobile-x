import React, { useState, useEffect } from 'react';
import { Modal, Button, CustomSelect, Label } from '../../../../components/UI';
import { useGroup } from '../../../group/context';
import { useResource } from '../../../resource/context';
import { PermissionType } from '../../../resource/types';
import { CheckSquare, Square } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface AddPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
}

export const AddPermissionModal = ({ isOpen, onClose, resourceId }: AddPermissionModalProps) => {
  const { groups } = useGroup();
  const { addPermissionsToResource } = useResource();
  
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<PermissionType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
 
  useEffect(() => {
    if (!isOpen) {
      setSelectedGroupId('');
      setSelectedTypes([]);
      setError(null);
      setConflictModalOpen(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const togglePermissionType = (type: PermissionType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  const handleSubmit = async () => {
    if (!selectedGroupId || selectedTypes.length === 0) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await addPermissionsToResource(resourceId, selectedGroupId, selectedTypes);
      handleClose();
    } catch (err: any) {
      const isConflict = err.status === 409 || 
                        err.error?.toLowerCase().includes('already exists') ||
                        err.message?.toLowerCase().includes('already exists');

      if (isConflict) {
        setConflictModalOpen(true);
      } else {
        setError(err.error || err.message || 'Failed to add permissions');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Permission">
      <div className="space-y-6 py-2">
        {/* Group Selection */}
        <div>
          <Label required>Select Group</Label>
          <CustomSelect
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            disabled={isSubmitting}
            placeholder="Choose a group..."
            options={groups.map(group => ({ value: group.id, label: group.name }))}
          />
        </div>

        {/* Permission Types Checkboxes */}
        <div className="space-y-3">
          <Label required>Permission Types</Label>
          <div className="grid grid-cols-1 gap-2">
            {[PermissionType.REQUEST, PermissionType.APPROVE].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => togglePermissionType(type)}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                  selectedTypes.includes(type) 
                    ? "bg-primary-50 border-primary-200 text-primary-900" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold capitalize">{type.toLowerCase()}</span>
                  <span className="text-[10px] opacity-70">
                    {type === PermissionType.REQUEST ? 'Allowed to book this resource.' : 'Allowed to approve/reject bookings.'}
                  </span>
                </div>
                {selectedTypes.includes(type) ? (
                  <CheckSquare size={18} className="text-primary-600" />
                ) : (
                  <Square size={18} className="text-slate-300" />
                )}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded border border-red-100 animate-in fade-in">
            {error}
          </p>
        )}

        <div className="pt-2 flex gap-3">
          <Button 
            variant="ghost" 
            className="flex-1" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            className="flex-[2]" 
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!selectedGroupId || selectedTypes.length === 0}
          >
            Assign Permissions
          </Button>
        </div>
      </div>
      <Modal 
        isOpen={conflictModalOpen} 
        onClose={() => setConflictModalOpen(false)} 
        title="Permission Already Assigned"
      >
        <div className="space-y-4 py-2 text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <CheckSquare size={24} />
          </div>
          <p className="text-sm text-slate-600">
            This group already has the selected permissions for this resource.
          </p>
          <Button className="w-full" onClick={handleClose}>
            OK
          </Button>
        </div>
      </Modal>
    </Modal>
  );
};