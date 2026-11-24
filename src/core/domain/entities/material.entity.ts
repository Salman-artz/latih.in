export type ContentStatus = "DRAFT" | "PUBLISHED";

export interface MaterialEntity {
  id: string;
  title: string;
  description: string;
  youtubeId?: string | null;
  videoType?: string;
  videoUrl?: string | null;
  order: number;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialWithProgress extends MaterialEntity {
  isCompleted: boolean;
  watchedAt: Date | null;
}
