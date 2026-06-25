param(
    [string]$RepoSlug = "ZhiKong0/review-baodian-apk"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

git config core.hooksPath .githooks
git config networkquiz.autoRelease true
git config networkquiz.releaseRepo $RepoSlug

Write-Host "Auto release hook installed."
Write-Host "Repo slug:" $RepoSlug
Write-Host "Hooks path:" (git config core.hooksPath)
