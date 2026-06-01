/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { createIndexedDBStorage } from '@/lib/zustand-indexeddb-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
  image?: {
    url: string;
    title?: string;
    link?: string;
    width?: number;
    height?: number;
  };
}

export interface RSSFeed {
  url: string;
  title: string;
  items: RSSItem[];
  lastFetched: number;
  error?: string;
}

export interface RSSCache {
  [url: string]: RSSFeed;
}

interface RSSStore {
  feeds: RSSCache;
  customFeeds: { [url: string]: string }; // url -> name mapping
  feedColors: { [url: string]: string }; // url -> color mapping
  selectedFeeds: string[]; // Array of selected feed URLs
  lastAutoRefresh: number; // Timestamp of last automatic refresh on load
  fetchFeed: (url: string, forceRefresh?: boolean) => Promise<void>;
  addCustomFeed: (url: string, name: string, color?: string) => void;
  removeCustomFeed: (url: string) => void;
  setSelectedFeeds: (urls: string[]) => void;
  setFeedColor: (url: string, color: string) => void;
  clearCache: () => void;
}

// Predefined RSS feeds (placeholders for now)
export const PREDEFINED_RSS_FEEDS = [
  {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
  },
  {
    name: 'Cointelegraph',
    url: 'https://cointelegraph.com/rss',
  },
  {
    name: 'Decrypt',
    url: 'https://decrypt.co/feed',
  },
  {
    name: 'The Block',
    url: 'https://www.theblock.co/rss.xml',
  },
  {
    name: 'Bitcoin Magazine',
    url: 'https://bitcoinmagazine.com/.rss/full/',
  },
];

// Cache expiration time (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000;

// Helper to parse RSS XML
async function parseRSS(xml: string, url: string): Promise<RSSFeed> {
  // Validate that the response is XML, not HTML (error from proxy)
  if (
    !xml ||
    xml.trim().startsWith('<html') ||
    xml.trim().startsWith('<!DOCTYPE')
  ) {
    throw new Error('Proxy returned HTML instead of RSS feed');
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, 'application/xml');

  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    console.error('XML Parse Error:', parseError.textContent);
    throw new Error('Failed to parse RSS feed: Invalid XML format');
  }

  const channel = xmlDoc.querySelector('channel');
  if (!channel) {
    throw new Error('Invalid RSS feed format: No channel found');
  }

  const feedTitle =
    channel.querySelector('title')?.textContent || 'Untitled Feed';
  const items = Array.from(xmlDoc.querySelectorAll('item')).map((item) => {
    // Properly query for namespaced content:encoded element
    let description =
      item.querySelector('description')?.textContent ||
      item.querySelector('[content]')?.textContent ||
      '';

    // If description is empty, try to find content:encoded using getElementsByTagName
    if (!description) {
      const contentElements = item.getElementsByTagName('content:encoded');
      if (contentElements.length > 0) {
        description = contentElements[0].textContent || '';
      }
    }

    // Extract image from various sources
    let image: RSSItem['image'] | undefined;

    // Try <image> element (standard RSS)
    const imageElement = item.querySelector('image');
    if (imageElement) {
      const imageUrl = imageElement.querySelector('url')?.textContent;
      if (imageUrl) {
        const imgTitle = imageElement.querySelector('title')?.textContent;
        const imgLink = imageElement.querySelector('link')?.textContent;
        const imgWidth = parseInt(
          imageElement.querySelector('width')?.textContent || '0'
        );
        const imgHeight = parseInt(
          imageElement.querySelector('height')?.textContent || '0'
        );

        image = { url: imageUrl };
        if (imgTitle) image.title = imgTitle;
        if (imgLink) image.link = imgLink;
        if (imgWidth) image.width = imgWidth;
        if (imgHeight) image.height = imgHeight;
      }
    }

    // Try media:thumbnail (Media RSS)
    if (!image) {
      const mediaThumbnail = item.querySelector('thumbnail, [url]');
      if (mediaThumbnail) {
        const thumbnailUrl = mediaThumbnail.getAttribute('url');
        if (thumbnailUrl) {
          const thumbWidth = parseInt(
            mediaThumbnail.getAttribute('width') || '0'
          );
          const thumbHeight = parseInt(
            mediaThumbnail.getAttribute('height') || '0'
          );

          image = { url: thumbnailUrl };
          if (thumbWidth) image.width = thumbWidth;
          if (thumbHeight) image.height = thumbHeight;
        }
      }
    }

    // Try media:content
    if (!image) {
      const mediaContent = item.querySelector(
        'content[medium="image"], content[type^="image"]'
      );
      if (mediaContent) {
        const contentUrl = mediaContent.getAttribute('url');
        if (contentUrl) {
          const contentWidth = parseInt(
            mediaContent.getAttribute('width') || '0'
          );
          const contentHeight = parseInt(
            mediaContent.getAttribute('height') || '0'
          );

          image = { url: contentUrl };
          if (contentWidth) image.width = contentWidth;
          if (contentHeight) image.height = contentHeight;
        }
      }
    }

    // Try enclosure with image type
    if (!image) {
      const enclosure = item.querySelector('enclosure[type^="image"]');
      if (enclosure) {
        const enclosureUrl = enclosure.getAttribute('url');
        if (enclosureUrl) {
          image = {
            url: enclosureUrl,
          };
        }
      }
    }

    // Try extracting from description HTML
    if (!image && description) {
      const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        image = {
          url: imgMatch[1],
        };
      }
    }

    const rssItem: RSSItem = {
      title: item.querySelector('title')?.textContent || 'Untitled',
      link: item.querySelector('link')?.textContent || '#',
      description: description,
      pubDate:
        item.querySelector('pubDate')?.textContent || new Date().toISOString(),
      guid:
        item.querySelector('guid')?.textContent ||
        item.querySelector('link')?.textContent ||
        Math.random().toString(),
    };

    if (image) {
      rssItem.image = image;
    }

    return rssItem;
  });

  return {
    url,
    title: feedTitle,
    items: items.slice(0, 20), // Limit to 20 items
    lastFetched: Date.now(),
  };
}

