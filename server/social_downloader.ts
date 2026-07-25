import fs from 'fs';
import path from 'path';

export interface MediaItem {
  url: string;
  type: 'video' | 'image' | 'audio';
  quality?: string;
  filename?: string;
}

export interface DownloaderResult {
  success: boolean;
  platform: 'Instagram' | 'Facebook' | 'TikTok' | 'X' | 'Pinterest' | 'Snapchat' | 'Threads' | string;
  title?: string;
  author?: string;
  medias: MediaItem[];
  errorReason?: 'invalid_url' | 'private_or_removed' | 'service_failed' | string;
  errorMessage?: string;
}

// User Agents for scraping requests
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const BOT_USER_AGENT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

// List of public Cobalt API instances for backup
const COBALT_INSTANCES = [
  'https://api.cobalt.tools',
  'https://cobalt.qil.cloud',
  'https://cobalt.sneed.network',
  'https://api.cobalt.best',
  'https://co.wuk.sh'
];

/**
 * Extracts a URL from arguments, removing enclosing angle brackets or quotes if present.
 */
export function extractUrlFromArgs(args: string[]): string {
  if (!args || args.length === 0) return '';
  const text = args.join(' ');
  const match = text.match(/https?:\/\/[^\s>"]+/i);
  if (match) {
    let clean = match[0].trim();
    clean = clean.replace(/^[<"']+|[> "']+$/g, '');
    return clean;
  }
  let first = args[0].trim().replace(/^[<"']+|[> "']+$/g, '');
  if (first && !first.startsWith('http://') && !first.startsWith('https://')) {
    first = 'https://' + first;
  }
  return first;
}

/**
 * Resolves short links or redirects (e.g. pin.it, t.co, vm.tiktok.com, fb.watch)
 */
async function resolveFinalUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': BROWSER_USER_AGENT }
    });
    if (res.url && res.url.startsWith('http')) {
      return res.url;
    }
  } catch (e) {
    // Ignore resolve error
  }
  return url;
}

/**
 * Normalizes and validates URLs for supported social media platforms.
 */
export function validatePlatformUrl(rawUrl: string, platformCommand: string): { valid: boolean; platform: string; cleanUrl: string } {
  if (!rawUrl || typeof rawUrl !== 'string') return { valid: false, platform: '', cleanUrl: '' };

  let clean = rawUrl.trim().replace(/^[<"']+|[> "']+$/g, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }

  const cmd = platformCommand.toLowerCase().replace('.', '');

  try {
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();

    if (cmd === 'insta' || cmd === 'instagram' || cmd === 'ig' || cmd === 'instadl') {
      const isIg = host.includes('instagram.com') || host.includes('instagr.am') || host.includes('instagr.com') || host.includes('ddinstagram.com') || host.includes('vxinstagram.com') || host.includes('instafix.app');
      return { valid: isIg, platform: 'Instagram', cleanUrl: clean };
    }

    if (cmd === 'fb' || cmd === 'facebook' || cmd === 'fbdl') {
      const isFb = host.includes('facebook.com') || host.includes('fb.watch') || host.includes('fb.com') || host.includes('fb.me');
      return { valid: isFb, platform: 'Facebook', cleanUrl: clean };
    }

    if (cmd === 'tt' || cmd === 'tiktok' || cmd === 'ttdl') {
      const isTt = host.includes('tiktok.com') || host.includes('douyin.com');
      return { valid: isTt, platform: 'TikTok', cleanUrl: clean };
    }

    if (cmd === 'x' || cmd === 'twitter' || cmd === 'xdl') {
      const isX = host.includes('x.com') || host.includes('twitter.com') || host.includes('fxtwitter.com') || host.includes('vxtwitter.com') || host.includes('fixupx.com') || host.includes('t.co');
      return { valid: isX, platform: 'X', cleanUrl: clean };
    }

    if (cmd === 'pinterest' || cmd === 'pin' || cmd === 'pindl') {
      const isPin = host.includes('pinterest.') || host.includes('pin.it');
      return { valid: isPin, platform: 'Pinterest', cleanUrl: clean };
    }

    if (cmd === 'snapchat' || cmd === 'snap' || cmd === 'snapdl') {
      const isSnap = host.includes('snapchat.com') || host.includes('t.snapchat.com');
      return { valid: isSnap, platform: 'Snapchat', cleanUrl: clean };
    }

    if (cmd === 'threads' || cmd === 'thread' || cmd === 'threadsdl') {
      const isThreads = host.includes('threads.net') || host.includes('threads.com') || host.includes('fixthreads.net');
      return { valid: isThreads, platform: 'Threads', cleanUrl: clean };
    }
  } catch (e) {
    return { valid: false, platform: '', cleanUrl: clean };
  }

  return { valid: false, platform: '', cleanUrl: clean };
}

/**
 * Primary multi-provider downloader engine
 */
export async function downloadSocialMedia(url: string, platformName: string): Promise<DownloaderResult> {
  // Step 1: Specialized, reliable platform providers first
  if (platformName === 'Instagram') {
    const igResult = await downloadInstagram(url);
    if (igResult.success && igResult.medias.length > 0) return igResult;
  }

  if (platformName === 'TikTok') {
    const ttResult = await downloadTikTok(url);
    if (ttResult.success && ttResult.medias.length > 0) return ttResult;
  }

  if (platformName === 'X') {
    const xResult = await downloadX(url);
    if (xResult.success && xResult.medias.length > 0) return xResult;
  }

  if (platformName === 'Pinterest') {
    const pinResult = await downloadPinterest(url);
    if (pinResult.success && pinResult.medias.length > 0) return pinResult;
  }

  if (platformName === 'Facebook') {
    const fbResult = await downloadFacebook(url);
    if (fbResult.success && fbResult.medias.length > 0) return fbResult;
  }

  if (platformName === 'Snapchat') {
    const snapResult = await downloadSnapchat(url);
    if (snapResult.success && snapResult.medias.length > 0) return snapResult;
  }

  if (platformName === 'Threads') {
    const threadResult = await downloadThreads(url);
    if (threadResult.success && threadResult.medias.length > 0) return threadResult;
  }

  // Step 2: Try Cobalt API instances
  const cobaltResult = await downloadViaCobalt(url, platformName);
  if (cobaltResult.success && cobaltResult.medias.length > 0) return cobaltResult;

  // Step 3: Generic fallback APIs (TiklyDown / SaveFrom)
  const fallbackResult = await downloadViaFallbackApis(url, platformName);
  if (fallbackResult.success && fallbackResult.medias.length > 0) return fallbackResult;

  return {
    success: false,
    platform: platformName,
    medias: [],
    errorReason: 'service_failed',
    errorMessage: 'Unable to download this content. The post may be private or removed.'
  };
}

/**
 * Dedicated Instagram Downloader
 */
async function downloadInstagram(url: string): Promise<DownloaderResult> {
  const match = url.match(/(?:p|reel|reels|tv|share\/p|share\/reel)\/([A-Za-z0-9_-]+)/i);
  const shortcode = match ? match[1] : '';

  // Method 1: Instagram Embed Page Fetch (Very reliable for public posts & reels)
  if (shortcode) {
    try {
      const embedUrl = `https://www.instagram.com/reel/${shortcode}/embed/captioned/`;
      const res = await fetch(embedUrl, {
        headers: { 'User-Agent': BROWSER_USER_AGENT }
      });

      if (res.ok) {
        const html = await res.text();
        const medias: MediaItem[] = [];

        // Check for video URL in embedded payload
        const videoMatch = html.match(/<video[^>]+src="([^"]+)"/i) ||
                           html.match(/"video_url":"([^"]+)"/i) ||
                           html.match(/"contentUrl":"([^"]+)"/i);

        if (videoMatch && videoMatch[1]) {
          const videoUrl = videoMatch[1].replace(/\\u002F/g, '/').replace(/&amp;/g, '&');
          if (videoUrl.startsWith('http')) {
            medias.push({ url: videoUrl, type: 'video', quality: 'HD' });
          }
        }

        // Check for image URL if no video found
        if (medias.length === 0) {
          const imageMatch = html.match(/<img[^>]+class="EmbeddedMediaImage"[^>]+src="([^"]+)"/i) ||
                             html.match(/"display_url":"([^"]+)"/i) ||
                             html.match(/<meta property="og:image" content="([^"]+)"/i);

          if (imageMatch && imageMatch[1]) {
            const imageUrl = imageMatch[1].replace(/\\u002F/g, '/').replace(/&amp;/g, '&');
            if (imageUrl.startsWith('http')) {
              medias.push({ url: imageUrl, type: 'image', quality: 'HD' });
            }
          }
        }

        if (medias.length > 0) {
          return {
            success: true,
            platform: 'Instagram',
            title: 'Instagram Post',
            medias
          };
        }
      }
    } catch (e) {
      // Continue
    }
  }

  // Method 2: DDInstagram / Instafix page fetch with Bot User-Agent
  if (shortcode) {
    try {
      const mirrorUrl = `https://ddinstagram.com/reel/${shortcode}`;
      const res = await fetch(mirrorUrl, {
        headers: { 'User-Agent': BOT_USER_AGENT }
      });

      if (res.ok) {
        const html = await res.text();
        const videoMatch = html.match(/<meta property="og:video" content="([^"]+)"/i) ||
                           html.match(/<meta property="og:video:secure_url" content="([^"]+)"/i);

        if (videoMatch && videoMatch[1]) {
          const videoUrl = videoMatch[1].replace(/&amp;/g, '&');
          return {
            success: true,
            platform: 'Instagram',
            title: 'Instagram Reel',
            medias: [{ url: videoUrl, type: 'video', quality: 'Best Available' }]
          };
        }

        const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        if (imageMatch && imageMatch[1]) {
          const imageUrl = imageMatch[1].replace(/&amp;/g, '&');
          return {
            success: true,
            platform: 'Instagram',
            title: 'Instagram Post',
            medias: [{ url: imageUrl, type: 'image', quality: 'Best Available' }]
          };
        }
      }
    } catch (e) {
      // Continue
    }
  }

  // Method 3: SaveFrom API
  try {
    const cleanUrl = url.split('?')[0];
    const res = await fetch(`https://api.v2.savefrom.net/dl?url=${encodeURIComponent(cleanUrl)}`, {
      headers: { 'User-Agent': BROWSER_USER_AGENT }
    });

    if (res.ok) {
      const json = await res.json();
      const medias: MediaItem[] = [];

      if (json.url && Array.isArray(json.url)) {
        for (const item of json.url) {
          if (item.url) {
            medias.push({
              url: item.url,
              type: item.ext === 'mp4' || item.url.includes('.mp4') ? 'video' : 'image',
              quality: 'Best Available'
            });
          }
        }
      } else if (json.video || json.url) {
        const itemUrl = json.video || json.url;
        if (typeof itemUrl === 'string' && itemUrl.startsWith('http')) {
          medias.push({
            url: itemUrl,
            type: itemUrl.includes('.mp4') ? 'video' : 'image',
            quality: 'Best Available'
          });
        }
      }

      if (medias.length > 0) {
        return {
          success: true,
          platform: 'Instagram',
          title: 'Instagram Media',
          medias
        };
      }
    }
  } catch (err: any) {
    // Continue
  }

  return { success: false, platform: 'Instagram', medias: [] };
}

