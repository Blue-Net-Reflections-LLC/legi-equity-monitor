interface YouTubePlaylistItem {
  snippet: {
    resourceId: {
      videoId: string;
    };
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      high: {
        url: string;
        width: number;
        height: number;
      };
    };
  };
}

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

export async function getYouTubeVideos(limit = 4): Promise<YouTubeVideo[]> {
  try {
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${limit}&playlistId=${process.env.NEXT_PUBLIC_YOUTUBE_PLAYLIST_ID}&key=${process.env.YOUTUBE_API_KEY}`
    );

    if (!playlistResponse.ok) {
      throw new Error('Failed to fetch playlist items');
    }

    const playlistData = await playlistResponse.json();
    
    // Get video IDs to fetch duration
    const videoIds = playlistData.items.map((item: YouTubePlaylistItem) => item.snippet.resourceId.videoId).join(',');
    
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`
    );

    if (!videosResponse.ok) {
      throw new Error('Failed to fetch video details');
    }

    const videosData = await videosResponse.json();

    // Convert ISO 8601 duration to minutes:seconds
    function formatDuration(duration: string): string {
      const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      const hours = (match?.[1] || '').replace('H', '');
      const minutes = (match?.[2] || '').replace('M', '');
      const seconds = (match?.[3] || '').replace('S', '');
      
      let result = '';
      if (hours) result += `${hours}:`;
      if (minutes) result += `${minutes}:`;
      if (seconds) result += seconds.padStart(2, '0');
      else result += '00';
      
      return result;
    }

    return playlistData.items.map((item: YouTubePlaylistItem, index: number) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnail: {
        url: item.snippet.thumbnails.high.url,
        width: item.snippet.thumbnails.high.width,
        height: item.snippet.thumbnails.high.height,
      },
      duration: formatDuration(videosData.items[index].contentDetails.duration),
    }));
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
} 