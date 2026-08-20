const fs = require('fs');
const file = 'C:/AI/Freebuff Desktop/GitHub Projects/forge-pro/templates/sage/src/app/layout.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove ALL existing toast script blocks
content = content.replace(/\n\s*<script dangerouslySetInnerHTML=\{\{ __html: "window\.showToast[\s\S]*?" \}\} \/>/g, '');

// Find the </body> and add the script before it (inside body)
const toastJS = "window.showToast = function(m, t, d) { d = d || 3000; t = t || 'info'; var c = document.querySelector('.toast-container'); if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); } var e = document.createElement('div'); e.className = 'toast toast-' + t; e.textContent = m; e.setAttribute('role', 'alert'); c.appendChild(e); requestAnimationFrame(function() { requestAnimationFrame(function() { e.classList.add('show'); }); }); setTimeout(function() { e.classList.remove('show'); setTimeout(function() { e.remove(); }, 300); }, d); };";

const scriptTag = '<script dangerouslySetInnerHTML={{ __html: ' + JSON.stringify(toastJS) + ' }} />';
content = content.replace('    </body>', '      ' + scriptTag + '\n    </body>');

fs.writeFileSync(file, content);
console.log('sage: toast script fixed properly');
