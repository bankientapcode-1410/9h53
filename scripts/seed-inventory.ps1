<#
.SYNOPSIS
    SmartPC Warehouse & Inventory Seeding Script (DD-LOCAL-DEV-AUTOMATION v1.2)
.DESCRIPTION
    Populates or generates hardware products and warehouse inventory for MySQL
    (Local or Docker Compose), compatible with Flyway, Rule Engine (UC6) and PC Builder (UC2).
.EXAMPLE
    .\scripts\seed-inventory.ps1
    .\scripts\seed-inventory.ps1 -Target docker
    .\scripts\seed-inventory.ps1 -Reset
    .\scripts\seed-inventory.ps1 -GenerateRandom -Count 50
#>

param(
    [Parameter(Position = 0)]
    [ValidateSet("auto", "local", "docker")]
    [string]$Target = "auto",

    [Parameter(Position = 1)]
    [int]$Count = 28,

    [switch]$Reset,
    [switch]$GenerateRandom,
    [switch]$NoRules
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$SeedProductsSql = Join-Path $ScriptDir "seed-products.sql"
$SeedRulesSql = Join-Path $ScriptDir "seed-compat-rules.sql"

$LocalPort = 3306
$DockerPort = 3307
$DbName = "smartpc_db"
$DbUser = "smartpc_user"
$DbPass = "smartpc_password"

function Write-Banner {
    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "   SMARTPC - PRODUCT INVENTORY SEEDER & GENERATOR (v1.2)              " -ForegroundColor Cyan
    Write-Host "======================================================================" -ForegroundColor Cyan
}

function Test-PortListening {
    param([int]$Port)
    try {
        $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return ($null -ne $conns)
    } catch {
        return $false
    }
}

function Resolve-MySqlExe {
    $mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
    if ($null -ne $mysqlCmd) { return $mysqlCmd.Source }
    $stdPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    if (Test-Path $stdPath) { return $stdPath }
    return $null
}

function Test-DockerContainerRunning {
    param([string]$ContainerName)
    $dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $dockerCmd) { return $false }
    try {
        $out = & docker ps --filter "name=$ContainerName" --filter "status=running" --format "{{.Names}}" 2>$null
        return ($out -match $ContainerName)
    } catch {
        return $false
    }
}

function Execute-SqlTarget {
    param(
        [string]$TargetMode,
        [string]$SqlContent,
        [string]$MySqlExe
    )

    if ($TargetMode -eq "docker") {
        # Pipe SQL directly into running docker container
        $procInfo = New-Object System.Diagnostics.ProcessStartInfo
        $procInfo.FileName = "docker"
        $procInfo.Arguments = "exec -i smartpc-mysql mysql --default-character-set=utf8mb4 -u$DbUser -p$DbPass $DbName"
        $procInfo.RedirectStandardInput = $true
        $procInfo.RedirectStandardOutput = $true
        $procInfo.RedirectStandardError = $true
        $procInfo.UseShellExecute = $false
        $procInfo.StandardOutputEncoding = [System.Text.Encoding]::UTF8
        $procInfo.StandardErrorEncoding = [System.Text.Encoding]::UTF8

        $proc = [System.Diagnostics.Process]::Start($procInfo)
        $sw = New-Object System.IO.StreamWriter($proc.StandardInput.BaseStream, [System.Text.Encoding]::UTF8)
        $sw.Write($SqlContent)
        $sw.Flush()
        $sw.Close()

        $stdout = $proc.StandardOutput.ReadToEnd()
        $stderr = $proc.StandardError.ReadToEnd()
        $proc.WaitForExit()

        if ($proc.ExitCode -ne 0 -and ($stderr -notmatch "Using a password on the command line interface can be insecure")) {
            throw "Docker MySQL Error: $stderr"
        }
        return $stdout
    } else {
        # Local MySQL execution via mysql.exe
        if (-not $MySqlExe) {
            throw "mysql.exe not found on local machine. Install MySQL CLI or run with -Target docker"
        }
        $procInfo = New-Object System.Diagnostics.ProcessStartInfo
        $procInfo.FileName = $MySqlExe
        $procInfo.Arguments = "-h 127.0.0.1 -P 3306 --default-character-set=utf8mb4 -u$DbUser -p$DbPass $DbName"
        $procInfo.RedirectStandardInput = $true
        $procInfo.RedirectStandardOutput = $true
        $procInfo.RedirectStandardError = $true
        $procInfo.UseShellExecute = $false
        $procInfo.StandardOutputEncoding = [System.Text.Encoding]::UTF8
        $procInfo.StandardErrorEncoding = [System.Text.Encoding]::UTF8

        $proc = [System.Diagnostics.Process]::Start($procInfo)
        $sw = New-Object System.IO.StreamWriter($proc.StandardInput.BaseStream, [System.Text.Encoding]::UTF8)
        $sw.Write($SqlContent)
        $sw.Flush()
        $sw.Close()

        $stdout = $proc.StandardOutput.ReadToEnd()
        $stderr = $proc.StandardError.ReadToEnd()
        $proc.WaitForExit()

        if ($proc.ExitCode -ne 0 -and ($stderr -notmatch "Using a password on the command line interface can be insecure")) {
            throw "Local MySQL Error: $stderr"
        }
        return $stdout
    }
}

