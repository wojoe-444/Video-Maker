# b-roll library

Background clips for the vertical reels (dialogue explainers and similar). This folder holds only the list:
`manifest.json` names every clip with its source page and license. The clips download to the content root:

```
node tools/broll.mjs fetch          # downloads to <content root>\broll\<category>\<id>.mp4
node tools/broll.mjs list           # what is in the manifest, ticked when downloaded
```

`fetch` also writes `library.json` (resolved file, size, duration, author) and `index.html`, a page that plays
every clip so you can pick by eye. From the Claude app, set `VIDEOMAKER_HOME` to a folder outside AppData
(see CLAUDE.md). Set `PEXELS_API_KEY` (free at https://www.pexels.com/api/) so Pexels downloads go through the
official API, which also records each clip's author. Without a key, Pexels may refuse the download.

## Adding a clip

Add an entry to `clips` with `id`, `category`, `source`, `page`, `title` and `license` (a key of `licenses`).
Pexels entries need `sourceId`; any other source needs a direct `url` to the mp4. Only add sources whose license
clearly allows reuse in our videos: Pexels, Pixabay, Mixkit, CC0 / CC BY footage (record the author for CC BY
and credit them in the video description), or our own work.

## License notes

- **Pexels, Pixabay, Mixkit:** free to use and edit, no attribution required. Don't redistribute the raw clips
  (this is why they stay out of the repo), and don't use people on screen in a way that implies they endorse
  something or that misrepresents them.
- **Recognisable people:** stock releases cover normal use. Don't put words in a stock person's mouth; in the
  dialogue reels, speakers are our own characters, and stock people stay in the background.

## Gameplay (Minecraft parkour, Subway Surfers style)

- **Subway Surfers** footage belongs to SYBO. Its terms
  ([sybogames.com/terms-of-service](https://sybogames.com/terms-of-service)) grant a personal, non-commercial
  licence only and forbid publicly displaying the game or using its names. Don't use its footage, including
  "no copyright" re-uploads: an uploader can't license SYBO's game.
- **Minecraft:** the [Minecraft Usage Guidelines](https://www.minecraft.net/usage-guidelines) allow gameplay
  footage in videos, even monetised, as long as the whole video is free to view, we add enough of our own content
  (an overlay or logo alone isn't enough), it isn't full uninterrupted gameplay, and the video isn't used to
  advertise products or services unrelated to Minecraft. That fits personal explainers posted under Walter's
  name; it would not fit a company's official marketing. Record it yourself (your own account and world) rather
  than reusing someone else's upload, and add an entry with `license: "own"`.
- **Our own loops:** the safest option is rendering an original blocky parkour run or endless runner with the
  video maker. These go in the manifest as `source: "own"`.
