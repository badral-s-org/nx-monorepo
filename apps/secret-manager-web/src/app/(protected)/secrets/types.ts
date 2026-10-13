export interface Secret {
  id: number;
  groupId: number;
  key: string;
  secret: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecretGroup {
  id: number;
  name: string;
  secrets: Secret[];
}
