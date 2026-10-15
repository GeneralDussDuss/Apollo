# Fallback if Claude can't push: run from inside C:\dev\apollo. Needs git + GitHub CLI (`gh auth login` done).
# The GeneralDussDuss/apollo repo already exists and is empty, so this just pushes and turns on Pages.
$ErrorActionPreference = "Stop"
Invoke-WebRequest -Uri "https://www.apache.org/licenses/LICENSE-2.0.txt" -OutFile "LICENSE"
if (-not (Test-Path ".git")) { git init -b main }
git add -A
git commit -m "feat: Apollo landing page, spec, agent rules" --allow-empty
if (-not (git remote | Select-String -Quiet "^origin$")) { git remote add origin https://github.com/GeneralDussDuss/apollo.git }
git push -u origin main
gh api -X POST repos/GeneralDussDuss/apollo/pages -f "source[branch]=main" -f "source[path]=/docs"
gh api -X PATCH repos/GeneralDussDuss/apollo -f homepage="https://generaldussduss.github.io/apollo/" -F has_discussions=true
gh repo edit GeneralDussDuss/apollo --add-topic ai-agent --add-topic claude --add-topic local-first --add-topic windows --add-topic coding-agent
Write-Host "Done. Site goes live in about a minute at https://generaldussduss.github.io/apollo/"
