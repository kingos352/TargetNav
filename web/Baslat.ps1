$ErrorActionPreference='Stop'
$taskRuntime=Join-Path $PSScriptRoot 'runtime\node.exe'
$taskLauncher=Join-Path $PSScriptRoot 'launcher.cjs'
if (-not (Test-Path -LiteralPath $taskRuntime)) {
  $taskNode=Get-Command node -ErrorAction SilentlyContinue
  if (-not $taskNode) { Write-Host 'Node.js bulunamadi. https://nodejs.org adresinden kurun.'; exit 1 }
  $taskRuntime=$taskNode.Source
}
& $taskRuntime $taskLauncher
exit $LASTEXITCODE
