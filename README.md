# Hasses Textare

Fristående PHP-sida för textning och tidskodning av lokal ljud- eller videofil.

## Nuvarande lage

- `textare.php` är en komplett sida och inkluderar inte `mall.php`.
- Appen laddar lokala, relativa filer: `style.css`, `assets/textare/textare.css`, `assets/textare/app.js` och `image/*`.
- Katalogen kan byta namn eftersom sidan inte har hårdkodad base URL till appens egna filer.
- Media hanteras lokalt i webblasaren med `URL.createObjectURL()` och laddas inte upp till servern.

## Kontroller

```bash
php -l textare.php
node --check assets/textare/app.js
```
