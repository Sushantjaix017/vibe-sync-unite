
const YOUTUBE_API_KEY = 'AIzaSyBvap_uw_CwmE4eWxjKoPgiVQZ3ioQjO4M';

interface YouTubeSearchResult {
  items?: {
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      channelTitle: string;
      description: string;
      thumbnails: {
        default: {
          url: string;
        };
      };
    };
  }[];
}

/**
 * Searches YouTube for a video matching the query and returns the video ID
 */
export const getYoutubeVideoId = async (query: string): Promise<string> => {
  try {
    console.log(`Searching YouTube for: ${query}`);
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(
        query
      )}&type=video&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API error:', errorData);
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data: YouTubeSearchResult = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.log('No YouTube results found for query:', query);
      // Return a fallback video ID if no results found
      return 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up as fallback
    }
    
    const videoId = data.items[0].id.videoId;
    console.log(`Found YouTube video ID: ${videoId} for query: ${query}`);
    return videoId;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    // Return a fallback video ID in case of error
    return 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up as fallback
  }
};
