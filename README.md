# Hide Default Lyrics

A [Spicetify](https://spicetify.app) extension for people who use [Spicy Lyrics](https://github.com/Spikerko/spicy-lyrics):
it keeps Spotify's own lyrics out of the way while Spicy Lyrics has the song's lyrics, and hides Spicy Lyrics' buttons
when it has none.

| Situation | What you see |
|---|---|
| Spicy Lyrics has the lyrics | Spotify's lyrics button and the Now Playing lyrics preview are hidden |
| Spicy Lyrics has none, Spotify does | Spicy Lyrics' playbar buttons and card are hidden; Spotify's lyrics stay |
| Neither has any | Both are hidden (Spotify disables its own button when it has none) |
| Spicy Lyrics isn't installed | Nothing changes |

## Install

1. Copy `hideDefaultLyrics.js` into your Spicetify `Extensions` folder (`spicetify path userdata` prints its parent;
   on Linux and macOS it is `~/.config/spicetify/Extensions`).
2. Enable it and apply:

   ```sh
   spicetify config extensions hideDefaultLyrics.js
   spicetify apply
   ```

   If you already use other extensions, separate them with `|`:
   `spicetify config extensions "other.js|hideDefaultLyrics.js"`.

To remove it, take `hideDefaultLyrics.js` out of that list and apply again.

## How it works

It can't be a CSS snippet: Spicy Lyrics sets `display: inline-block !important` on its buttons inline, which a
stylesheet can't override, and CSS has no way to tell whether a song has lyrics.

- **Spicy Lyrics** keeps the lyrics it found in the browser's Cache API (`SpicyLyrics_LyricsStore*`) and stores nothing
  for songs it found none for. A cached entry for the current track means it has lyrics. After a song change it gets
  8 seconds to look before "none" is called; until then Spotify's lyrics stay hidden so nothing flickers.
- **Spotify** disables its lyrics button when it has no lyrics for the song.

The extension sets `data-hdl-spicy="yes|no|pending"` on `<html>` and a small stylesheet does the rest.

## Caveats

- It relies on Spicy Lyrics' cache name. If a Spicy Lyrics update renames it, the extension will call every song
  "no lyrics" and hide Spicy Lyrics' buttons. Open an issue if that happens.
- Episodes and local files count as "no lyrics".
- Tested on Linux with Spotify 1.3.4.258, Spicetify 2.46.4 and the LiquidMusic theme.

## License

MIT
