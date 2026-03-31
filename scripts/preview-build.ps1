param(
  [ValidateSet("mock", "live")]
  [string]$Mode = "mock"
)

. "$PSScriptRoot\preview-common.ps1"

$config = Get-PreviewConfig

Write-Host "Building preview bundle in $Mode mode..."

Push-Location (Join-Path $config.RepoRoot "apps/mobile")

try {
  $env:EXPO_PUBLIC_USE_MOCK_API = if ($Mode -eq "mock") { "true" } else { "false" }

  if ($Mode -eq "live") {
    if (-not $env:EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL) {
      $env:EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL = "http://127.0.0.1:54321/functions/v1"
    }

    if (-not $env:EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      $env:EXPO_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    }
  }

  & npx.cmd expo export --platform web
} finally {
  Pop-Location
}

Update-PreviewIndexPaths -Config $config
Set-PreviewMode -Config $config -Mode $Mode
Set-PreviewBuildStamp -Config $config

Write-Host "Preview bundle is ready at $($config.DistRoot)"
