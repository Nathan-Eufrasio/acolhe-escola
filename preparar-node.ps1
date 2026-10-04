$ErrorActionPreference = 'Stop'

$architecture = if ([Environment]::Is64BitOperatingSystem) { 'x64' } else { 'x86' }
$runtimeDirectory = Join-Path $PSScriptRoot '.runtime'
$releaseIndex = 'https://nodejs.org/dist/index.json'

try {
  $versions = Invoke-RestMethod -Uri $releaseIndex
  $ltsVersions = @($versions | Where-Object { $_.lts -is [string] })
  $compatibleVersions = @($ltsVersions | Where-Object { $_.files -contains "win-${architecture}-zip" })
  $release = $compatibleVersions | Select-Object -First 1

  if (-not $release) {
    throw "Nenhuma versao LTS encontrada para Windows $architecture (versoes LTS: $($ltsVersions.Count))."
  }

  $archiveName = "node-$($release.version)-win-$architecture.zip"
  $archivePath = Join-Path $env:TEMP $archiveName
  $downloadUrl = "https://nodejs.org/dist/$($release.version)/$archiveName"
  $sourceDirectory = Join-Path $runtimeDirectory "node-$($release.version)-win-$architecture"

  New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null
  Invoke-WebRequest -Uri $downloadUrl -OutFile $archivePath
  Expand-Archive -Path $archivePath -DestinationPath $runtimeDirectory -Force
  Move-Item -Path (Join-Path $sourceDirectory '*') -Destination $runtimeDirectory -Force
  Remove-Item -Path $sourceDirectory -Recurse -Force
  Remove-Item -Path $archivePath -Force

  if (-not (Test-Path (Join-Path $runtimeDirectory 'node.exe')) -or
      -not (Test-Path (Join-Path $runtimeDirectory 'npm.cmd'))) {
    throw 'O pacote do Node.js foi baixado, mas faltam arquivos necessarios.'
  }

  Write-Host 'Node.js portatil preparado.'
} catch {
  Write-Error "Falha ao preparar o Node.js portatil: $($_.Exception.Message)"
  exit 1
}