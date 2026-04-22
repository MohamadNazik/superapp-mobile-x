import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  Trash2,
  UserPlus,
  Search,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button, Input, Label, Card, Modal } from "../../../../components/UI";
import { useGroup } from "../../../group/context";
import { useUser } from "../../context";
import { Group, GroupMember } from "../../../group/types";
import { toTitleCase } from "../../../../utils/format";

interface GroupDetailsViewProps {
  group: Group;
  onClose: () => void;
}

export const GroupDetailsView = ({ group, onClose }: GroupDetailsViewProps) => {
  const {
    updateGroup,
    deleteGroup,
    getGroupMembers,
    addUsersToGroup,
    removeUserFromGroup,
    error: groupError,
  } = useGroup();
  const { allUsers } = useUser();

  // ─── Edit State ───
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [editDescription, setEditDescription] = useState(group.description);
  const [isUpdating, setIsUpdating] = useState(false);

  // ─── Members State ───
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // ─── Assign Users Modal ───
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addUserSearch, setAddUserSearch] = useState("");
  const [selectedNewUserIds, setSelectedNewUserIds] = useState<string[]>([]);
  const [isAddingUsers, setIsAddingUsers] = useState(false);

  // ─── Delete State ───
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsMembersLoading(true);
    const result = await getGroupMembers(group.id);
    setMembers(result);
    setIsMembersLoading(false);
  }, [group.id, getGroupMembers]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // ─── Handlers ───

  const handleSaveEdit = async () => {
    if (!editName.trim() || isUpdating) return;
    setIsUpdating(true);
    try {
      const success = await updateGroup(group.id, {
        name: editName,
        description: editDescription,
      });
      if (success) setIsEditing(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(group.name);
    setEditDescription(group.description);
  };

  const handleRemoveUser = async (userId: string) => {
    setRemovingUserId(userId);
    try {
      const result = await removeUserFromGroup(group.id, userId);
      if (result) {
        setMembers((prev) => prev.filter((m) => m.id !== userId));
      }
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleAddUsers = async () => {
    if (selectedNewUserIds.length === 0 || isAddingUsers) return;
    setIsAddingUsers(true);
    try {
      const result = await addUsersToGroup(group.id, selectedNewUserIds);
      if (result) {
        await fetchMembers();
        setIsAddUserModalOpen(false);
        setSelectedNewUserIds([]);
        setAddUserSearch("");
      }
    } finally {
      setIsAddingUsers(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const success = await deleteGroup(group.id);
      if (success) onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleNewUser = (userId: string) => {
    setSelectedNewUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  // Filter all users excluding those already members
  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);

  const availableUsers = useMemo(() => {
    const query = addUserSearch.toLowerCase();
    return allUsers.filter(
      (u) =>
        !memberIds.has(u.id) &&
        u.role !== "ADMIN" &&
        u.email.toLowerCase().includes(query),
    );
  }, [allUsers, memberIds, addUserSearch]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-3 shrink-0 shadow-sm">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-slate-900">
            {toTitleCase(group.name)}
          </h2>
          <p className="text-xs text-slate-500">Group Details</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => {
              setEditName(group.name);
              setEditDescription(group.description);
              setIsEditing(true);
            }}
            className="p-2 rounded-full hover:bg-primary-50 text-primary-600 transition-colors"
            title="Edit Details"
          >
            <Edit2 size={18} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* Error Banner */}
        {groupError && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {groupError}
          </div>
        )}

        {/* Group Info Section */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 px-1 tracking-wide border-b border-slate-200 pb-2">
            Group Information
          </h3>

          {isEditing ? (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <Label required>Group Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSaveEdit}
                  isLoading={isUpdating}
                  disabled={!editName.trim()}
                >
                  <Save size={16} className="mr-2" /> Save
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                >
                  <X size={16} className="mr-2" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Card className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Name
                </span>
                <p className="text-sm font-semibold text-slate-900">
                  {toTitleCase(group.name)}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Description
                </span>
                <p className="text-sm text-slate-700">
                  {group.description || "No description provided."}
                </p>
              </div>
            </Card>
          )}
        </section>

        {/* Members Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold uppercase text-slate-400 px-1 tracking-wide">
              Assigned Users
              <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-semibold normal-case">
                {members.length}
              </span>
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsAddUserModalOpen(true)}
              className="h-6 text-primary-600"
            >
              <UserPlus size={14} className="mr-1" /> Assign Users
            </Button>
          </div>

          {isMembersLoading ? (
            <p className="text-xs text-slate-400 italic p-4 text-center">
              Loading members...
            </p>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">
                No users assigned to this group yet.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => setIsAddUserModalOpen(true)}
              >
                <UserPlus size={14} className="mr-2" /> Assign Users
              </Button>
            </div>
          ) : (
            <div className="space-y-1 rounded-lg border border-slate-200 bg-white overflow-hidden">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {member.email}
                    </p>
                    <p className="text-[10px] text-slate-400">{member.name}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveUser(member.id)}
                    disabled={removingUserId === member.id}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                    title="Remove from group"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className="space-y-4 pt-4">
          <h3 className="text-xs font-bold uppercase text-red-400 px-1 tracking-wide border-b border-red-100 pb-2">
            Danger Zone
          </h3>
          <Button
            variant="danger"
            className="w-full"
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            <Trash2 size={16} className="mr-2" /> Delete Group
          </Button>
        </section>
      </div>

      {/* ── Assign Users Modal ── */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => {
          setIsAddUserModalOpen(false);
          setSelectedNewUserIds([]);
          setAddUserSearch("");
        }}
        title="Assign Users to Group"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              placeholder="Search users..."
              value={addUserSearch}
              onChange={(e) => setAddUserSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="space-y-1 max-h-[40vh] overflow-y-auto rounded-lg border border-slate-200">
            {availableUsers.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 text-center">
                No available users to add.
              </p>
            ) : (
              availableUsers.map((user) => {
                const isSelected = selectedNewUserIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleNewUser(user.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-50 last:border-b-0 ${
                      isSelected ? "bg-primary-50" : "hover:bg-slate-50"
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare
                        size={18}
                        className="text-primary-600 shrink-0"
                      />
                    ) : (
                      <Square size={18} className="text-slate-300 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {user.email}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleAddUsers}
            isLoading={isAddingUsers}
            disabled={selectedNewUserIds.length === 0}
          >
            Assign {selectedNewUserIds.length} User
            {selectedNewUserIds.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Group"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{" "}
            <strong>{toTitleCase(group.name)}</strong>? This will remove all
            user assignments and cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
