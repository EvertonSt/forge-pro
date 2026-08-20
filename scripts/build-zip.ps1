# build-zip.ps1 — Fast distributable ZIP builder for Forge-Pro
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$zipPath = Join-Path $root "Forge-Pro-Distributable.zip"
$stage = Join-Path $root "_dist_stage"

# Clean
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null

# 1. Installer
$installer = Join-Path $root "apps\desktop\release\Forge Pro-Setup-0.1.0.exe"
if (Test-Path $installer) {
    New-Item -ItemType Directory -Path (Join-Path $stage "Install") -Force | Out-Null
    Copy-Item $installer (Join-Path $stage "Install\")
    Write-Host "  Installer copied" -ForegroundColor Green
}

# 2. Templates (robocopy with exclusions — fast)
$templates = @("nimbus","atlas","lumen","studio","forge","pulse","sage","mesa","ledger","quill")
$excludes = @("node_modules",".next","dist",".turbo",".vercel")
$templatesDir = Join-Path $stage "Templates"
New-Item -ItemType Directory -Path $templatesDir -Force | Out-Null

foreach ($t in $templates) {
    $src = Join-Path $root "templates\$t"
    $dst = Join-Path $templatesDir $t
    if (Test-Path $src) {
        $xdArgs = @()
        foreach ($ex in $excludes) {
            $xdArgs += "/XD"
            $xdArgs += (Join-Path $src $ex)
        }
        & robocopy $src $dst /E /NFL /NDL /NJH /NJS /nc /ns /np $xdArgs 2>$null | Out-Null
        Write-Host "  $t" -ForegroundColor Cyan
    }
}

# 3. Docs
$docsDir = Join-Path $stage "Docs"
New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
$docs = @(
    (Join-Path $root "docs\Forge-Pro-User-Guide.pdf"),
    (Join-Path $root "docs\Forge-Pro-Presentation.html"),
    (Join-Path $root "DEPLOY.md")
)
foreach ($d in $docs) {
    if (Test-Path $d) {
        Copy-Item $d $docsDir
        Write-Host "  $(Split-Path $d -Leaf)" -ForegroundColor Cyan
    }
}

# 4. Deploy script
$scriptsDir = Join-Path $stage "Scripts"
New-Item -ItemType Directory -Path $scriptsDir -Force | Out-Null
$deploy = Join-Path $root "scripts\deploy-vercel.sh"
if (Test-Path $deploy) {
    Copy-Item $deploy $scriptsDir
    Write-Host "  deploy-vercel.sh" -ForegroundColor Cyan
}

# 5. README
$readmeLines = @(
    "=============================================",
    "  FORGE-PRO v1.0",
    "  Premium Website Templates Marketplace",
    "=============================================",
    "",
    "QUICK START",
    "-----------",
    "",
    "Deploy a template (free on Vercel):",
    "",
    "  1. npm i -g vercel",
    "  2. vercel login",
    "  3. cd Templates/nimbus && npm install && vercel --prod",
    "",
    "Deploy all 10 at once:",
    "",
    "  ./Scripts/deploy-vercel.sh",
    "",
    "Install desktop app (Windows):",
    "",
    "  Double-click Install/Forge Pro-Setup-0.1.0.exe",
    "",
    "TEMPLATES",
    "---------",
    "",
    "  nimbus   AI SaaS Landing Page        (Astro)",
    "  atlas    SaaS Dashboard              (Next.js)",
    "  lumen    E-commerce Store            (Astro)",
    "  studio   Creative Agency             (SvelteKit)",
    "  forge    Local Business / Booking    (Next.js)",
    "  pulse    Blog / Newsletter           (Astro)",
    "  sage     Course Platform / LMS       (Next.js)",
    "  mesa     Restaurant / Hospitality    (Astro)",
    "  ledger   Finance Dashboard           (Next.js)",
    "  quill    Documentation / KB          (Astro)",
    "",
    "All templates: responsive, dark/light, accessible, SEO-ready.",
    "",
    "CUSTOMIZATION",
    "-------------",
    "",
    "Edit CSS variables in the global stylesheet:",
    "",
    "  :root {",
    "    --accent: #e63946;",
    "    --bg: #faf9f7;",
    "  }",
    "",
    "Add forge-pro verify tag for marketplace:",
    "",
    '  <meta name="forge-pro:verify" content="YOUR_TOKEN" />',
    "",
    "DOCS",
    "----",
    "",
    "  Docs/Forge-Pro-User-Guide.pdf       Complete user guide",
    "  Docs/Forge-Pro-Presentation.html    Marketing slide deck",
    "  Docs/DEPLOY.md                       Deployment docs",
    "",
    "=============================================",
    "  Built with love  |  August 2026",
    "  forge-pro.vercel.app",
    "============================================="
)
$readmePath = Join-Path $stage "README.txt"
$readmeLines | Out-File -FilePath $readmePath -Encoding UTF8
Write-Host "  README.txt" -ForegroundColor Cyan

# 6. Create ZIP
Write-Host ""
Write-Host "Creating ZIP..." -ForegroundColor Yellow
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zipPath -CompressionLevel Optimal

# 7. Report
$zipItem = Get-Item $zipPath
$zipSizeMB = [math]::Round($zipItem.Length / 1MB, 1)
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  DONE! Forge-Pro-Distributable.zip" -ForegroundColor Green
Write-Host "  Size: $zipSizeMB MB" -ForegroundColor Green
Write-Host "  Path: $zipPath" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Cleanup
Remove-Item $stage -Recurse -Force