/**
 * Dedicated TikTok Downloader
 */
async function downloadTikTok(rawUrl: string): Promise<DownloaderResult> {
  const url = await resolveFinalUrl(rawUrl);

  // Method 1: TikWM API
  try {
    const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': BROWSER_USER_AGENT }
    });
    if (response.ok) {
      const json = await response.json();
      if (json.code === 0 && json.data) {
        const data = json.data;
        const medias: MediaItem[] = [];

        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          for (const imgUrl of data.images) {
            medias.push({ url: imgUrl, type: 'image', quality: 'HD' });
          }
        } else {
          const videoUrl = data.play || data.wmplay || data.hdplay;
          if (videoUrl) {
            const fullVideoUrl = videoUrl.startsWith('http') ? videoUrl : `https://www.tikwm.com${videoUrl}`;
            medias.push({ url: fullVideoUrl, type: 'video', quality: data.hdplay ? 'HD (No Watermark)' : 'Best Available' });
          }
        }

        if (medias.length > 0) {
          return {
            success: true,
            platform: 'TikTok',
            title: data.title || 'TikTok Video',
            author: data.author?.nickname || data.author?.unique_id || 'TikTok User',
            medias
          };
        }
      }
    }
  } catch (err: any) {
    // Continue
  }

  // Method 2: TiklyDown API
  try {
    const res = await fetch(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': BROWSER_USER_AGENT }
    });
    if (res.ok) {
      const json = await res.json();
      const medias: MediaItem[] = [];
      if (json.video?.noWatermark || json.video?.watermark) {
        const vUrl = json.video.noWatermark || json.video.watermark;
        medias.push({ url: vUrl, type: 'video', quality: 'Best Available' });
      } else if (Array.isArray(json.images)) {
        for (const img of json.images) {
          if (img.url) medias.push({ url: img.url, type: 'image', quality: 'HD' });
        }
      }
      if (medias.length > 0) {
        return {
          success: true,
          platform: 'TikTok',
          title: json.title || 'TikTok Media',
          medias
        };
      }
    }
  } catch (e) {
    // Continue
  }

  // Method 3: Countik API
  try {
    const res = await fetch(`https://countik.com/api/download?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': BROWSER_USER_AGENT }
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.video_no_watermark) {
        return {
          success: true,
          platform: 'TikTok',
          title: json.title || 'TikTok Video',
          medias: [{ url: json.video_no_watermark, type: 'video', quality: 'HD' }]
        };
      }
    }
  } catch (e) {
    // Continue
  }

  return { success: false, platform: 'TikTok', medias: [] };
}

/**
 * Dedicated X / Twitter Downloader
 */
async function downloadX(rawUrl: string): Promise<DownloaderResult> {
  const url = await resolveFinalUrl(rawUrl);
  const match = url.match(/status\/(\d+)/i);
  const tweetId = match ? match[1] : '';

  if (tweetId) {
    const apiEndpoints = [
      `https://api.fxtwitter.com/status/${tweetId}`,
      `https://api.vxtwitter.com/status/${tweetId}`,
      `https://api.fixupx.com/status/${tweetId}`
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const res = await fetch(endpoint, { headers: { 'User-Agent': BROWSER_USER_AGENT } });
        if (!res.ok) continue;
        const json = await res.json();

        const tweet = json.tweet || json;
        const media = tweet.media;
        if (!media) continue;

        const medias: MediaItem[] = [];

        if (media.videos && Array.isArray(media.videos)) {
          for (const v of media.videos) {
            if (v.url) {
              medias.push({ url: v.url, type: 'video', quality: 'Best Available' });
            }
          }
        }

        if (medias.length === 0 && media.photos && Array.isArray(media.photos)) {
          for (const p of media.photos) {
            const pUrl = typeof p === 'string' ? p : p.url;
            if (pUrl) {
              medias.push({ url: pUrl, type: 'image', quality: 'Best Available' });
            }
          }
        }

        if (medias.length > 0) {
          return {
            success: true,
            platform: 'X',
            title: tweet.text || 'X (Twitter) Post',
            author: tweet.author?.name || tweet.author?.screen_name || 'X User',
            medias
          };
        }
      } catch (e) {
        // Try next
      }
    }
  }

  // Method 2: Twitsave HTML Parser
  try {
    const res = await fetch(`https://twitsave.com/info?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': BROWSER_USER_AGENT }
    });
    if (res.ok) {
      const html = await res.text();
      const matches = [...html.matchAll(/<a href="(https:\/\/twitsave\.com\/download\?file=[^"]+)"/gi)];
      if (matches.length > 0) {
        const downloadUrl = matches[0][1];
        return {
          success: true,
          platform: 'X',
          title: 'X (Twitter) Media',
          medias: [{ url: downloadUrl, type: 'video', quality: 'Best Available' }]
        };
      }
    }
  } catch (err: any) {
    // Continue
  }

  return { success: false, platform: 'X', medias: [] };
}

/**
 * Dedicated Facebook Downloader
 */
async function downloadFacebook(rawUrl: string): Promise<DownloaderResult> {
  const url = await resolveFinalUrl(rawUrl);

  // Method 1: FB Video Plugin Scraper
  try {
    const pluginUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
    const res = await fetch(pluginUrl, {
      headers: { 'User-Agent': BROWSER_USER_AGENT }
    });

    if (res.ok) {
      const html = await res.text();
      const hdMatch = html.match(/hd_src:"([^"]+)"/i) || html.match(/playable_url_quality_hd:"([^"]+)"/i);
      const sdMatch = html.match(/sd_src:"([^"]+)"/i) || html.match(/playable_url:"([^"]+)"/i) || html.match(/<meta property="og:video" content="([^"]+)"/i);

      const videoUrl = hdMatch ? hdMatch[1] : (sdMatch ? sdMatch[1] : '');
      if (videoUrl) {
        const cleanVideoUrl = videoUrl.replace(/\\u002F/g, '/').replace(/\\/g, '').replace(/&amp;/g, '&');
        return {
          success: true,
          platform: 'Facebook',
          title: 'Facebook Video',
          medias: [{ url: cleanVideoUrl, type: 'video', quality: hdMatch ? 'HD' : 'SD' }]
        };
      }
    }
  } catch (e) {
    // Continue
  }

  // Method 2: SaveFrom API
  try {
    const res = await fetch(`https://api.v2.savefrom.net/dl?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': BROWSER_USER_AGENT }
    });
    if (res.ok) {
      const json = await res.json();
      const medias: MediaItem[] = [];

      if (json.url && Array.isArray(json.url)) {
        for (const item of json.url) {
          if (item.url) {
            medias.push({
              url: item.url,
              type: 'video',
              quality: item.subname || 'Best Available'
            });
          }
        }
      } else if (json.video || json.url) {
        const itemUrl = json.video || json.url;
        if (typeof itemUrl === 'string' && itemUrl.startsWith('http')) {
          medias.push({ url: itemUrl, type: 'video', quality: 'Best Available' });
        }
      }

      if (medias.length > 0) {
        return {
          success: true,
          platform: 'Facebook',
          title: 'Facebook Video',
          medias
        };
      }
    }
  } catch (e) {
    // Continue
  }

  return { success: false, platform: 'Facebook', medias: [] };
}

