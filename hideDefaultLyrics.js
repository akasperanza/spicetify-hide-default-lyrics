// @ts-check
// Hide Spotify's own lyrics while Spicy Lyrics has the song's lyrics; hide Spicy Lyrics' buttons when it has none.
//
//   Spicy has lyrics  -> Spotify's lyrics button and Now Playing lyrics preview are hidden
//   Spicy has none    -> Spicy's playbar buttons are hidden; Spotify's lyrics stay, if Spotify has any
//   neither has any   -> both are hidden (Spotify disables its button when it has none)
//
// Spicy Lyrics keeps the lyrics it found in the Cache API and stores nothing for songs it found none for, so a
// cached entry for the current track means it has lyrics. When it finds none, its Now Playing card shows a loading
// skeleton and then removes itself: that is taken as "none" right away. With the card never showing (Now Playing panel
// closed) Spicy gets a few seconds to look before "none" is called.

(function hideDefaultLyrics() {
	if (!Spicetify?.Player?.data) {
		setTimeout(hideDefaultLyrics, 300);
		return;
	}

	const GRACE_MS = 3000; // no Now Playing card to watch: how long Spicy gets to find lyrics
	const CARD_GONE_MS = 1000; // the card is rebuilt for the next song within this long: not "gone" before that
	const SPICY_BUTTONS = ["SpicyLyrics_PageButton", "SpicyLyrics_PopupLyricsButton", "SpicyLyrics_FullscreenButton"];
	const spicyButtons = SPICY_BUTTONS.map((id) => `#${id}`).join(", ");
	const spotifyButton = `[data-testid="lyrics-button"]:not(:has(#SpicyLyricsPageSvg))`;

	// Spicy sets display on its buttons inline, with !important, which a stylesheet cannot beat: they leave the layout instead
	const style = document.createElement("style");
	style.id = "hide-default-lyrics";
	style.textContent = `
		html[data-hdl-spicy="yes"] ${spotifyButton},
		html[data-hdl-spicy="pending"] ${spotifyButton},
		html[data-hdl-spicy="no"] ${spotifyButton}:disabled,
		html[data-hdl-spicy="yes"] [data-testid="lyrics-npv-section"],
		html[data-hdl-spicy="pending"] [data-testid="lyrics-npv-section"] {
			display: none !important;
		}
		html[data-hdl-spicy="no"] :is(${spicyButtons}),
		html[data-hdl-spicy="no"] #SpicyLyricsNPVCard {
			position: absolute !important;
			visibility: hidden !important;
			pointer-events: none !important;
		}
	`;
	document.head.appendChild(style);

	let trackUri = "";
	let trackSince = 0;
	let cardSeen = false; // the card has shown up since the song changed

	async function spicyHasLyrics(id) {
		// The card still shows the previous song's lines for a moment after a song change
		const settled = Date.now() - trackSince > 2000;
		if (settled && document.getElementById("SpicyLyricsNPVCard")?.querySelector(".LyricsContent .line")) return true;
		for (const name of await caches.keys()) {
			if (!name.startsWith("SpicyLyrics_LyricsStore")) continue;
			const cache = await caches.open(name);
			if (await cache.match(`${location.origin}/${id}`)) return true;
		}
		return false;
	}

	async function update() {
		const root = document.documentElement;
		if (!document.getElementById(SPICY_BUTTONS[0])) {
			root.removeAttribute("data-hdl-spicy"); // Spicy Lyrics isn't there: leave Spotify's lyrics alone
			return;
		}
		const uri = Spicetify.Player.data?.item?.uri ?? "";
		if (uri !== trackUri) {
			trackUri = uri;
			trackSince = Date.now();
			cardSeen = false;
		}
		const age = Date.now() - trackSince;
		const card = document.getElementById("SpicyLyricsNPVCard");
		if (card) cardSeen = true;
		const id = uri.split(":").pop();
		let state = "pending";
		if (!id || !uri.startsWith("spotify:track:")) state = "no";
		else if (await spicyHasLyrics(id)) state = "yes";
		else if (cardSeen && !card && age > CARD_GONE_MS) state = "no";
		else if (!cardSeen && age > GRACE_MS) state = "no";
		if (root.getAttribute("data-hdl-spicy") !== state) root.setAttribute("data-hdl-spicy", state);
	}

	Spicetify.Player.addEventListener("songchange", update);
	setInterval(update, 300);
	update();
})();
