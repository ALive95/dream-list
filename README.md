# Dream List

A two-page static site for GitHub Pages:

- `index.html`: the public Dream List (pixel twilight sky, foil shimmer, Cardmarket and CardTrader links)
- `bts.html`: Behind the Scenes, where you add and edit cards
- `cards.json`: the data, written by `bts.html`
- `common.js`: shared helpers (Scryfall calls, link building)

## Publish

1. Create a GitHub repository (e.g. `dream-list`) and upload these files to its root.
2. Repository → Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. The site appears at `https://<username>.github.io/dream-list/`; the editor is at `.../dream-list/bts.html`.

## Saving from Behind the Scenes

`bts.html` saves by committing `cards.json` through the GitHub API, so it needs a token once per browser:

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
2. Repository access: only this repository. Permissions: **Contents → Read and write**.
3. Paste it into "GitHub settings" on `bts.html` and click "Save settings". It is kept in your browser's local storage only.

After a save, GitHub Pages needs about a minute to rebuild. Without a token you can still use "Download cards.json" and upload the file to the repo by hand.

## Notes

- The Dream List has a buying guide in English and Italian. It opens from the hot-air balloon, from the footer link, and from a prompt shown when a visitor clicks a shop button (they can tick "don't ask again"). The guide text is in `index.html`, inside `<div id="guideOverlay">`.

- Cardmarket links open the exact printing through its Cardmarket product id, with no filters (Cardmarket's firewall blocked links with extra parameters).
- CardTrader links use `/cards/<card-name>-<set-name>`, which CardTrader redirects to that printing.
- If an automatic link lands on the wrong version, paste the exact link in Behind the Scenes (optional fields when adding, or the 🔗 button in the list). Custom links show in red there.
- If Scryfall has no scan of the chosen language for an edition, the English image is shown; the links still filter by your language.
