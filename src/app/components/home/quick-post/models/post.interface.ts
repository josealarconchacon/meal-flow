export interface Post {
  id: string;
  content: string;
  timestamp: Date;
  images?: string[];
  video?: {
    url: string;
    type: string;
  };
  user: {
    displayName: string;
    photoURL: string;
  };
}
