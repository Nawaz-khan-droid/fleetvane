$ErrorActionPreference = "Stop"
Set-Location -Path "$PSScriptRoot\frontend"
Write-Host "Starting Next.js Frontend..." -ForegroundColor Green
npm run dev
