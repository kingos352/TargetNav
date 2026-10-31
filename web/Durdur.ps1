$taskPidFile=Join-Path $PSScriptRoot 'runtime\server.pid'
if (Test-Path -LiteralPath $taskPidFile) {
  $taskServerId=Get-Content -LiteralPath $taskPidFile
  $taskServer=Get-Process -Id $taskServerId -ErrorAction SilentlyContinue
  $taskExpected=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'runtime\node.exe'))
  $taskNode=Get-Command node -ErrorAction SilentlyContinue
  if ($taskServer -and ($taskServer.Path -eq $taskExpected -or ($taskNode -and $taskServer.Path -eq $taskNode.Source))) { Stop-Process -Id $taskServer.Id }
  Remove-Item -LiteralPath $taskPidFile -ErrorAction SilentlyContinue
}