/**
 * Dedicated Pinterest Downloader
 */
async function downloadPinterest(rawUrl: string): Promise<DownloaderResult> {
  const url = await resolveFinalUrl(rawUrl);

  try {
    const htmlRes = await fetch(url, { headers: { 'User-Agent': BROWSER_USER_AGENT } });
    if (htmlRes.ok) {
      const html = await htmlRes.text();

      const videoMatch = html.match(/<meta property="og:video" content="([^"]+)"/i) ||
                         html.match(/<meta name="twitter:player:stream" content="([^"]+)"/i) ||
                         html.match(/"contentUrl":"([^"]+\.mp4)"/i);

      if (videoMatch && videoMatch[1]) {
        const videoUrl = videoMatch[1].replace(/&amp;/g, '&');
        return {
          success: true,
          platform: 'Pinterest',
          title: 'Pinterest Video',
          medias: [{ url: videoUrl, type: 'video', quality: 'Best Available' }]
        };
      }

      const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i) ||
                         html.match(/<meta name="twitter:image" content="([^"]+)"/i) ||
                         html.match(/"image":"([^"]+)"/i);

      if (imageMatch && imageMatch[1]) {
        let imageUrl = imageMatch[1].replace(/&amp;/g, '&');
        // Convert thumbnail sizes to originals for full HD image
        imageUrl = imageUrl.replace(/\/(?:236x|474x|736x)\//, '/originals/');
        return {
          success: true,
          platform: 'Pinterest',
          title: 'Pinterest Image',
          medias: [{ url: imageUrl, type: 'image', quality: 'HD Originals' }]
        };
      }
    }
  } catch (err: any) {
    // Continue
  }

  return { success: false, platform: 'Pinterest', medias: [] };
}

