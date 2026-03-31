export interface Group {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAndUpdateGroupPayload {
  name: string;
  description: string;
  userIds?: string[];
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
}

export interface AddUsersToGroupResult {
  group_id: string;
  added_users: { user_id: string }[];
}

export interface RemoveUserFromGroupResult {
  group_id: string;
  user_id: string;
}
