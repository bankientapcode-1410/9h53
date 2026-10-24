@echo off
setlocal
REM ============================================================================
REM SmartPC Local Dev & Demo Wrapper (DD-LOCAL-DEV-AUTOMATION)
REM Usage:
REM   dev.cmd            -> Interactive Menu + Environment Status
REM   dev.cmd ui         -> Start Frontend UI Demo (http://localhost:3000)
REM   dev.cmd full       -> Start Backend + Frontend
REM   dev.cmd check      -> Check installed tools & ports
REM   dev.cmd setup-db   -> Initialize local MySQL smartpc_db
REM   dev.cmd stop       -> Stop running dev processes
REM ============================================================================

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\dev.ps1" %*
endlocal
