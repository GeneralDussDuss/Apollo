# Run from inside C:\dev\apollo on your Windows box. Needs: git, GitHub CLI (`gh auth login` done).
# Safe to run on top of the Antigravity scaffold: it only inits git if there isn't one yet.
$ErrorActionPreference = "Stop"
Invoke-WebRequest -Uri "https://www.apache.org/licenses/LICENSE-2.0.txt" -OutFile "LICENSE"
if (-not (Test-Path ".git")) { git init -b main }
git add -A
git commit -m "feat: Apollo landing page, spec, agent rules" --allow-empty
gh repo create GeneralDussDuss/apollo --public --source . --remote origin --push --description "An AI coding agent that can finish your project and can't wreck your computer."
gh api -X POST repos/GeneralDussDuss/apollo/pages -f "source[branch]=main" -f "source[path]=/docs"
gh api -X PATCH repos/GeneralDussDuss/apollo -f homepage="https://generaldussduss.github.io/apollo/" -F has_discussions=true
gh repo edit GeneralDussDuss/apollo --add-topic ai-agent --add-topic claude --add-topic local-first --add-topic windows --add-topic coding-agent
Write-Host ""
Write-Host "Done. Site goes live in about a minute at https://generaldussduss.github.io/apollo/"
Write-Host "Then: Watch -> Custom -> Releases on the repo, and send the crew the link."
