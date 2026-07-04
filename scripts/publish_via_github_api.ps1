param(
  [string]$Owner = "yuyangjungle",
  [string]$Repo = "llm-safety-eval-workflow",
  [string]$Branch = "main",
  [string]$Message = "Publish LLM safety eval workflow"
)

$ErrorActionPreference = "Stop"

function Get-GitHubTokenFromGcm {
  $query = "protocol=https`nhost=github.com`n`n"
  $output = $query | git credential-manager get
  if ($LASTEXITCODE -ne 0) {
    throw "Git Credential Manager could not return a GitHub credential. Run: git credential-manager github login"
  }

  $credential = @{}
  foreach ($line in $output) {
    if ($line -match "^(.*?)=(.*)$") {
      $credential[$Matches[1]] = $Matches[2]
    }
  }

  if (-not $credential.ContainsKey("password") -or -not $credential["password"]) {
    throw "Git Credential Manager returned no token. Run: git credential-manager github login"
  }

  return $credential["password"]
}

function Invoke-GitHubJson {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Uri,

    [string]$Method = "Get",

    [object]$Body = $null,

    [Parameter(Mandatory = $true)]
    [hashtable]$Headers
  )

  $args = @{
    Uri = $Uri
    Method = $Method
    Headers = $Headers
    TimeoutSec = 60
  }

  if ($null -ne $Body) {
    $args.Body = ($Body | ConvertTo-Json -Depth 12)
    $args.ContentType = "application/json"
  }

  Invoke-RestMethod @args
}

$repoRoot = (git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
  throw "Could not resolve git repository root."
}

$status = git status --porcelain
if ($status) {
  throw "Working tree is not clean. Commit or stash changes before publishing."
}

$token = Get-GitHubTokenFromGcm
$headers = @{
  Authorization = "Bearer $token"
  Accept = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
  "User-Agent" = "codex-publisher"
}

$apiRoot = "https://api.github.com/repos/$Owner/$Repo"
$ref = Invoke-GitHubJson -Uri "$apiRoot/git/ref/heads/$Branch" -Headers $headers
$parentSha = $ref.object.sha

$files = git ls-files
if (-not $files) {
  throw "No tracked files found."
}

$tree = @()
$count = 0
foreach ($path in $files) {
  $fullPath = [System.IO.Path]::Combine([string[]](@($repoRoot) + ($path -split "/")))
  $bytes = [System.IO.File]::ReadAllBytes($fullPath)
  $blob = Invoke-GitHubJson `
    -Uri "$apiRoot/git/blobs" `
    -Method "Post" `
    -Headers $headers `
    -Body @{
      content = [Convert]::ToBase64String($bytes)
      encoding = "base64"
    }

  $tree += @{
    path = $path
    mode = "100644"
    type = "blob"
    sha = $blob.sha
  }
  $count += 1
  Write-Host "Uploaded blob $count/$($files.Count): $path"
}

$treeObject = Invoke-GitHubJson `
  -Uri "$apiRoot/git/trees" `
  -Method "Post" `
  -Headers $headers `
  -Body @{ tree = $tree }

$commit = Invoke-GitHubJson `
  -Uri "$apiRoot/git/commits" `
  -Method "Post" `
  -Headers $headers `
  -Body @{
    message = $Message
    tree = $treeObject.sha
    parents = @($parentSha)
  }

Invoke-GitHubJson `
  -Uri "$apiRoot/git/refs/heads/$Branch" `
  -Method "Patch" `
  -Headers $headers `
  -Body @{
    sha = $commit.sha
    force = $false
  } | Out-Null

Write-Host "Published $count files to https://github.com/$Owner/$Repo/tree/$Branch"
Write-Host "Commit: $($commit.sha)"
