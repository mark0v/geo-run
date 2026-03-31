param(
  [ValidateSet("mock", "live")]
  [string]$Mode = "mock",
  [switch]$Rebuild
)

. "$PSScriptRoot\preview-common.ps1"

$config = Get-PreviewConfig
Ensure-PreviewRoot -Config $config

if ($Rebuild -or -not (Test-Path (Join-Path $config.DistRoot "index.html"))) {
  & "$PSScriptRoot\preview-build.ps1" -Mode $Mode
}

$runningProcess = Get-PreviewProcess -Config $config

if ($runningProcess -and (Test-PreviewHealth -Config $config)) {
  Set-PreviewPid -Config $config -Pid $runningProcess.Id
  Write-Host "Preview already running at $($config.Url)"
  Write-Host "Mode: $(Get-PreviewMode -Config $config)"
  Write-Host "PID: $($runningProcess.Id)"
  exit 0
}

if ($runningProcess) {
  Stop-PreviewProcess -Config $config
}

$process = Start-DetachedPreviewProcess -Config $config

if (-not (Wait-PreviewHealth -Config $config -TimeoutSeconds 15)) {
  Stop-PreviewProcess -Config $config
  throw "Preview server failed health check at $($config.Url)."
}

Write-Host "Preview ready at $($config.Url)"
Write-Host "Mode: $(Get-PreviewMode -Config $config)"
Write-Host "PID: $($process.Id)"