/**
 * Dedicated Snapchat Downloader
 */
async function downloadSnapchat(rawUrl: string): Promise<DownloaderResult> {
  const url = await resolveFinalUrl(rawUrl);

  try {
    const res = await fetch(url, { headers: { 'User-Agent': BROWSER_USER_AGENT } });
    if (res.ok) {
      const html = await res.text();

      const videoMatch = html.match(/<meta property="og:video" content="([^"]+)"/i) ||
                         html.match(/<meta property="og:video:secure_url" content="([^"]+)"/i) ||
                         html.match(/https:\/\/cf-st\.sc-cdn\.net\/[^\s"']+\.mp4/i) ||
                         html.match(/"mediaUrl":"([^"]+\.mp4[^"]*)"/i);

      if (videoMatch) {
        const videoUrl = (videoMatch[1] || videoMatch[0]).replace(/\\u002F/g, '/').replace(/&amp;/g, '&');
        return {
          success: true,
          platform: 'Snapchat',
          title: 'Snapchat Spotlight',
          medias: [{ url: videoUrl, type: 'video', quality: 'Best Available' }]
        };
      }

      const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
      if (imageMatch && imageMatch[1]) {
        const imageUrl = imageMatch[1].replace(/&amp;/g, '&');
        return {
          success: true,
          platform: 'Snapchat',
          title: 'Snapchat Image',
          medias: [{ url: imageUrl, type: 'image', quality: 'Best Available' }]
        };
      }
    }
  } catch (err: any) {
    // Continue
  }

  return { success: false, platform: 'Snapchat', medias: [] };
}

