/*
 * This file implements a multi-video player that allows users to:
 * - Drag and drop multiple video files
 * - Play all videos simultaneously on loop with audio
 * - Control global and individual video volume
 * - Pure black and white UI with videos in original colors
 * - Play/pause all videos at once
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export default function VideoPlayerPage() {
  const [videos, setVideos] = useState<{ id: string; url: string }[]>([]);
  const [globalVolume, setGlobalVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  
  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add("bg-white/10");
    }
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("bg-white/10");
    }
  }, []);
  
  // Process dropped files
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("bg-white/10");
    }
    
    const files = Array.from(e.dataTransfer.files);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    // Create URLs for each video file
    const newVideos = videoFiles.map(file => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file)
    }));
    
    setVideos(prev => [...prev, ...newVideos]);
  }, []);
  
  // Update video volume when global volume changes
  useEffect(() => {
    videoRefs.current.forEach(video => {
      video.volume = globalVolume;
      video.muted = isMuted;
    });
  }, [globalVolume, isMuted]);
  
  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      videos.forEach(video => URL.revokeObjectURL(video.url));
    };
  }, [videos]);
  
  // Set video ref when video element is mounted
  const setVideoRef = useCallback((element: HTMLVideoElement | null, id: string) => {
    if (element) {
      element.volume = globalVolume;
      element.muted = isMuted;
      videoRefs.current.set(id, element);
    } else {
      videoRefs.current.delete(id);
    }
  }, [globalVolume, isMuted]);
  
  // Remove a video from the grid
  const removeVideo = useCallback((id: string) => {
    setVideos(prev => {
      const video = prev.find(v => v.id === id);
      if (video) {
        URL.revokeObjectURL(video.url);
      }
      return prev.filter(v => v.id !== id);
    });
    videoRefs.current.delete(id);
  }, []);
  
  // Clear all videos
  const clearAllVideos = useCallback(() => {
    videos.forEach(video => URL.revokeObjectURL(video.url));
    setVideos([]);
    videoRefs.current.clear();
  }, []);
  
  // Toggle mute for all videos
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);
  
  // Toggle play/pause for all videos
  const togglePlayPause = useCallback(() => {
    videoRefs.current.forEach(video => {
      if (isPlaying) {
        video.pause();
      } else {
        video.play().catch(error => {
          console.error("Error playing video:", error);
        });
      }
    });
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  return (
    <main className="flex min-h-screen flex-col items-center bg-black p-4 text-white">
      <h1 className="mb-6 text-5xl font-bold" style={{
        textShadow: '3px 3px 0 rgba(255,255,255,0.1)',
        fontFamily: 'monospace',
        borderBottom: '2px solid white',
        paddingBottom: '0.5rem',
      }}>videos</h1>
      
      <div className="mb-8 flex flex-wrap items-center justify-center gap-6">
        <button 
          onClick={clearAllVideos}
          className="border-2 border-white bg-transparent px-5 py-2 font-mono text-sm uppercase tracking-wider hover:bg-white hover:text-black"
          disabled={videos.length === 0}
          style={{
            boxShadow: '4px 4px 0 rgba(255,255,255,0.8)',
            transition: 'all 0.2s ease',
          }}
        >
          Clear All
        </button>
        
        <button
          onClick={togglePlayPause}
          className="border-2 border-white bg-transparent px-5 py-2 font-mono text-sm uppercase tracking-wider hover:bg-white hover:text-black"
          disabled={videos.length === 0}
          style={{
            boxShadow: '4px 4px 0 rgba(255,255,255,0.8)',
            transition: 'all 0.2s ease',
          }}
        >
          {isPlaying ? "Pause All" : "Play All"}
        </button>
        
        <button
          onClick={toggleMute}
          className="border-2 border-white bg-transparent px-5 py-2 font-mono text-sm uppercase tracking-wider hover:bg-white hover:text-black"
          disabled={videos.length === 0}
          style={{
            boxShadow: '4px 4px 0 rgba(255,255,255,0.8)',
            transition: 'all 0.2s ease',
          }}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>
        
        <div className="flex items-center gap-3 border-2 border-white p-3" style={{
          boxShadow: '4px 4px 0 rgba(255,255,255,0.8)',
        }}>
          <span className="font-mono text-xs uppercase">Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={globalVolume}
            onChange={(e) => setGlobalVolume(parseFloat(e.target.value))}
            className="w-24"
            style={{
              WebkitAppearance: 'none',
              appearance: 'none',
              height: '2px',
              background: 'white',
            }}
          />
          <span className="font-mono text-xs">{Math.round(globalVolume * 100)}%</span>
        </div>
      </div>
      
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="mb-10 flex w-full max-w-4xl flex-1 flex-col items-center justify-center border-2 border-dashed border-white p-8"
        style={{
          minHeight: videos.length === 0 ? '300px' : '120px',
          boxShadow: '8px 8px 0 rgba(255,255,255,0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        {videos.length === 0 ? (
          <div className="text-center">
            <p className="mb-3 font-mono text-xl uppercase tracking-wider">Drop Video Files Here</p>
            <p className="font-mono text-xs text-white/70">MP4, WebM, MOV</p>
          </div>
        ) : (
          <p className="font-mono text-xs uppercase tracking-wider">Drop More Videos</p>
        )}
      </div>
      
      {videos.length > 0 && (
        <div className="grid w-full max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {videos.map(video => (
            <div 
              key={video.id} 
              className="relative border-4 border-white bg-transparent p-0"
              style={{
                boxShadow: '8px 8px 0 rgba(255,255,255,0.5)',
              }}
            >
              <video
                ref={(el) => setVideoRef(el, video.id)}
                src={video.url}
                autoPlay
                loop
                controls
                className="h-auto w-full"
                title="Video player"
                style={{ 
                  background: 'black',
                }}
              />
              <button
                onClick={() => removeVideo(video.id)}
                className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center border-2 border-white bg-black font-bold text-white hover:bg-white hover:text-black"
                aria-label="Remove video"
                style={{
                  fontFamily: 'monospace',
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
