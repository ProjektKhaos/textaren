<?php
// mall.php med huvudlayout Ⓐ Style
define('ABERG_LAYOUT', true);
?>
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="apple-touch-icon" sizes="180x180" href="image/apple-touch-icon.png">
<link rel="icon" type="image/" sizes="32x32" href="image/favicon-32x32.png">
<link rel="icon" type="image/" sizes="16x16" href="image/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
  <title><?php echo htmlspecialchars($page_title ?? 'Åberg Grejar', ENT_QUOTES, 'UTF-8'); ?></title>

  <?php include __DIR__ . '/includes/fb_openg.php'; ?>

  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="page">

    <?php include __DIR__ . '/includes/header.php'; ?>

    <div class="main-wrap">
      <main class="page-content">
        <div class="container">
          <!-- ====== HÄR SKA KODEN LIGGA UNDER ====== -->

          <?php
          // "Wrapper"-idén:
          // - Varje sida (index.php, start2.php ...) sätter $content_file till en fil i /pages
          // - Den filen innehåller ENBART content (ingen <html>, <head>, <body>, ingen .container)
          if (isset($content_file) && is_file($content_file)) {
            include $content_file;
          } else {
            echo '<p><strong>Ingen content_file angiven.</strong> Skapa t.ex. <code>index.php</code> som sätter <code>$content_file</code>.</p>';
          }
          ?>

          <!-- ====== HÄR OVAN SKA KODEN ====== -->
        </div>
      </main>
    </div>

    <?php include __DIR__ . '/includes/footer.php'; ?>

  </div>
  
  </div>
</body>

</html>
