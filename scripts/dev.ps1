<#
.SYNOPSIS
    SmartPC Local Dev & Demo Orchestrator Script (DD-LOCAL-DEV-AUTOMATION)
.DESCRIPTION
    Automates environment diagnostics, Frontend UI demo, Backend execution,
    MySQL local database bootstrap, and Docker Compose orchestration.
.EXAMPLE
    .\scripts\dev.ps1
    .\scripts\dev.ps1 -Mode check
    .\scripts\dev.ps1 -Mode ui
    .\scripts\dev.ps1 -Mode full
    .\scripts\dev.ps1 -Mode setup-db
    .\scripts\dev.ps1 -Mode stop
#>

param(
    [Parameter(Position = 0)]
    [ValidateSet("menu", "check", "ui", "backend", "full", "docker", "infra", "setup-db", "stop", "help")]
    [string]$Mode = "menu",

    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Resolve project root paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$FrontendDir = Join-Path $ProjectRoot "frontend"
$BackendDir = Join-Path $ProjectRoot "backend"
$BackendJar = Join-Path $BackendDir "target\smartpc-backend-1.0.0-SNAPSHOT.jar"
$InitSqlPath = Join-Path $ProjectRoot "docker\mysql\init.sql"

$FrontendPort = 3000
$BackendPort = 8080
$MySqlPort = 3306
$RedisPort = 6379

# ============================================================================
# Helper Output Functions
# ============================================================================
function Write-Banner {
    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "   SMARTPC - LOCAL DEV & DEMO LAUNCHER (DD-LOCAL-DEV-AUTOMATION)      " -ForegroundColor Cyan
    Write-Host "======================================================================" -ForegroundColor Cyan
}

function Write-StatusLine {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Detail,
        [string]$Color = "Green"
    )
    $paddedName = $Name.PadRight(22)
    $paddedStatus = ("[$Status]").PadRight(10)
    Write-Host "  $paddedName " -NoNewline
    Write-Host $paddedStatus -ForegroundColor $Color -NoNewline
    Write-Host " $Detail"
}

# ============================================================================
# Environment Detector Functions
# ============================================================================
function Test-TcpPort {
    param([int]$Port)
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return ($null -ne $connections)
    } catch {
        return $false
    }
}

function Resolve-JavaEnvironment {
    # 1. Check if java is already in PATH
    $javaCmd = Get-Command java -ErrorAction SilentlyContinue
    if ($null -ne $javaCmd) {
        return $javaCmd.Source
    }

    # 2. Scan standard Windows JDK installation folders
    $searchRoots = @(
        "C:\Program Files\Java",
        "C:\Program Files\Eclipse Adoptium",
        "C:\Program Files\Microsoft",
        "C:\Program Files\BellSoft",
        "C:\Program Files\Amazon Corretto",
        "C:\Program Files\Zulu",
        "$env:USERPROFILE\.jdks",
        "$env:LOCALAPPDATA\Programs\Eclipse Adoptium"
    )

    foreach ($root in $searchRoots) {
        if (Test-Path $root) {
            $candidates = Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
            foreach ($dir in $candidates) {
                $javaExe = Join-Path $dir.FullName "bin\java.exe"
                if (Test-Path $javaExe) {
                    $env:JAVA_HOME = $dir.FullName
                    $env:Path = "$(Join-Path $dir.FullName 'bin');$env:Path"
                    return $javaExe
                }
            }
        }
    }
    return $null
}

function Resolve-MySqlClient {
    $mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
    if ($null -ne $mysqlCmd) {
        return $mysqlCmd.Source
    }
    $standardPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    if (Test-Path $standardPath) {
        return $standardPath
    }
    return $null
}

