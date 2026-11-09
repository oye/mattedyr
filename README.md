# Mattedyr

En sveip-basert matte-app for grunnskolen (LK20) med et kjæledyr som vokser fra egg til voksen.

- **Feed:** én oppgave om gangen – tallpanel, flervalg eller «stemmer / stemmer ikke» (sveip ← →). Sveip opp for neste.
- **Tilpasset nivå:** vanskelighetsgraden justeres per ferdighet (sikter mot ca. 78 % riktige), med repetisjon etter 1, 2, 4, 7 og 14 dager.
- **Kjæledyr:** XP får dyret til å vokse, mynter kjøper klær i butikken. Dyret blir aldri trist – på det meste søvnig.
- **Dagens mål og rekke:** opptil to automatiske fridager per uke.
- **For voksne:** trinn, dagens mål og hvilke tema som er på.
- Alt lagres lokalt (localStorage). Installerbar som PWA og fungerer offline.

## Kom i gang

```sh
npm install
npm run dev        # utviklingsserver
npm test           # enhetstester for oppgavemotoren
npm run build      # produksjonsbygg i dist/
npm run preview    # forhåndsvis bygget
```

`node scripts/make-icons.mjs` lager appikonene i `public/` på nytt.

## Publisering (GitHub Pages)

`.github/workflows/deploy.yml` kjører testene, bygger og publiserer appen til
`https://<brukernavn>.github.io/<repo>/` ved hver push til `main`.
Første gang: på GitHub, gå til **Settings → Pages** og velg **Source: GitHub Actions**.

Bruker du et `<brukernavn>.github.io`-repo eller eget domene, endre `--base` i workflowen til `/`.

## Struktur

- `src/engine/` – ren TypeScript uten UI: oppgavegeneratorer (`generators/`), kortbygging og retting (`build.ts`),
  valg av neste kort (`feed.ts`), mestring/repetisjon (`mastery.ts`) og belønninger/rekke/humør (`rewards.ts`).
- `src/store.ts` – Zustand-tilstand som lagres i localStorage.
- `src/components/` – React-skjermer: feed, kjæledyr (SVG), fremgang, innstillinger og oppstart.