/**
 * Dedicated Threads Downloader
 */
async function downloadThreads(rawUrl: string): Promise<DownloaderResult> {
  const url = await resolveFinalUrl(rawUrl);
  const match = url.match(/(?:t|post)\/([A-Za-z0-9_-]+)/i);
  const shortcode = match ? match[1] : '';

  if (shortcode) {
    try {
      const mirrorUrl = `https://fixthreads.net/t/${shortcode}`;
      const res = await fetch(mirrorUrl, { headers: { 'User-Agent': BOT_USER_AGENT } });
      if (res.ok) {
        const html = await res.text();
        const videoMatch = html.match(/<meta property="og:video" content="([^"]+)"/i) ||
                           html.match(/<meta property="og:video:secure_url" content="([^"]+)"/i);

        if (videoMatch && videoMatch[1]) {
          const videoUrl = videoMatch[1].replace(/&amp;/g, '&');
          return {
            success: true,
            platform: 'Threads',
            title: 'Threads Video',
            medias: [{ url: videoUrl, type: 'video', quality: 'Best Available' }]
          };
        }

        const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        if (imageMatch && imageMatch[1]) {
          const imageUrl = imageMatch[1].replace(/&amp;/g, '&');
          return {
            success: true,
            platform: 'Threads',
            title: 'Threads Post',
            medias: [{ url: imageUrl, type: 'image', quality: 'Best Available' }]
          };
        }
      }
    } catch (e) {
      // Continue
    }
  }

  // Direct Threads embed page fallback
  if (shortcode) {
    try {
      const embedUrl = `https://www.threads.net/embed/post/${shortcode}`;
      const res = await fetch(embedUrl, { headers: { 'User-Agent': BROWSER_USER_AGENT } });
      if (res.ok) {
        const html = await res.text();
        const videoMatch = html.match(/<video[^>]+src="([^"]+)"/i) || html.match(/"video_url":"([^"]+)"/i);
        if (videoMatch && videoMatch[1]) {
          const videoUrl = videoMatch[1].replace(/\\u002F/g, '/').replace(/&amp;/g, '&');
          return {
            success: true,
            platform: 'Threads',
            title: 'Threads Video',
            medias: [{ url: videoUrl, type: 'video', quality: 'Best Available' }]
          };
        }
      }
    } catch (e) {
      // Continue
    }
  }

  return { success: false, platform: 'Threads', medias: [] };
}

