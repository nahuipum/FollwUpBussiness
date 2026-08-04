$ErrorActionPreference = 'Stop'

# Graphify is optional for command execution. A missing executable must not turn
# every tool invocation into a failing PreToolUse hook. When it is installed,
# preserve its own hook-check result so an actual freshness/integrity failure is
# still visible to the caller.
$userPython = Join-Path $env:LOCALAPPDATA 'Programs\Python\Python312\python.exe'
if (Test-Path $userPython) {
    & $userPython -m graphify hook-check
    exit $LASTEXITCODE
}

$graphifyCommand = Get-Command graphify -ErrorAction SilentlyContinue
if ($null -ne $graphifyCommand) {
    & $graphifyCommand.Source hook-check
    exit $LASTEXITCODE
}

exit 0
