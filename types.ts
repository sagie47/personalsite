import { ReactNode } from "react";

export interface BlogPost {
  id: number;
  title: string;
  date: string;
  content: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  techStack: string[];
  year: string;
  link?: string;
  isFeatured?: boolean;
}

export interface Book {
    id: number;
    title: string;
    author: string;
    year: string;
    rating: number; // 1-5
    thoughts: string;
    color: string;
    spineColor: string;
    height: string; // h- class
    width: string;  // w- class
    coverPrompt?: string;
    coverImage?: string;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output';
  content: ReactNode;
}

export type CommandHandler = (args: string[]) => TerminalLine[];