/**
 * Universal Downloader via Cobalt API
 */
async function downloadViaCobalt(url: string, platformName: string): Promise<DownloaderResult> {
  for (const instance of COBALT_INSTANCES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(`${instance}/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': BROWSER_USER_AGENT
        },
        body: JSON.stringify({ url }),
        signal: controller.signal
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (!data) continue;

      const medias: MediaItem[] = [];

      if (data.status === 'tunnel' || data.status === 'redirect') {
        if (data.url) {
          const isVideo = data.filename?.endsWith('.mp4') || data.url.includes('.mp4') || !data.filename?.endsWith('.jpg');
          medias.push({
            url: data.url,
            type: isVideo ? 'video' : 'image',
            quality: 'Best Available',
            filename: data.filename
          });
        }
      } else if (data.status === 'picker' && Array.isArray(data.picker)) {
        for (const item of data.picker) {
          if (item.url) {
            medias.push({
              url: item.url,
              type: item.type === 'photo' ? 'image' : 'video',
              quality: 'Best Available'
            });
          }
        }
      }

      if (medias.length > 0) {
        return {
          success: true,
          platform: platformName,
          title: `${platformName} Content`,
          medias
        };
      }
    } catch (err) {
      // Quiet failover
    } finally {
      clearTimeout(timeout);
    }
  }

  return { success: false, platform: platformName, medias: [] };
}

/**
 * Public Third-Party Downloader APIs fallback
 */
async function downloadViaFallbackApis(url: string, platformName: string): Promise<DownloaderResult> {
  const fallbackEndpoints = [
    `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
    `https://api.v2.savefrom.net/dl?url=${encodeURIComponent(url)}`
  ];

  for (const endpoint of fallbackEndpoints) {
    try {
      const res = await fetch(endpoint, { headers: { 'User-Agent': BROWSER_USER_AGENT } });
      if (!res.ok) continue;
      const json = await res.json();

      const medias: MediaItem[] = [];
      if (json.video || json.url || json.result?.url) {
        const mediaUrl = json.video || json.url || json.result?.url || json.result?.video;
        if (typeof mediaUrl === 'string' && mediaUrl.startsWith('http')) {
          medias.push({ url: mediaUrl, type: 'video', quality: 'Best Available' });
        }
      } else if (Array.isArray(json.images) || Array.isArray(json.photos)) {
        const photos = json.images || json.photos;
        for (const p of photos) {
          const imgUrl = typeof p === 'string' ? p : p.url;
          if (imgUrl) medias.push({ url: imgUrl, type: 'image', quality: 'Best Available' });
        }
      }

      if (medias.length > 0) {
        return {
          success: true,
          platform: platformName,
          title: json.title || `${platformName} Media`,
          author: json.author || json.author?.name || undefined,
          medias
        };
      }
    } catch (e) {
      // Ignore
    }
  }

  return { success: false, platform: platformName, medias: [] };
}

/**
 * Helper to determine mimetype from URL if server headers are absent or generic
 */
function detectMimetypeFromUrl(url: string, typeHint?: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('.mp4') || lower.includes('video/mp4') || typeHint === 'video') return 'video/mp4';
  if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'image/jpeg';
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.gif')) return 'image/gif';
  if (lower.includes('.mp3')) return 'audio/mp4';
  return typeHint === 'video' ? 'video/mp4' : 'image/jpeg';
}

