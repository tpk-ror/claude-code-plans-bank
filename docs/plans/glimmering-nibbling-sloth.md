# Replace Musixmatch with YouTube Captions

## Goal
Remove Musixmatch API dependency (paid) and use YouTube's free closed captions for lyrics instead.

## Current State
- Musixmatch API fetches lyrics via `server/routes/lyrics.js`
- LyricsContext syncs playback position with lyric timing
- LyricsDisplay renders lyrics with current line highlighted
- Data format: `{ time: milliseconds, text: "lyric line" }`

## Approach: YouTube Transcript/Captions

YouTube videos often have:
1. **Auto-generated captions** - Created by YouTube's speech recognition
2. **Manual captions** - Uploaded by video creator
3. **Community captions** - User-contributed subtitles

We can extract these using:
- **youtube-transcript** npm package (simplest, no API key needed)
- YouTube Data API v3 `captions` endpoint (uses existing API key)

---

## Implementation Plan

### Step 1: Install youtube-transcript package
```bash
cd server && npm install youtube-transcript
```

This package fetches transcripts without needing an API key.

### Step 2: Create YouTube Captions Route
**File:** `server/routes/captions.js` (new)

Create new endpoint:
```
GET /api/captions/:videoId
```

Returns:
```json
{
  "synced": true,
  "lines": [
    { "time": 1500, "text": "First line" },
    { "time": 3200, "text": "Second line" }
  ]
}
```

### Step 3: Replace Lyrics Route with Captions
**File:** `server/routes/lyrics.js`

- Remove all Musixmatch API code
- Replace with YouTube caption fetching
- Use youtube-transcript for all lyrics (both modes)

### Step 4: Update LyricsContext
**File:** `src/context/LyricsContext.jsx`

- In demo mode, use `youtube_video_id` from currentSong
- Call `/api/captions/:videoId` instead of `/api/lyrics/:trackId`
- Same data format, so LyricsDisplay needs no changes

### Step 5: Update Caching
**File:** `server/db/init.js`

- Add `youtube_video_id` column to `cached_lyrics` table (if not exists)
- Cache YouTube captions separately from Musixmatch lyrics

---

## Files to Modify

| File | Changes |
|------|---------|
| `server/routes/lyrics.js` | **Replace** Musixmatch with youtube-transcript |
| `server/db/init.js` | Update cached_lyrics to use youtube_video_id as key |
| `src/context/LyricsContext.jsx` | Fetch by YouTube video ID (from VideoContext) |
| `src/pages/Settings.jsx` | Remove Musixmatch API key field |

## Files to Delete (Cleanup)
- Remove Musixmatch API key references from settings

---

## Data Flow (All Modes)

```
1. User plays a song (Spotify or YouTube mode)
2. VideoContext fetches/has YouTube video ID
3. LyricsContext gets video ID from VideoContext
4. Calls: GET /api/lyrics/{youtubeVideoId}
5. Backend uses youtube-transcript package
6. Returns: { synced: true, lines: [...] }
7. LyricsContext syncs with playback position
8. LyricsDisplay renders (unchanged)
```

**Key insight**: Both Spotify and demo mode already find a YouTube video for every song. We just use that video's captions as lyrics!

---

## Notes

- YouTube auto-captions may not be perfect (speech recognition)
- Music videos often have better captions than lyric videos
- Some videos may not have captions available
- Caption timing is in seconds - convert to milliseconds
- Karaoke videos often have on-screen lyrics but no caption track
