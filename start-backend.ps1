$ErrorActionPreference = "Stop"

$TOOLS_DIR = "$PSScriptRoot\.tools"

# Find JDK directory
$JDK_DIR = Get-ChildItem -Path "$TOOLS_DIR\jdk" -Recurse -Filter "java.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 | ForEach-Object { $_.Directory.Parent.FullName }
if (-not $JDK_DIR) {
    Write-Host "JDK not found. Please wait for the download to finish." -ForegroundColor Red
    exit 1
}
$env:JAVA_HOME = $JDK_DIR
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Find Maven directory
$MAVEN_DIR = Get-ChildItem -Path "$TOOLS_DIR\maven" -Recurse -Filter "mvn.cmd" -ErrorAction SilentlyContinue | Select-Object -First 1 | ForEach-Object { $_.Directory.Parent.FullName }
if (-not $MAVEN_DIR) {
    Write-Host "Maven not found. Please wait for the download to finish." -ForegroundColor Red
    exit 1
}
$env:M2_HOME = $MAVEN_DIR
$env:PATH = "$env:M2_HOME\bin;$env:PATH"

Write-Host "JAVA_HOME set to $env:JAVA_HOME" -ForegroundColor Cyan
Write-Host "Maven found at $env:M2_HOME" -ForegroundColor Cyan

java -version
mvn -version

Write-Host "Starting Spring Boot Backend..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot\backend"

# Pass env vars from .env file
$envFilePath = "$PSScriptRoot\.env"
if (Test-Path $envFilePath) {
    Get-Content $envFilePath | Where-Object { $_ -match '^\s*[^#]' } | ForEach-Object {
        $name, $value = $_ -split '=', 2
        Set-Item -Path "env:$($name.Trim())" -Value $value.Trim()
    }
    Write-Host "Loaded environment variables from .env" -ForegroundColor Cyan
}

mvn spring-boot:run
