import { User } from './user';

export enum ViolationStatus {
  PENDING_REVIEW = "pending_review",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export interface Message {
  id: number;
  content: string;
  created_at: string;
  sender_id: number;
  sender: User;
  violation_status: ViolationStatus;
}

export interface MessageCreate {
  content: string;
}

export interface MessageUpdate {
  content?: string;
}