# ============================================================================
# Main Execution
# ============================================================================
Write-Banner

$mysqlExe = Resolve-MySqlExe
$hasLocalMySql = (Test-PortListening -Port $LocalPort)
$hasDockerContainer = (Test-DockerContainerRunning -ContainerName "smartpc-mysql")

$resolvedTarget = $Target
if ($Target -eq "auto") {
    if ($hasDockerContainer) {
        $resolvedTarget = "docker"
        Write-Host "  [Auto-Detect] Docker container 'smartpc-mysql' is running -> Using Docker target." -ForegroundColor Green
    } elseif ($hasLocalMySql) {
        $resolvedTarget = "local"
        Write-Host "  [Auto-Detect] Local MySQL listening on port $LocalPort -> Using Local MySQL target." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Neither Local MySQL (3306) nor Docker container 'smartpc-mysql' is currently reachable." -ForegroundColor Red
        Write-Host "Please start services first using: .\dev.cmd docker  OR  .\dev.cmd infra" -ForegroundColor Yellow
        exit 32
    }
} elseif ($Target -eq "docker" -and -not $hasDockerContainer) {
    Write-Host "[ERROR] Docker container 'smartpc-mysql' is not running. Run: .\dev.cmd docker" -ForegroundColor Red
    exit 32
} elseif ($Target -eq "local" -and -not $hasLocalMySql) {
    Write-Host "[ERROR] Local MySQL is not listening on port 3306." -ForegroundColor Red
    exit 32
}

Write-Host "  -> Target Database: $resolvedTarget ($DbName @ $DbUser)" -ForegroundColor Cyan

# 1. Reset if requested
if ($Reset) {
    Write-Host "[INFO] Resetting existing warehouse products and dependent tables..." -ForegroundColor Yellow
    $resetSql = @"
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE product_embeddings;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE order_details;
TRUNCATE TABLE products;
SET FOREIGN_KEY_CHECKS = 1;
"@
    Execute-SqlTarget -TargetMode $resolvedTarget -SqlContent $resetSql -MySqlExe $mysqlExe | Out-Null
    Write-Host "  [OK] Cleared products, product_embeddings, cart_items, order_details." -ForegroundColor Green
}

# 2. Seed Compatibility Rules & Categories (if needed)
if (-not $NoRules -and (Test-Path $SeedRulesSql)) {
    Write-Host "[INFO] Ensuring categories and compatibility rules exist (seed-compat-rules.sql)..." -ForegroundColor Cyan
    $rulesSql = [System.IO.File]::ReadAllText($SeedRulesSql, [System.Text.Encoding]::UTF8)
    Execute-SqlTarget -TargetMode $resolvedTarget -SqlContent $rulesSql -MySqlExe $mysqlExe | Out-Null
    Write-Host "  [OK] Categories and Rules verified." -ForegroundColor Green
}

