'use client';

import { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Fullscreen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  url: string;
  thumbnailUrl?: string;
  autoplay?: boolean;
  className?: string;
}

export function VideoPlayer({ url, thumbnailUrl, autoplay = false, className }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(autoplay);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState(true);

  const togglePlay = () => {
    if (!video) return;
    
    if (playing) {
      video.pause();
    } else {
      video.play();
    }
    setPlaying(!playing);
  };

  const toggleMute = () => {
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  const toggleFullscreen = () => {
    if (!video) return;
    
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ((video as any).webkitRequestFullscreen) {
      (video as any).webkitRequestFullscreen();
    } else if ((video as any).mozRequestFullScreen) {
      (video as any).mozRequestFullScreen();
    }
  };

  return (
    <div 
      className={cn("relative w-full bg-black rounded-lg overflow-hidden group", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={setVideo}
        src={url}
        poster={thumbnailUrl}
        className="w-full h-full object-contain"
        onLoadedData={() => setLoading(false)}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setLoading(false)}
      />

      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Controls Overlay */}
      {showControls && !loading && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center justify-between space-x-4">
              {/* Play/Pause Button */}
              <Button
                size="icon"
                variant="secondary"
                onClick={togglePlay}
                className="rounded-full"
              >
                {playing ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              {/* Volume Controls */}
              <Button
                size="icon"
                variant="secondary"
                onClick={toggleMute}
                className="rounded-full"
              >
                {muted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>

              {/* Fullscreen Button */}
              <Button
                size="icon"
                variant="secondary"
                onClick={toggleFullscreen}
                className="rounded-full ml-auto"
              >
                <Fullscreen className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

