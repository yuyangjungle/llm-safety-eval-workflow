param(
  [Parameter(Mandatory = $true)]
  [string]$RepoUrl,

  [switch]$DeployVercel
)

$ErrorActionPreference = "Stop"

function Require-CleanGit {
  $status = git status --porcelain
  if ($status) {
    throw "Working tree is not clean. Commit or stash changes before publishing."
  }
}

function Ensure-Origin {
  $origin = git remote get-url origin 2>$null
  if (-not $origin) {
    git remote add origin $RepoUrl
  } elseif ($origin -ne $RepoUrl) {
    Write-Host "origin already exists: $origin"
    Write-Host "Expected: $RepoUrl"
    throw "Refusing to overwrite existing origin."
  }
}

Require-CleanGit
Ensure-Origin

$branch = git branch --show-current
if (-not $branch) {
  throw "Could not determine current branch."
}

git push -u origin $branch

if ($DeployVercel) {
  $vercel = Get-Command vercel -ErrorAction SilentlyContinue
  if (-not $vercel) {
    throw "Vercel CLI is not installed. Install with: npm i -g vercel"
  }
  vercel deploy --prod
}

Write-Host "Publish flow completed."

