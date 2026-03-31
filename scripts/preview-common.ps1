Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-PreviewConfig {
  $repoRoot = Split-Path -Parent $PSScriptRoot
  $previewRoot = Join-Path $repoRoot ".preview"

  return @{
    RepoRoot = $repoRoot
    PreviewRoot = $previewRoot
    DistRoot = Join-Path $repoRoot "apps/mobile/dist"
    Port = 8085
    Url = "http://127.0.0.1:8085"
    PidFile = Join-Path $previewRoot "preview-server.pid"
    ModeFile = Join-Path $previewRoot "preview-mode.txt"
    BuildStampFile = Join-Path $previewRoot "last-build.txt"
    NodeExe = Resolve-PreviewNodeExe
  }
}

function Resolve-PreviewNodeExe {
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue

  if ($nodeCommand) {
    return $nodeCommand.Source
  }

  $fallback = "C:\Progra~1\nodejs\node.exe"

  if (Test-Path $fallback) {
    return $fallback
  }

  throw "Unable to resolve node.exe for preview server startup."
}

function Ensure-PreviewRoot {
  param(
    [hashtable]$Config
  )

  if (-not (Test-Path $Config.PreviewRoot)) {
    New-Item -ItemType Directory -Path $Config.PreviewRoot | Out-Null
  }
}

function Get-PreviewPid {
  param(
    [hashtable]$Config
  )

  if (-not (Test-Path $Config.PidFile)) {
    return $null
  }

  $rawValue = (Get-Content $Config.PidFile -Raw).Trim()

  if ([string]::IsNullOrWhiteSpace($rawValue)) {
    return $null
  }

  return [int]$rawValue
}

function Get-PreviewProcess {
  param(
    [hashtable]$Config
  )

  $previewPid = Get-PreviewPid -Config $Config

  if (-not $previewPid) {
    $previewPid = Get-PreviewListenerPid -Config $Config
  }

  if (-not $previewPid) {
    return $null
  }

  return Get-Process -Id $previewPid -ErrorAction SilentlyContinue
}

function Set-PreviewPid {
  param(
    [hashtable]$Config,
    [int]$PreviewPid
  )

  Ensure-PreviewRoot -Config $Config
  Set-Content -Path $Config.PidFile -Value $PreviewPid
}

function Clear-PreviewPid {
  param(
    [hashtable]$Config
  )

  if (Test-Path $Config.PidFile) {
    Remove-Item $Config.PidFile -Force
  }
}

function Get-PreviewListenerPid {
  param(
    [hashtable]$Config
  )

  $listenerLine = netstat -ano | Select-String "127.0.0.1:$($Config.Port)\s+0.0.0.0:0\s+LISTENING"

  if (-not $listenerLine) {
    return $null
  }

  $tokens = ($listenerLine.ToString() -split "\s+") | Where-Object { $_ -ne "" }

  if ($tokens.Length -lt 5) {
    return $null
  }

  return [int]$tokens[-1]
}

function Set-PreviewMode {
  param(
    [hashtable]$Config,
    [string]$Mode
  )

  Ensure-PreviewRoot -Config $Config
  Set-Content -Path $Config.ModeFile -Value $Mode
}

function Get-PreviewMode {
  param(
    [hashtable]$Config
  )

  if (-not (Test-Path $Config.ModeFile)) {
    return "unknown"
  }

  return (Get-Content $Config.ModeFile -Raw).Trim()
}

function Set-PreviewBuildStamp {
  param(
    [hashtable]$Config
  )

  Ensure-PreviewRoot -Config $Config
  Set-Content -Path $Config.BuildStampFile -Value ([DateTime]::UtcNow.ToString("o"))
}

function Get-PreviewBuildStamp {
  param(
    [hashtable]$Config
  )

  if (-not (Test-Path $Config.BuildStampFile)) {
    return $null
  }

  return (Get-Content $Config.BuildStampFile -Raw).Trim()
}

function Test-PreviewHealth {
  param(
    [hashtable]$Config
  )

  try {
    $response = Invoke-WebRequest -Uri $Config.Url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Wait-PreviewHealth {
  param(
    [hashtable]$Config,
    [int]$TimeoutSeconds = 15
  )

  $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

  while ($stopwatch.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
    if (Test-PreviewHealth -Config $Config) {
      return $true
    }

    Start-Sleep -Milliseconds 400
  }

  return $false
}

function Start-DetachedPreviewProcess {
  param(
    [hashtable]$Config
  )

  $processInfo = New-Object System.Diagnostics.ProcessStartInfo
  $processInfo.FileName = $Config.NodeExe
  $processInfo.Arguments = "scripts/serve-static.mjs --root apps/mobile/dist --port $($Config.Port)"
  $processInfo.WorkingDirectory = $Config.RepoRoot
  $processInfo.UseShellExecute = $true
  $processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden

  $process = [System.Diagnostics.Process]::Start($processInfo)

  if (-not $process) {
    throw "Failed to start detached preview server process."
  }

  Set-PreviewPid -Config $Config -Pid $process.Id
  return $process
}

function Stop-PreviewProcess {
  param(
    [hashtable]$Config
  )

  $process = Get-PreviewProcess -Config $Config

  if ($process) {
    Stop-Process -Id $process.Id -Force
    try {
      $process.WaitForExit(5000) | Out-Null
    } catch {
    }
  }

  Clear-PreviewPid -Config $Config
}

function Update-PreviewIndexPaths {
  param(
    [hashtable]$Config
  )

  $indexPath = Join-Path $Config.DistRoot "index.html"

  if (-not (Test-Path $indexPath)) {
    throw "Preview export is missing dist/index.html."
  }

  $content = Get-Content $indexPath -Raw
  $content = $content.Replace('href="/favicon.ico"', 'href="./favicon.ico"')
  $content = $content.Replace('src="/_expo/static/js/web/', 'src="./_expo/static/js/web/')
  Set-Content -Path $indexPath -Value $content
}
