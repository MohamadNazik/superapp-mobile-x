import React, { useState } from 'react';
import { useGroup } from '../../../group/context';
import { Group } from '../../../group/types';
import { Card, EmptyState } from '../../../../components/UI';
import { Users, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toTitleCase } from '../../../../utils/format';
import { CreateGroupView } from './CreateGroupView';
import { GroupDetailsView } from './GroupDetailsView';

export const GroupsTab = ({ onActiveFullScreen }: { onActiveFullScreen: (active: boolean) => void }) => {
  const { groups, clearError } = useGroup();
  const [isCreating, setIsCreating] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<Group | null>(null);

  // Find potentially updated group from context
  const latestGroup = viewingGroup
    ? groups.find(g => g.id === viewingGroup.id) || viewingGroup
    : null;

  return (
    <>
      {/* Full-screen overlays rendered alongside list to preserve scroll position */}
      {isCreating && (
        <CreateGroupView
          onClose={() => {
            setIsCreating(false);
            onActiveFullScreen(false);
          }}
        />
      )}
      {latestGroup && (
        <GroupDetailsView
          group={latestGroup}
          onClose={() => {
            setViewingGroup(null);
            onActiveFullScreen(false);
          }}
        />
      )}

      {/* Group List */}
      <div className="space-y-3 animate-in fade-in pb-16">
        {groups.length === 0 ? (
          <EmptyState icon={Users} message="No groups defined yet." />
        ) : (
          groups.map(g => (
            <Card
              key={g.id}
              className="p-4 flex flex-row items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors active:scale-[0.98]"
              onClick={() => {
                clearError();
                setViewingGroup(g);
                onActiveFullScreen(true);
              }}
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-slate-900 truncate" title={g.name}>
                  {toTitleCase(g.name)}
                </h4>
                {g.description && <p className="text-xs text-slate-500 mt-1 truncate" title={g.description}>{g.description}</p>}
                {g.createdAt && (
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    Created: {format(new Date(g.createdAt), 'MMM do, yyyy')}
                  </span>
                )}
              </div>
              <ChevronRight size={18} className="text-slate-300 shrink-0" />
            </Card>
          ))
        )}

      </div>

      {!isCreating && !latestGroup && (
        <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto pointer-events-none flex justify-end px-4 z-50">
          <button
            className="w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 active:scale-95 transition-all pointer-events-auto"
            onClick={() => {
              clearError();
              setIsCreating(true);
              onActiveFullScreen(true);
            }}
            title="Create New Group"
          >
            <Plus size={24} />
          </button>
        </div>
      )}
    </>
  );
};
