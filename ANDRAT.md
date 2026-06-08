# Ändrat

## 2026-06-08

- Ersatte den gamla wrappern i `textare.php` som anvande `$content_file` och `mall.php`.
- Lade tillbaka fristående asset-struktur i roten: `assets/textare/` och `image/`.
- Tog bort hardkodade domanlankar fran live-sidans egna resurser.
- Lade till tydligare steg, statusruta, progress, knapplasning och exportstatus.
- Renderar textrader med `textContent` i stället för oskyddad `innerHTML`.
- Bevarar lokal ljud/video, Space-tidsättning, Backspace-ångra, piljustering och SRT-export.
