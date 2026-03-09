export interface SVG {
  id: string;
  title: string;
  content: string;
  preview: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isPublic: boolean;
  tags: string[];
}

export interface SVGFolder {
  id: string;
  name: string;
  svgs: SVG[];
  userId: string;
} 