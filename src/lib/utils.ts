// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Add these Google Drive utility functions
export const processGoogleDriveUrl = (url: string): string => {
  if (!url) return '';
  
  // Google Drive file ID patterns
  const patterns = [
    /id=([^&]+)/,
    /\/d\/([^\/]+)/,
    /\/file\/d\/([^\/]+)/,
    /drive\/file\/d\/([^\/]+)/,
  ];

  let fileId = '';
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      fileId = match[1];
      break;
    }
  }

  if (fileId) {
    // For images - use thumbnail
    if (url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg') || 
        url.includes('.webp') || !url.includes('.mp4')) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
    }
    // For videos - use preview
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  return url;
};

export const getVideoEmbedUrl = (url: string): string => {
  if (!url) return '';
  
  // Google Drive video
  if (url.includes('drive.google.com')) {
    const fileId = url.match(/id=([^&]+)/)?.[1] || url.match(/\/d\/([^\/]+)/)?.[1];
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }
  
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // Vimeo
  if (url.includes('vimeo.com')) {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    if (videoId) {
      return `https://player.vimeo.com/video/${videoId}`;
    }
  }

  return url;
};