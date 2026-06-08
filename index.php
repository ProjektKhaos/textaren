<?php
// textare.php - fristående PHP-sida för Hasses Textare.
// Senast uppdaterad: 2026-06-08.
$page_title = 'Textaren - Skapa SRT-undertext | textning & tidskodning | Made by Åberg 2026';

$request_path = strtok($_SERVER['REQUEST_URI'] ?? 'textare.php', '?') ?: 'textare.php';
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? '';

$current_url = $host ? $scheme . '://' . $host . $request_path : $request_path;

// Hämtar aktuell katalog, t.ex. /textaren
$current_dir = rtrim(str_replace('\\', '/', dirname($request_path)), '/');
$current_dir = ($current_dir === '.' || $current_dir === '/') ? '' : $current_dir;

// OpenGraph-bild för Facebook, Messenger, X/Twitter m.m.
// Bilden ska ligga här: /textaren/image/textaren_og_2.png
$og_image = $host
  ? $scheme . '://' . $host . $current_dir . '/image/textaren_og_2.png'
  : 'image/textaren_og_2.png';
?>
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title><?= htmlspecialchars($page_title, ENT_QUOTES, 'UTF-8') ?></title>
  <meta name="description" content="Hasses Textare - ett enkelt verktyg för textning, tidsättning och export till SRT.">

  <link rel="apple-touch-icon" sizes="180x180" href="image/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="image/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="image/favicon-16x16.png">
  <link rel="manifest" href="image/site.webmanifest">

  <!-- OpenGraph / Facebook -->
  <meta property="og:title" content="Hasses Textare">
  <meta property="og:description" content="Skapa SRT-undertext genom att välja media, lägga in text och tidsätta raderna under uppspelning.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="<?= htmlspecialchars($current_url, ENT_QUOTES, 'UTF-8') ?>">
  <meta property="og:image" content="<?= htmlspecialchars($og_image, ENT_QUOTES, 'UTF-8') ?>">
  <meta property="og:image:secure_url" content="<?= htmlspecialchars($og_image, ENT_QUOTES, 'UTF-8') ?>">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="sv_SE">
  <meta property="og:site_name" content="Textaren">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Hasses Textare">
  <meta name="twitter:description" content="Skapa SRT-undertext genom att välja media, lägga in text och tidsätta raderna under uppspelning.">
  <meta name="twitter:image" content="<?= htmlspecialchars($og_image, ENT_QUOTES, 'UTF-8') ?>">

  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="assets/textare/textare.css">
  <script src="assets/textare/app.js" defer></script>
</head>
<body>
  <div class="page">
    <header class="site-header" aria-label="Sidhuvud">
      <div class="site-header-title">TEXTAREN</div>
    </header>

    <main class="page-content">
      <div class="container">
        <h1>Textaren</h1>
        <p class="textare-lead">Skapa SRT-undertext genom att välja media, lägga in text och tidsätta raderna.</p>

        <div class="app-scope" data-textare-app>
          <section class="textare-help" aria-labelledby="textareHelpTitle">
            <h2 id="textareHelpTitle">Så gör du</h2>
            <ol class="help-steps">
              <li>Välj media.</li>
              <li>Klistra in texten.</li>
              <li>Förbered textraderna.</li>
              <li>Starta uppspelningen och tryck Space när nästa rad ska visas.</li>
              <li>Kontrollera tiderna och ladda ner SRT.</li>
            </ol>
          </section>

          <div id="status" class="textare-status" role="status" aria-live="polite">
            Välj media och text för att komma igång.
          </div>

          <div class="grid-top">
            <section class="card stack" aria-labelledby="mediaTextTitle">
              <h2 id="mediaTextTitle">1. Underlag</h2>

              <div class="stack">
                <label for="mediaInput">Mediafil</label>
                <input id="mediaInput" type="file" accept="audio/*,video/*">
              </div>

              <div class="media-container">
                <audio id="audioPlayer" controls hidden></audio>
                <video id="videoPlayer" controls hidden></video>
                <div id="noMedia" class="media-empty-state">Ingen fil vald</div>
              </div>

              <div class="stack">
                <label for="txt">Text att tidsätta</label>
                <textarea id="txt" placeholder="Klistra in sångtext, dialog eller undertext här..."></textarea>
              </div>

              <div class="row action-row">
                <button class="btn primary" id="prep" type="button">Förbered textrader</button>
                <button class="btn ghost" id="clear" type="button">Rensa</button>
              </div>
            </section>

            <section class="card stack" aria-labelledby="syncTitle">
              <h2 id="syncTitle">2. Tidsättning</h2>

              <div class="sync-status-row">
                <div class="badge mono">Rad: <span id="idx">-</span></div>
                <div class="badge mono">Tidsatta: <span id="doneCount">0 / 0</span></div>
                <div class="badge mono">Tid: <span id="cur" class="time">0:00.00</span></div>
              </div>

              <div class="progress" aria-label="Uppspelningsposition">
                <div id="bar" class="bar"></div>
              </div>

              <div class="row sync-toolbar">
                <button class="btn ok" id="start" type="button" disabled>Starta uppspelning</button>
                <button class="btn stamp-button" id="stamp" type="button" disabled>Tidsätt textrad med Space</button>
                <button class="btn warn" id="undo" type="button" disabled>Ångra</button>
              </div>

              <div class="row nudge-toolbar">
                <button class="btn ghost mini" id="nudgeLeft" type="button" disabled>-0.1s</button>
                <button class="btn ghost mini" id="nudgeRight" type="button" disabled>+0.1s</button>
              </div>

              <div id="list" class="lyrics mono">
                <div class="lyrics-empty">Förbered textraderna för att börja.</div>
              </div>

              <div class="export-actions">
                <button class="btn primary export-main-button" id="finish" type="button" disabled>Förbered SRT-export</button>
                <div id="exportSummary" class="export-summary">Förbered export när tiderna är klara.</div>
              </div>

              <div class="row export-downloads">
                <button class="btn" id="dlSRT" type="button" disabled>Ladda ner .SRT</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>

    <footer class="site-footer">
      Textaren made by Åberg 2026
    </footer>
  </div>
</body>
</html>