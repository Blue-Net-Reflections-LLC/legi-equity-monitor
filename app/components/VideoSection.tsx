'use client';

import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import { Play, Video } from 'lucide-react';
import { useState } from 'react';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  duration: string;
}

interface VideoSectionProps {
  videos: YouTubeVideo[];
}

export function VideoSection({ videos }: VideoSectionProps) {
  const [featuredVideo, ...otherVideos] = videos;
  const [currentVideo, setCurrentVideo] = useState(featuredVideo);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleVideoSelect = (video: YouTubeVideo) => {
    setCurrentVideo(video);
    setIsPlaying(true);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  return (
    <section className="relative py-12 px-4 bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded bg-purple-500/10 px-6 py-3 text-lg font-semibold text-purple-400 mb-8 uppercase tracking-wide">
          <Video className="w-5 h-5" />
          Video
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Featured Video */}
          <div className="lg:col-span-3">
            <div className="relative">
              {isPlaying ? (
                <div className="relative aspect-video w-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1`}
                    title={currentVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full rounded-sm"
                  />
                </div>
              ) : (
                <button 
                  onClick={() => handleVideoSelect(currentVideo)}
                  className="group block w-full"
                >
                  <div className="relative aspect-video overflow-hidden rounded-sm mb-6">
                    <Image
                      src={currentVideo.thumbnail.url}
                      alt={currentVideo.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-12 h-12 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3 leading-tight mt-6">
              {currentVideo.title}
            </h2>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <time>{formatDate(currentVideo.publishedAt)}</time>
              <span>•</span>
              <span>{currentVideo.duration}</span>
            </div>
          </div>

          {/* Watch Next Section */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-white mb-8 lg:block hidden">
              WATCH NEXT
            </h3>
            {/* Mobile Watch Next Header */}
            <div className="lg:hidden flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">WATCH NEXT</h3>
              <div className="text-xs text-zinc-400">Swipe for more</div>
            </div>
            {/* Mobile Horizontal Scroll / Desktop Vertical Stack */}
            <div className="lg:space-y-14 flex lg:block gap-4 overflow-x-auto touch-pan-x pb-4 lg:pb-0 -mx-4 lg:mx-0 px-4 lg:px-0 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:bg-zinc-700">
              {[featuredVideo, ...otherVideos].map((video) => (
                <button
                  key={video.id}
                  onClick={() => handleVideoSelect(video)}
                  className="group flex-shrink-0 lg:flex-shrink block w-72 lg:w-full text-left"
                >
                  <div className="lg:grid lg:grid-cols-12 lg:gap-4">
                    <div className="lg:col-span-7 mb-3 lg:mb-0">
                      <div className="relative aspect-video overflow-hidden rounded-sm">
                        <Image
                          src={video.thumbnail.url}
                          alt={video.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                        {isPlaying && currentVideo.id === video.id ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <div className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-sm">
                              <span className="text-xs font-medium text-white">NOW PLAYING</span>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Play className="w-6 h-6 text-white fill-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="lg:col-span-5">
                      <h4 className="text-sm font-medium text-white group-hover:text-zinc-300 transition-colors mb-2 leading-tight line-clamp-2">
                        {video.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <time>{formatDate(video.publishedAt)}</time>
                        <span>•</span>
                        <span>{video.duration}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 