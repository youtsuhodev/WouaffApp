const fs = require('fs');
const path = require('path');
const pngPath = path.join(__dirname, '..', 'public', 'assets', 'logo', 'logo.png');
const png = fs.readFileSync(pngPath);
const b64 = png.toString('base64');
const dataUri = 'data:image/png;base64,' + b64;
const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0e1117;display:flex;align-items:center;justify-content:center;height:100vh;font-family:'Segoe UI',sans-serif;user-select:none;overflow:hidden}
    .splash{text-align:center;animation:fadeIn .4s ease}
    .logo{width:80px;height:80px;border-radius:20px;margin-bottom:16px}
    h1{font-size:24px;font-weight:800;color:#e8ecf0;margin-bottom:24px;letter-spacing:-.5px}
    .spinner{width:32px;height:32px;border:3px solid #1c2333;border-top-color:#F97B3B;border-radius:50%;margin:0 auto;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
  </style>
</head>
<body>
  <div class="splash">
    <img class="logo" src="${dataUri}" alt=""/>
    <h1>Wouaff</h1>
    <div class="spinner"></div>
  </div>
</body>
</html>`;
fs.writeFileSync(path.join(__dirname, '..', 'electron', 'splash.html'), html);
console.log('Splash HTML generated with embedded logo');
