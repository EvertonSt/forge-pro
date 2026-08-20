const fs = require('fs');
const path = require('path');

const ROOT = 'C:/AI/Freebuff Desktop/GitHub Projects/forge-pro/templates';

// Simple toast JS that works in dangerouslySetInnerHTML with no escaping issues
const TOAST_JS_ESCAPED = `window.showToast = function(m, t, d) {
  d = d || 3000; t = t || 'info';
  var c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  var e = document.createElement('div');
  e.className = 'toast toast-' + t;
  e.textContent = m;
  e.setAttribute('role', 'alert');
  c.appendChild(e);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() { e.classList.add('show'); });
  });
  setTimeout(function() {
    e.classList.remove('show');
    setTimeout(function() { e.remove(); }, 300);
  }, d);
};`;

const templates = ['atlas', 'sage', 'ledger', 'forge'];

for (const t of templates) {
  const file = path.join(ROOT, t, 'src/app/layout.tsx');
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove any existing broken toast scripts (both dangerouslySetInnerHTML and raw <script>)
  // Pattern 1: <script dangerouslySetInnerHTML={{ __html: "window.showToast...
  content = content.replace(/<script dangerouslySetInnerHTML=\{\{ __html: "window\.showToast[\s\S]*?" \}\} \/>/g, '');
  // Pattern 2: <script>\n// Toast Notification System...
  content = content.replace(/<script>\s*\/\/ Toast Notification System[\s\S]*?<\/script>/g, '');
  // Pattern 3: <script> window.showToast...
  content = content.replace(/<script>\s*window\.showToast[\s\S]*?<\/script>/g, '');
  
  // Add the clean script before </body>
  const escapedJS = JSON.stringify(TOAST_JS_ESCAPED);
  const scriptTag = `<script dangerouslySetInnerHTML={{ __html: ${escapedJS} }} />`;
  
  if (!content.includes('showToast')) {
    content = content.replace('</body>', `      ${scriptTag}\n    </body>`);
  }
  
  fs.writeFileSync(file, content);
  console.log(`${t}: toast script fixed`);
}
