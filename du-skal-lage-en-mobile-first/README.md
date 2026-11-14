# Ut på tur, aldri sur

En veldig enkel, mobil-først turvenn som kan legges på hjemskjermen uten App Store eller Google Play.

## Dette kan appen gjøre

- Lagre steder, notater og bilder lokalt på telefonen
- Hente vær for der du er, med enkelt klæråd, vind og soloppgang/-nedgang
- Vise kompass og telle enkle bevegelsesbaserte skritt når telefonen tillater det
- Vise en liten huskeliste for turmat og pakking
- Svare på turspørsmål med Groq, uten at API-nøkkelen sendes til nettleseren

## Prøv lokalt

Kjør dette i prosjektmappen og åpne adressen den viser:

```bash
python3 -m http.server 4173
```

AI-chatten trenger en serverless-plattform fordi nettleseren aldri skal få Groq-nøkkelen. `api/groq.js` og `.env` er lagt opp for Vercel: importer prosjektet der, legg inn `GROQ_API_KEY` som en Environment Variable (kopier verdien fra din lokale `.env`), og publiser. Vercel har en gratisplan for små personlige prosjekter.

## Legg på iPhone

Åpne den publiserte nettsiden i Safari → Del → **Legg til på Hjem-skjerm** → Legg til.

## Viktige begrensninger

- En vanlig nett-app kan ikke lese Apple Helse-data direkte. Skritt her er en grov bevegelsesteller som virker mens appen er åpen og du har gitt tillatelse.
- Bilder og turminner er bare lagret i nettleseren på denne telefonen. `shortcut: bruk IndexedDB eller skylagring hvis mange/fulle bilder skal bevares.`
- Bruk alltid offisielle vær- og sikkerhetsvarsler før tur.
