import { User } from './user';
import { Message } from './message';

export interface Chat {
  id: number;
  title: string | null;
  created_at: string;
  participants: User[];
  messages: Message[];
}

export interface ChatCreate {
  title?: string;
  participant_ids: number[];
}

export interface ChatUpdate {
  title?: string;
  participant_ids?: number[];
}
