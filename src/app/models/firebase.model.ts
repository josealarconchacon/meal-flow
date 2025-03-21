export interface FirebaseComment {
  id: string;
  text: string;
  userId: string;
  username: string;
  timestamp: string;
  likes: number;
  likedBy: string[];
  replies: FirebaseReply[];
}

export interface FirebaseReply {
  id: string;
  text: string;
  userId: string;
  username: string;
  timestamp: string;
  likes: number;
  likedBy: string[];
}