function Get-EnvironmentStatus {
    $javaExe = Resolve-JavaEnvironment
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
    $mvnCmd = Get-Command mvn -ErrorAction SilentlyContinue
    $dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
    $mysqlExe = Resolve-MySqlClient
    $mysqlSvc = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue | Select-Object -First 1

    $nodeVersion = if ($nodeCmd) { (& node -v 2>$null) } else { $null }
    $npmVersion = if ($npmCmd) { (& npm -v 2>$null) } else { $null }

    $javaVersion = $null
    if ($javaExe) {
        try {
            $verOut = cmd /c "`"$javaExe`" -version 2>&1"
            $javaVersion = ($verOut | Select-Object -First 1)
        } catch {
            $javaVersion = "Detected"
        }
    }

    return [PSCustomObject]@{
        HasNode         = ($null -ne $nodeCmd)
        NodeVersion     = $nodeVersion
        HasNpm          = ($null -ne $npmCmd)
        NpmVersion      = $npmVersion
        HasNodeModules  = (Test-Path (Join-Path $FrontendDir "node_modules"))
        HasJava         = ($null -ne $javaExe)
        JavaExe         = $javaExe
        JavaVersion     = $javaVersion
        HasMaven        = ($null -ne $mvnCmd)
        HasBackendJar   = (Test-Path $BackendJar)
        HasDocker       = ($null -ne $dockerCmd)
        HasMySqlClient  = ($null -ne $mysqlExe)
        MySqlExe        = $mysqlExe
        MySqlService    = if ($mysqlSvc) { "$($mysqlSvc.Name) ($($mysqlSvc.Status))" } else { "Not Found" }
        MySqlRunning    = (Test-TcpPort -Port $MySqlPort)
        RedisRunning    = (Test-TcpPort -Port $RedisPort)
        FrontendRunning = (Test-TcpPort -Port $FrontendPort)
        BackendRunning  = (Test-TcpPort -Port $BackendPort)
    }
}

function Show-EnvironmentReport {
    $status = Get-EnvironmentStatus
    Write-Banner
    Write-Host "  [1] TOOLCHAIN & DEPENDENCIES" -ForegroundColor Yellow

    if ($status.HasNode) {
        Write-StatusLine "Node.js & npm" "OK" "node $($status.NodeVersion) | npm v$($status.NpmVersion)" "Green"
    } else {
        Write-StatusLine "Node.js & npm" "MISSING" "Install via: winget install OpenJS.NodeJS.LTS" "Red"
    }

    if ($status.HasNodeModules) {
        Write-StatusLine "Frontend Packages" "READY" "frontend/node_modules installed" "Green"
    } else {
        Write-StatusLine "Frontend Packages" "PENDING" "Will auto-run 'npm install' on start" "Yellow"
    }

    if ($status.HasJava) {
        Write-StatusLine "Java Runtime (JDK)" "OK" "$($status.JavaVersion)" "Green"
    } else {
        Write-StatusLine "Java Runtime (JDK)" "MISSING" "Install via: winget install EclipseAdoptium.Temurin.21.JDK" "Yellow"
    }

    if ($status.HasMaven) {
        Write-StatusLine "Apache Maven" "OK" "mvn available in PATH" "Green"
    } elseif ($status.HasBackendJar) {
        Write-StatusLine "Backend Prebuilt JAR" "READY" "target/smartpc-backend-1.0.0-SNAPSHOT.jar found (Maven optional)" "Green"
    } else {
        Write-StatusLine "Apache Maven" "MISSING" "Install Maven or use Docker Compose" "Yellow"
    }

    if ($status.HasDocker) {
        Write-StatusLine "Docker Desktop" "OK" "docker CLI available" "Green"
    } else {
        Write-StatusLine "Docker Desktop" "OPTIONAL" "Not in PATH (Only needed for 'docker' or 'infra' modes)" "DarkGray"
    }

    Write-Host ""
    Write-Host "  [2] ACTIVE SERVICES & PORTS" -ForegroundColor Yellow

    if ($status.MySqlRunning) {
        Write-StatusLine "MySQL Server (3306)" "RUNNING" "Service: $($status.MySqlService)" "Green"
    } else {
        Write-StatusLine "MySQL Server (3306)" "STOPPED" "Service: $($status.MySqlService)" "Yellow"
    }

    if ($status.RedisRunning) {
        Write-StatusLine "Redis Cache (6379)" "RUNNING" "Listening on localhost:6379" "Green"
    } else {
        Write-StatusLine "Redis Cache (6379)" "OFFLINE" "Optional for UI demo" "DarkGray"
    }

    if ($status.BackendRunning) {
        Write-StatusLine "Backend API (8080)" "RUNNING" "http://localhost:8080/swagger-ui.html" "Green"
    } else {
        Write-StatusLine "Backend API (8080)" "STOPPED" "Not running" "DarkGray"
    }

    if ($status.FrontendRunning) {
        Write-StatusLine "Frontend UI (3000)" "RUNNING" "http://localhost:3000" "Green"
    } else {
        Write-StatusLine "Frontend UI (3000)" "STOPPED" "Not running" "DarkGray"
    }

    Write-Host "======================================================================" -ForegroundColor Cyan
    return $status
}

# ============================================================================
# Action Runners
# ============================================================================
function Start-FrontendService {
    param([bool]$OpenBrowserWindow = $true)

    $status = Get-EnvironmentStatus
    if (-not $status.HasNode) {
        Write-Host "[ERROR] (ENV-NODE-01) Node.js is not installed. Run: winget install OpenJS.NodeJS.LTS" -ForegroundColor Red
        exit 10
    }

    if (-not $status.HasNodeModules) {
        Write-Host "[INFO] (ENV-FE-DEPS) Installing frontend dependencies (npm install)..." -ForegroundColor Yellow
        Push-Location $FrontendDir
        try {
            & npm install
            if ($LASTEXITCODE -ne 0) { exit 11 }
        } finally {
            Pop-Location
        }
    }

    Write-Host ""
    Write-Host "----------------------------------------------------------------------" -ForegroundColor Green
    Write-Host "  Starting SmartPC Frontend (Vite + React 18) on http://localhost:3000" -ForegroundColor Green
    Write-Host "  Available Demo Routes:" -ForegroundColor White
    Write-Host "    - Storefront & Catalog (UC1a): http://localhost:3000/products" -ForegroundColor Cyan
    Write-Host "    - Admin Products & Specs (UC5): http://localhost:3000/admin/products" -ForegroundColor Cyan
    Write-Host "    - Admin Category Tree (UC5):    http://localhost:3000/admin/categories" -ForegroundColor Cyan
    Write-Host "  (Note: Built-in Mock Fallback is active automatically if Backend is off)" -ForegroundColor DarkGray
    Write-Host "----------------------------------------------------------------------" -ForegroundColor Green
    Write-Host ""

    if ($OpenBrowserWindow -and (-not $NoBrowser)) {
        Start-Job -ScriptBlock {
            Start-Sleep -Seconds 2
            Start-Process "http://localhost:3000"
        } | Out-Null
    }

    Push-Location $FrontendDir
    try {
        & npm run dev
    } finally {
        Pop-Location
    }
}

function Start-BackendService {
    $status = Get-EnvironmentStatus
    if (-not $status.HasJava) {
        Write-Host ""
        Write-Host "[ERROR] (ENV-JAVA-01) Java JDK is not installed or not in PATH." -ForegroundColor Red
        Write-Host "To run the Spring Boot Backend locally, install JDK 21+ or JDK 25 via winget:" -ForegroundColor Yellow
        Write-Host "    winget install EclipseAdoptium.Temurin.21.JDK" -ForegroundColor Cyan
        Write-Host "Or install Docker Desktop and run: .\dev.cmd docker" -ForegroundColor Cyan
        Write-Host "(Tip: You can still demo the Frontend right now with: .\dev.cmd ui)" -ForegroundColor Green
        exit 20
    }

    if (-not $status.MySqlRunning) {
        Write-Host "[WARN] (ENV-MYSQL-01) MySQL is not listening on port 3306. Attempting to start MySQL80 service..." -ForegroundColor Yellow
        Start-Service -Name "MySQL80" -ErrorAction SilentlyContinue
    }

    Write-Host "[INFO] Starting SmartPC Backend on http://localhost:8080 ..." -ForegroundColor Green
    Push-Location $BackendDir
    try {
        if ($status.HasMaven) {
            & mvn spring-boot:run
        } elseif ($status.HasBackendJar) {
            Write-Host "[INFO] Maven not in PATH; launching pre-packaged JAR: $BackendJar" -ForegroundColor Cyan
            & $status.JavaExe -jar $BackendJar
        } else {
            Write-Host "[ERROR] (ENV-BE-JAR) Neither Maven nor prebuilt JAR was found." -ForegroundColor Red
            exit 21
        }
    } finally {
        Pop-Location
    }
}

function Start-FullStackLocal {
    $status = Get-EnvironmentStatus
    if (-not $status.HasJava) {
        Write-Host ""
        Write-Host "[WARN] Java JDK is not installed yet, so Backend (Port 8080) cannot start locally." -ForegroundColor Yellow
        Write-Host "       Install JDK with: winget install EclipseAdoptium.Temurin.21.JDK" -ForegroundColor Cyan
        Write-Host "       Falling back to Frontend UI Demo mode (with built-in Mock Data)..." -ForegroundColor Green
        Start-Sleep -Seconds 2
        Start-FrontendService -OpenBrowserWindow $true
        return
    }

    if (-not $status.BackendRunning) {
        Write-Host "[INFO] Launching Backend in a separate PowerShell window..." -ForegroundColor Cyan
        $backendCmd = "Set-Location '$ProjectRoot'; & '$PSCommandPath' -Mode backend"
        Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendCmd
        Start-Sleep -Seconds 3
    } else {
        Write-Host "[INFO] Backend is already running on port 8080." -ForegroundColor Green
    }

    Start-FrontendService -OpenBrowserWindow $true
}

function Start-DockerEnvironment {
    param([bool]$InfraOnly = $false)

    $status = Get-EnvironmentStatus
    if (-not $status.HasDocker) {
        Write-Host "[ERROR] (ENV-DOCKER-01) Docker Desktop is not installed or not in PATH." -ForegroundColor Red
        Write-Host "Install Docker Desktop: winget install Docker.DockerDesktop" -ForegroundColor Yellow
        Write-Host "Or run Frontend Demo without Docker: .\dev.cmd ui" -ForegroundColor Green
        exit 40
    }

    Push-Location $ProjectRoot
    try {
        if ($InfraOnly) {
            Write-Host "[INFO] Starting infrastructure containers (mysql, redis, mailhog)..." -ForegroundColor Cyan
            & docker compose up -d mysql redis mailhog
        } else {
            Write-Host "[INFO] Starting full SmartPC stack via Docker Compose..." -ForegroundColor Cyan
            & docker compose up -d
            Write-Host ""
            Write-Host "  - Frontend UI:  http://localhost:3000" -ForegroundColor Green
            Write-Host "  - Swagger API:  http://localhost:8080/swagger-ui.html" -ForegroundColor Green
            Write-Host "  - Mailhog UI:   http://localhost:8025" -ForegroundColor Green
        }
    } finally {
        Pop-Location
    }
}

function Initialize-LocalDatabase {
    $status = Get-EnvironmentStatus
    if (-not $status.HasMySqlClient) {
        Write-Host "[ERROR] (ENV-MYSQL-01) mysql.exe client was not found." -ForegroundColor Red
        exit 30
    }

    if (-not $status.MySqlRunning) {
        Write-Host "[INFO] Starting Windows service MySQL80..." -ForegroundColor Yellow
        Start-Service -Name "MySQL80" -ErrorAction SilentlyContinue
    }

    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "  Bootstrap Local MySQL Database (smartpc_db & smartpc_user)" -ForegroundColor Cyan
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "Enter your local MySQL 'root' password to create smartpc_db and smartpc_user:" -ForegroundColor Yellow

    $sqlStatements = @"
CREATE DATABASE IF NOT EXISTS smartpc_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'smartpc_user'@'localhost' IDENTIFIED BY 'smartpc_password';
CREATE USER IF NOT EXISTS 'smartpc_user'@'%' IDENTIFIED BY 'smartpc_password';
GRANT ALL PRIVILEGES ON smartpc_db.* TO 'smartpc_user'@'localhost';
GRANT ALL PRIVILEGES ON smartpc_db.* TO 'smartpc_user'@'%';
FLUSH PRIVILEGES;
"@

    & $status.MySqlExe -u root -p -e $sqlStatements
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Database 'smartpc_db' and user 'smartpc_user' are ready!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to initialize MySQL database. Please verify your root password." -ForegroundColor Red
        exit 30
    }
}

function Stop-AllDevServices {
    Write-Banner
    Write-Host "[INFO] Stopping local development processes on ports $FrontendPort and $BackendPort..." -ForegroundColor Yellow

    foreach ($port in @($FrontendPort, $BackendPort)) {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($conns) {
            $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($procId in $pids) {
                if ($procId -gt 4) {
                    try {
                        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                        Write-Host "  -> Stopping process $($proc.ProcessName) (PID: $procId) on port $port" -ForegroundColor Cyan
                        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                    } catch {}
                }
            }
        } else {
            Write-Host "  -> Port $port is already free." -ForegroundColor DarkGray
        }
    }

    $status = Get-EnvironmentStatus
    if ($status.HasDocker) {
        Push-Location $ProjectRoot
        try {
            Write-Host "[INFO] Stopping Docker Compose containers (if any)..." -ForegroundColor Yellow
            & docker compose down 2>$null
        } finally {
            Pop-Location
        }
    }

    Write-Host "[OK] All SmartPC local dev services stopped." -ForegroundColor Green
}

function Show-Help {
    Write-Banner
    Write-Host "  USAGE:" -ForegroundColor Yellow
    Write-Host "    .\dev.cmd [mode] [-NoBrowser]"
    Write-Host "    .\scripts\dev.ps1 [-Mode <mode>] [-NoBrowser]"
    Write-Host ""
    Write-Host "  AVAILABLE MODES:" -ForegroundColor Yellow
    Write-Host "    menu       (Default) Show environment dashboard & interactive launcher menu"
    Write-Host "    ui         Start Frontend React/Vite dev server on http://localhost:3000"
    Write-Host "    backend    Start Spring Boot Backend on http://localhost:8080"
    Write-Host "    full       Start Backend + Frontend together (auto-fallback to UI if no JDK)"
    Write-Host "    setup-db   Create 'smartpc_db' and 'smartpc_user' in local Windows MySQL 8.0"
    Write-Host "    docker     Start full stack via 'docker compose up -d'"
    Write-Host "    infra      Start only MySQL, Redis, Mailhog containers via Docker"
    Write-Host "    check      Run pre-flight environment & port diagnostics"
    Write-Host "    stop       Stop running dev servers on ports 3000 / 8080 and Docker containers"
    Write-Host "    help       Show this help message"
    Write-Host ""
}

function Show-InteractiveMenu {
    $status = Show-EnvironmentReport
    Write-Host ""
    Write-Host "  SELECT AN ACTION TO RUN:" -ForegroundColor Yellow
    Write-Host "    [1] Start Frontend UI Demo immediately (http://localhost:3000)  [Recommended Now]" -ForegroundColor Green
    Write-Host "    [2] Start Full Local Dev (Backend :8080 + Frontend :3000)" -ForegroundColor Cyan
    Write-Host "    [3] Start Backend Only (Spring Boot :8080)" -ForegroundColor White
    Write-Host "    [4] Setup Local MySQL Database (Create smartpc_db & smartpc_user)" -ForegroundColor White
    Write-Host "    [5] Start Full Stack via Docker Compose (docker compose up -d)" -ForegroundColor White
    Write-Host "    [6] Stop All Running Services (Free ports 3000 & 8080)" -ForegroundColor White
    Write-Host "    [0] Exit" -ForegroundColor DarkGray
    Write-Host ""

    $choice = Read-Host "  Enter option [0-6] (Press Enter for [1])"
    if ([string]::IsNullOrWhiteSpace($choice)) {
        $choice = "1"
    }

    switch ($choice.Trim()) {
        "1" { Start-FrontendService -OpenBrowserWindow $true }
        "2" { Start-FullStackLocal }
        "3" { Start-BackendService }
        "4" { Initialize-LocalDatabase }
        "5" { Start-DockerEnvironment -InfraOnly $false }
        "6" { Stop-AllDevServices }
        "0" { Write-Host "Exiting." -ForegroundColor DarkGray; exit 0 }
        default {
            Write-Host "[WARN] Invalid option '$choice'." -ForegroundColor Yellow
            exit 1
        }
    }
}

# ============================================================================
# Main Mode Dispatcher
# ============================================================================
switch ($Mode) {
    "menu"     { Show-InteractiveMenu }
    "check"    { Show-EnvironmentReport | Out-Null }
    "ui"       { Start-FrontendService -OpenBrowserWindow $true }
    "backend"  { Start-BackendService }
    "full"     { Start-FullStackLocal }
    "docker"   { Start-DockerEnvironment -InfraOnly $false }
    "infra"    { Start-DockerEnvironment -InfraOnly $true }
    "setup-db" { Initialize-LocalDatabase }
    "stop"     { Stop-AllDevServices }
    "help"     { Show-Help }
}
