# GitHub Personal Access Token 입력 실행기
# 이 스크립트를 실행하면 토큰을 안전하게 저장합니다.
# 저장 후 Cursor 채팅에 "토큰 입력 완료"라고 알려주시면 AI가 푸시를 진행합니다.

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$TokenFile = Join-Path $ProjectRoot ".github-token.local"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GitHub Access Token 입력" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  저장 위치: .github-token.local (gitignore 처리됨)" -ForegroundColor DarkGray
Write-Host "  토큰은 GitHub에 커밋되지 않습니다." -ForegroundColor DarkGray
Write-Host ""

$tokenSecure = Read-Host "GitHub Personal Access Token을 입력하세요" -AsSecureString

if ($tokenSecure.Length -eq 0) {
    Write-Host "토큰이 입력되지 않았습니다." -ForegroundColor Red
    exit 1
}

$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($tokenSecure)
$plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

$plainToken | Out-File -FilePath $TokenFile -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "토큰이 저장되었습니다." -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "  1. Cursor 채팅에 '토큰 입력 완료' 라고 입력하세요." -ForegroundColor White
Write-Host "  2. AI가 커밋 및 푸시를 진행합니다." -ForegroundColor White
Write-Host ""
Write-Host "직접 푸시하려면 push-github.bat 을 실행하세요." -ForegroundColor DarkGray
Write-Host ""
