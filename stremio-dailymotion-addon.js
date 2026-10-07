// stremio-dailymotion-addon.js
// Simple Stremio add-on that exposes Dailymotion public videos using Dailymotion's Platform API

const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const fetch = require('node-fetch');

const manifest = {
  id: 'org.gabriel.dailymotion',
  version: '1.0.0',
  name: 'Dailymotion (Unofficial)',
  description: 'Search Dailymotion and expose public videos as a Stremio catalog + streams (unofficial).',
  resources: ['catalog', 'stream', 'meta'],
  types: ['movie', 'series', 'episode'],
  idPrefixes: ['dm:'],
catalogs: [
  {
    type: 'movie',
    id: 'dailymotion_movies',
    name: 'Dailymotion — Movies',
    extra: [{ name: 'search', isRequired: false }]
  },
  {
    type: 'series',
    id: 'dailymotion_series',
    name: 'Dailymotion — Series/Shows',
    extra: [{ name: 'search', isRequired: false }]
  }
],
  contactEmail: 'you@example.com',
  links: { homepage: 'https://github.com' }
};

const builder = new addonBuilder(manifest);

async function searchDailymotion(q, limit = 25, page = 1) {
  const fields = ['id', 'title', 'duration', 'thumbnail_url', 'url', 'description'].join(',');
  const params = new URLSearchParams({
    search: q,
    fields,
    limit: String(limit),
    page: String(page)
  });
  const res = await fetch(`https://api.dailymotion.com/videos?${params.toString()}`);
  if (!res.ok) throw new Error(`Dailymotion API error: ${res.status}`);
  const body = await res.json();
  return body;
}

builder.defineStreamHandler(async ({ type, id }) => {
  console.log(`STREAM REQUEST: type=${type}, id=${id}`);

  try {
    const vid = id.replace(/^dm:/, '');

    console.log(`Dailymotion video ID: ${vid}`);

    const embedUrl = `https://www.dailymotion.com/embed/video/${vid}`;

    console.log(`Returning stream URL: ${embedUrl}`);

    return {
      streams: [
        {
          title: 'Dailymotion',
          url: embedUrl,
          isFree: true
        }
      ]
    };

  } catch (err) {
    console.error('STREAM ERROR:', err);
    return { streams: [] };
  }
});

  } catch (err) {
    console.error('STREAM ERROR:', err);
    return { streams: [] };
  }
});

builder.defineMetaHandler(async ({ type, id }) => {
  try {
    const vid = id.replace(/^dm:/, '');
    const res = await fetch(`https://api.dailymotion.com/video/${vid}?fields=id,title,duration,thumbnail_url,description,url`);
    if (!res.ok) return { meta: {} };
    const v = await res.json();
    return {
      meta: {
        id: `dm:${v.id}`,
        type: type || 'movie',
        name: v.title,
        poster: v.thumbnail_url,
        description: v.description,
        runtime: v.duration
      }
    };
  } catch (err) {
    console.error('Meta error', err);
    return { meta: {} };
  }
});


const port = process.env.PORT || 7000;

serveHTTP(builder.getInterface(), { port });
