# GitHub 커밋 및 푸시 실행기
# 토큰: .github-token.local 파일 또는 실행 시 직접 입력

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$TokenFile = Join-Path $ProjectRoot ".github-token.local"
$RemoteUrl = "https://github.com/kang314-cmd/asdf.git"
$Branch = "main"

Set-Location $ProjectRoot

function Get-GitHubToken {
    if (Test-Path $TokenFile) {
        $saved = (Get-Content $TokenFile -Raw).Trim()
        if ($saved) {
            Write-Host "저장된 토큰 파일을 사용합니다." -ForegroundColor DarkGray
            return $saved
        }
    }

    Write-Host ""
    Write-Host "토큰 파일이 없습니다. 직접 입력합니다." -ForegroundColor Yellow
    $tokenSecure = Read-Host "GitHub Personal Access Token" -AsSecureString
    if ($tokenSecure.Length -eq 0) { throw "토큰이 필요합니다. enter-token.bat 을 먼저 실행하세요." }

    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($tokenSecure)
    $plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    return $plain
}

function Invoke-Git {
    param([string[]]$Args)
    & git @Args
    if ($LASTEXITCODE -ne 0) { throw "git $($Args -join ' ') 실패 (exit $LASTEXITCODE)" }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ASDF → GitHub Push" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$token = Get-GitHubToken
$pushUrl = "https://${token}@github.com/kang314-cmd/asdf.git"

try {
    if (-not (Test-Path (Join-Path $ProjectRoot ".git"))) {
        Write-Host "[1/5] git init" -ForegroundColor Green
        Invoke-Git init
        Invoke-Git branch -M $Branch
    }

    Write-Host "[2/5] git add ." -ForegroundColor Green
    Invoke-Git add .

    $status = & git status --porcelain
    if (-not $status) {
        Write-Host "커밋할 변경 사항이 없습니다." -ForegroundColor Yellow
    } else {
        Write-Host "[3/5] git commit" -ForegroundColor Green
        $commitMsg = @"
ASDF 게임 공식 홈페이지 초기 구현

유저 게시판, 개발자 노트, 세계관, 업데이트 소식, 운영진 권한, 댓글 모더레이션, 우편함 기능 포함
"@
        Invoke-Git commit -m $commitMsg
    }

    $remotes = & git remote
    if ($remotes -notcontains "origin") {
        Write-Host "[4/5] git remote add origin" -ForegroundColor Green
        Invoke-Git remote add origin $RemoteUrl
    } else {
        Write-Host "[4/5] git remote set-url origin" -ForegroundColor Green
        Invoke-Git remote set-url origin $RemoteUrl
    }

    Write-Host "[5/5] git push" -ForegroundColor Green
    & git push -u $pushUrl $Branch
    if ($LASTEXITCODE -ne 0) { throw "git push 실패 (exit $LASTEXITCODE)" }

    Write-Host ""
    Write-Host "푸시 완료! → $RemoteUrl" -ForegroundColor Green
    Write-Host ""
}
finally {
    Remove-Variable -Name token -ErrorAction SilentlyContinue
    Remove-Variable -Name pushUrl -ErrorAction SilentlyContinue
}
