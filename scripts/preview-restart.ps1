param(
  [ValidateSet("mock", "live")]
  [string]$Mode = "mock"
)

& "$PSScriptRoot\preview-stop.ps1"
& "$PSScriptRoot\preview-start.ps1" -Mode $Mode -Rebuild