export const useRSSStore = create<RSSStore>()(
  persist(
    (set, get) => ({
      feeds: {},
      customFeeds: {},
      feedColors: {},
      selectedFeeds: [PREDEFINED_RSS_FEEDS[0].url],
      lastAutoRefresh: 0,

      fetchFeed: async (url: string) => {
        const { feeds } = get();
        const cached = feeds[url];

        // Use cache if it's still valid
        if (
          cached &&
          !cached.error &&
          Date.now() - cached.lastFetched < CACHE_EXPIRATION
        ) {
          return;
        }

        // List of CORS proxies to try in order
        const proxies = [
          (feedUrl: string) =>
            `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`,
          (feedUrl: string) => `https://cors.bridged.cc/${feedUrl}`,
          (feedUrl: string) =>
            `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`,
        ];

        let lastError: Error | null = null;

        for (let i = 0; i < proxies.length; i++) {
          try {
            const proxyUrl = proxies[i](url);
            const response = await fetch(proxyUrl, {
              headers: {
                Accept: 'application/xml, application/rss+xml, text/xml, */*',
              },
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseText = await response.text();

            // Validate that the response is XML, not HTML
            if (
              responseText.trim().startsWith('<html') ||
              responseText.trim().startsWith('<!DOCTYPE')
            ) {
              throw new Error('Proxy returned HTML instead of RSS feed');
            }

            let xmlContent = responseText;

            // Handle different proxy response formats
            if (proxyUrl.includes('allorigins.win')) {
              const data = JSON.parse(responseText);
              if (!data.contents) {
                throw new Error('Proxy returned no content');
              }
              xmlContent = data.contents;
            } else if (proxyUrl.includes('rss2json')) {
              const data = JSON.parse(responseText);
              if (data.status === 'error') {
                throw new Error(`RSS2JSON error: ${data.message}`);
              }
              // rss2json returns parsed data, not XML - skip to next proxy
              if (data.items) {
                throw new Error('Switching to XML-based proxy');
              }
            }

            // Validate that the content is XML
            if (!xmlContent.trim().startsWith('<')) {
              throw new Error('Response is not XML format');
            }

            const feed = await parseRSS(xmlContent, url);

            set((state) => ({
              feeds: {
                ...state.feeds,
                [url]: feed,
              },
            }));
            return; // Success, exit the loop
          } catch (error) {
            lastError =
              error instanceof Error ? error : new Error(String(error));
            console.warn(
              `Proxy ${i + 1} failed for ${url}: ${lastError.message}`
            );
            // Continue to next proxy
          }
        }

        // All proxies failed
        const errorMessage =
          lastError?.message || 'All proxies failed to fetch RSS feed';
        console.error(`Error fetching RSS feed from ${url}:`, errorMessage);
        set((state) => ({
          feeds: {
            ...state.feeds,
            [url]: {
              url,
              title: 'Error loading feed',
              items: [],
              lastFetched: Date.now(),
              error: errorMessage,
            },
          },
        }));
      },

      addCustomFeed: (url: string, name: string, color?: string) => {
        set((state) => ({
          customFeeds: {
            ...state.customFeeds,
            [url]: name,
          },
          feedColors: color
            ? {
                ...state.feedColors,
                [url]: color,
              }
            : state.feedColors,
        }));
      },

      removeCustomFeed: (url: string) => {
        set((state) => {
          const newCustomFeeds = { ...state.customFeeds };
          const newFeedColors = { ...state.feedColors };
          delete newCustomFeeds[url];
          delete newFeedColors[url];
          return {
            customFeeds: newCustomFeeds,
            feedColors: newFeedColors,
            selectedFeeds: state.selectedFeeds.filter((feed) => feed !== url),
            feeds: Object.fromEntries(
              Object.entries(state.feeds).filter(([key]) => key !== url)
            ),
          };
        });
      },

      setSelectedFeeds: (urls: string[]) => {
        set({ selectedFeeds: urls, lastAutoRefresh: Date.now() });
      },

      setFeedColor: (url: string, color: string) => {
        set((state) => ({
          feedColors: {
            ...state.feedColors,
            [url]: color,
          },
        }));
      },

      clearCache: () => {
        set({ feeds: {} });
      },
    }),
    {
      name: 'rss-storage',
      storage: createIndexedDBStorage('rss-storage'),
      partialize: (state) => ({
        customFeeds: state.customFeeds,
        feedColors: state.feedColors,
        selectedFeeds: state.selectedFeeds,
        // Don't persist feeds, only custom feed URLs and selections
      }),
    }
  )
);
