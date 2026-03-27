import React, { useState } from 'react';
import { useResource } from '../../../resource/context';
import { Card, Button } from '../../../../components/UI';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { DynamicIcon } from '../../../../components/Icons';
import { Resource } from '../../../resource/types';
import { CreateResourceView } from '../../../resource/views/CreateResourceView';

export const ResourcesTab = ({ onActiveFullScreen }: { onActiveFullScreen: (active: boolean) => void }) => {
  const { resources, deleteResource } = useResource();
  const [isCreatingResource, setIsCreatingResource] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | undefined>(undefined);

  if (isCreatingResource || editingResource) {
    return (
      <CreateResourceView
        onClose={() => {
          setIsCreatingResource(false);
          setEditingResource(undefined);
          onActiveFullScreen(false);
        }}
        initialData={editingResource}
      />
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in">
      {resources.map(res => (
        <Card key={res.id} className="flex flex-col gap-2 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                <DynamicIcon name={res.icon} className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">{res.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase">{res.type}</span>
                  <span className="text-[10px] text-slate-400">• Lead: {res.minLeadTimeHours}h</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingResource(res);
                  onActiveFullScreen(true);
                }}
                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                title="Edit Resource"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => deleteResource(res.id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Delete Resource"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 pl-11">
            {Object.entries(res.specs).slice(0, 3).map(([key, val]) => (
              <span key={key} className="text-[9px] text-slate-500 bg-slate-50 px-1 py-0.5 rounded border border-slate-100">
                <strong>{key}:</strong> {val as string}
              </span>
            ))}
          </div>
        </Card>
      ))}

      <Button
        variant="outline"
        className="w-full border-dashed border-2 text-slate-400 hover:text-primary-600 hover:border-primary-300 h-12"
        onClick={() => {
          setIsCreatingResource(true);
          onActiveFullScreen(true);
        }}
      >
        <Plus size={16} className="mr-2" />
        Add New Resource
      </Button>
    </div>
  );
};
