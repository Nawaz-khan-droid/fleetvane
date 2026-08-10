$ErrorActionPreference = "Stop"
Write-Host "Starting React Frontend..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot\frontend"
npm run dev