/**
 * Downloads media from URL into memory buffer safely
 */
export async function fetchMediaBuffer(mediaUrl: string, timeoutMs = 45000): Promise<{ buffer: Buffer; mimetype: string } | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(mediaUrl, {
      headers: {
        'User-Agent': BROWSER_USER_AGENT,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: controller.signal
    });

    if (!res.ok) {
      // Fallback try without custom user agent
      const retryRes = await fetch(mediaUrl, { signal: controller.signal });
      if (!retryRes.ok) throw new Error(`HTTP ${retryRes.status}`);
      let mimetype = retryRes.headers.get('content-type') || '';
      if (!mimetype || mimetype.includes('text/html') || mimetype.includes('octet-stream')) {
        mimetype = detectMimetypeFromUrl(mediaUrl);
      }
      const arrayBuf = await retryRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      if (buffer.length === 0) return null;
      return { buffer, mimetype };
    }

    let mimetype = res.headers.get('content-type') || '';
    if (!mimetype || mimetype.includes('text/html') || mimetype.includes('octet-stream')) {
      mimetype = detectMimetypeFromUrl(mediaUrl);
    }
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    if (buffer.length === 0) return null;

    return { buffer, mimetype };
  } catch (err: any) {
    console.error('[fetchMediaBuffer] Error downloading media buffer:', err.message || err);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generates the standardized premium caption specified by user requirements
 */
export function buildDownloaderCaption(platform: string, mediaType: string, quality = 'Best Available'): string {
  const formattedType = mediaType === 'video' ? 'Video' : (mediaType === 'image' ? 'Image' : 'Media');
  return `╔════════════════════╗
📥 Hijjaze Downloader

📱 Platform: ${platform}
📦 Media: ${formattedType}
⚡ Quality: ${quality}

🤖 Downloaded by Hijjaze Bot
╚════════════════════╝`;
}
