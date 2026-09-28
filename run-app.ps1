# StayLocal Application Launcher
# Runs both backend Fastify API (port 8787) and Vite frontend (port 5173)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$env:PATH = "$scriptDir\.tools\node;$env:PATH"
$env:PORT = "8787"
$env:HOST = "127.0.0.1"
$env:STAYLOCAL_DATABASE_MODE = "sqlite"
$env:STAYLOCAL_SQLITE_PATH = "./data/staylocal.sqlite"
$env:STAYLOCAL_ALLOW_SIMULATION = "true"
$env:VITE_API_BASE_URL = "http://localhost:8787"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "             STAYLOCAL FULL-STACK SYSTEM                  " -ForegroundColor Green
Write-Host "    Stay with Locals, Pay Less, Experience More.          " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Starting StayLocal API server on http://localhost:8787..." -ForegroundColor Cyan
$serverJob = Start-Process -FilePath "$scriptDir\.tools\node\node.exe" -ArgumentList "$scriptDir\node_modules\tsx\dist\cli.mjs", "$scriptDir\server\src\index.ts" -PassThru -NoNewWindow

Start-Sleep -Seconds 2

Write-Host "2. Starting StayLocal Web Frontend on http://localhost:5173..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo Credentials:" -ForegroundColor Yellow
Write-Host "  Tourist: tourist@staylocal.demo | DemoPass123!" -ForegroundColor Yellow
Write-Host "  Host:    host@staylocal.demo    | DemoPass123!" -ForegroundColor Yellow
Write-Host "  Admin:   admin@staylocal.demo   | DemoPass123!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers." -ForegroundColor Gray
Write-Host ""

try {
    & "$scriptDir\.tools\node\node.exe" "$scriptDir\node_modules\vite\bin\vite.js" --host
} finally {
    if ($serverJob -and !$serverJob.HasExited) {
        Stop-Process -Id $serverJob.Id -Force -ErrorAction SilentlyContinue
    }
}