# 3. Seed Base Products (28 items across 8 categories)
if (Test-Path $SeedProductsSql) {
    Write-Host "[INFO] Seeding base warehouse product catalog (seed-products.sql)..." -ForegroundColor Cyan
    $productsSql = [System.IO.File]::ReadAllText($SeedProductsSql, [System.Text.Encoding]::UTF8)
    Execute-SqlTarget -TargetMode $resolvedTarget -SqlContent $productsSql -MySqlExe $mysqlExe | Out-Null
    Write-Host "  [OK] Base hardware products inserted (INSERT IGNORE)." -ForegroundColor Green
} else {
    Write-Host "[WARN] $SeedProductsSql not found." -ForegroundColor Yellow
}

# 4. Generate Additional Random Products (if -GenerateRandom is specified)
if ($GenerateRandom -and $Count -gt 28) {
    $extraCount = $Count - 28
    Write-Host "[INFO] Generating $extraCount additional synthetic products to reach $Count items..." -ForegroundColor Cyan

    $categories = @(
        @{ code="CPU"; id="c0000001-0000-0000-0000-000000000001" },
        @{ code="MOTHERBOARD"; id="c0000001-0000-0000-0000-000000000002" },
        @{ code="RAM"; id="c0000001-0000-0000-0000-000000000003" },
        @{ code="GPU"; id="c0000001-0000-0000-0000-000000000004" },
        @{ code="SSD_M2"; id="c0000001-0000-0000-0000-000000000005" },
        @{ code="PSU"; id="c0000001-0000-0000-0000-000000000006" },
        @{ code="CASE"; id="c0000001-0000-0000-0000-000000000007" },
        @{ code="CPU_COOLER"; id="c0000001-0000-0000-0000-000000000008" }
    )

    $brands = @("ASUS", "MSI", "GIGABYTE", "CORSAIR", "KINGSTON", "SAMSUNG", "NZXT", "DEEPCOOL", "THERMALRIGHT")

    $rows = @()

    for ($i = 1; $i -le $extraCount; $i++) {
        $cat = $categories[$i % $categories.Count]
        $brand = $brands[$i % $brands.Count]
        $guid = [Guid]::NewGuid().ToString()
        $price = [Math]::Round((Get-Random -Minimum 800 -Maximum 35000) * 1000, -3)
        $stock = Get-Random -Minimum 5 -Maximum 50
        $benchmark = [Math]::Round((Get-Random -Minimum 650 -Maximum 980) / 10.0, 1)

        $specsJson = "{}"
        $name = ""

        switch ($cat.code) {
            "CPU" {
                $socket = if ($i % 2 -eq 0) { "LGA1700" } else { "AM5" }
                $cores = if ($i % 2 -eq 0) { 16 } else { 8 }
                $tdp = if ($i % 2 -eq 0) { 125 } else { 105 }
                $name = "CPU $brand Custom Edition X$i ($socket, $cores Cores)"
                $specsJson = "{`"socket_type`":`"$socket`",`"tdp_w`":$tdp,`"core_count`":$cores,`"thread_count`":$($cores*2),`"integrated_graphics`":true}"
            }
            "MOTHERBOARD" {
                $socket = if ($i % 2 -eq 0) { "LGA1700" } else { "AM5" }
                $form = if ($i % 3 -eq 0) { "Micro-ATX" } else { "ATX" }
                $name = "Mainboard $brand Pro Gaming V$i ($socket, $form)"
                $specsJson = "{`"supported_sockets`":[`"$socket`"],`"form_factor`":`"$form`",`"supported_memory_types`":[`"DDR5`"],`"ram_slots`":4,`"max_ram_gb`":192,`"m2_slots`":3,`"max_pcie_gen`":5.0}"
            }
            "RAM" {
                $name = "RAM $brand Performance DDR5 32GB Kit (2x16GB) 6000MHz #$i"
                $specsJson = "{`"memory_type`":`"DDR5`",`"capacity_gb`":32,`"bus_speed_mhz`":6000,`"modules_per_kit`":2}"
            }
            "GPU" {
                $vram = if ($i % 2 -eq 0) { 16 } else { 12 }
                $name = "VGA $brand GeForce OC Edition $vram GB GDDR6X #$i"
                $specsJson = "{`"vram_gb`":$vram,`"length_mm`":285.0,`"tdp_w`":220,`"recommended_psu_w`":650,`"pcie_gen`":4.0,`"vram_type`":`"GDDR6X`"}"
            }
            "SSD_M2" {
                $name = "SSD $brand NVMe M.2 1TB Gen 4x4 Pro Series #$i"
                $specsJson = "{`"interface_type`":`"NVMe PCIe 4.0`",`"capacity_gb`":1000,`"read_speed_mbps`":7000,`"tdp_w`":7.5}"
            }
            "PSU" {
                $name = "PSU $brand Gold Edition 750W Full Modular #$i"
                $specsJson = "{`"rated_wattage_w`":750,`"efficiency_rating`":`"80 Plus Gold`",`"form_factor`":`"ATX`"}"
            }
            "CASE" {
                $name = "Case $brand Gaming Airflow Glass Edition #$i"
                $specsJson = "{`"supported_form_factors`":[`"ATX`",`"Micro-ATX`"],`"max_gpu_length_mm`":380.0,`"max_cooler_height_mm`":175.0}"
            }
            "CPU_COOLER" {
                $name = "Cooler $brand Liquid Cooler AIO 240 ARGB #$i"
                $specsJson = "{`"supported_sockets`":[`"LGA1700`",`"AM5`"],`"cooler_type`":`"AIO_240`",`"height_mm`":52.0,`"tdp_w`":250.0}"
            }
        }

        $imgUrl = "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80"
        $desc = "Genuine computer hardware component from $brand, rigorous testing standard, 36 months warranty."

        $row = "('$guid', '$name', '$brand', '$desc', '$specsJson', '$imgUrl', '[]', $price, $stock, $benchmark, 'SYNCED', true, '$($cat.id)', 0, NOW(), NOW())"
        $rows += $row
    }

    $randomSql = "INSERT IGNORE INTO products (product_id, name, brand, description, specs, image_url, gallery_urls, price, stock_quantity, benchmark_score, sync_status, is_active, category_id, version, created_at, updated_at) VALUES `n"
    $randomSql += ($rows -join ",`n") + ";"
    Execute-SqlTarget -TargetMode $resolvedTarget -SqlContent $randomSql -MySqlExe $mysqlExe | Out-Null
    Write-Host "  [OK] Generated and inserted $extraCount additional items." -ForegroundColor Green
}

# 5. Inventory Summary Report
Write-Host ""
Write-Host "----------------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "  SMARTPC WAREHOUSE INVENTORY SUMMARY REPORT                          " -ForegroundColor Yellow
Write-Host "----------------------------------------------------------------------" -ForegroundColor Yellow

$summaryQuery = @"
SELECT 
    c.category_code,
    c.category_name,
    COUNT(p.product_id) AS total_products,
    COALESCE(SUM(p.stock_quantity), 0) AS total_stock,
    COALESCE(SUM(p.price * p.stock_quantity), 0) AS total_inventory_value_vnd
FROM categories c
LEFT JOIN products p ON c.category_id = p.category_id AND p.deleted_at IS NULL
WHERE c.parent_category_id IS NOT NULL
GROUP BY c.category_id, c.category_code, c.category_name
ORDER BY c.category_code;

SELECT 
    COUNT(product_id) AS grand_total_products,
    COALESCE(SUM(stock_quantity), 0) AS grand_total_units,
    COALESCE(SUM(price * stock_quantity), 0) AS grand_total_valuation_vnd,
    SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock_products
FROM products
WHERE deleted_at IS NULL;
"@

try {
    $reportOut = Execute-SqlTarget -TargetMode $resolvedTarget -SqlContent $summaryQuery -MySqlExe $mysqlExe
    Write-Host $reportOut -ForegroundColor White
} catch {
    Write-Host "[INFO] Seed completed successfully. (Summary query skipped: $_)" -ForegroundColor DarkGray
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  [SUCCESS] Warehouse inventory is ready for Storefront, PC Builder & API!" -ForegroundColor Green
Write-Host "  - Storefront Catalog: http://localhost:3000/products" -ForegroundColor Cyan
Write-Host "  - Admin Inventory:    http://localhost:3000/admin/products" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
