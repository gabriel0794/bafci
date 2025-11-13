# BAFCI - Get Authentication Token Script (PowerShell)
# This script helps you get your auth token for API testing

Write-Host "==========================================" -ForegroundColor Green
Write-Host "  BAFCI - Get Authentication Token" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Get credentials
$EMAIL = Read-Host "Enter your email"
$PASSWORD = Read-Host "Enter your password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($PASSWORD)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Logging in..." -ForegroundColor Yellow
Write-Host ""

# Make login request
$body = @{
    email = $EMAIL
    password = $PlainPassword
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    if ($response.token) {
        Write-Host "✅ Login successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "Your Auth Token:" -ForegroundColor Cyan
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host $response.token -ForegroundColor Yellow
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "Test the SMS scheduler:" -ForegroundColor Cyan
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "curl -X POST http://localhost:5000/api/notifications/trigger-auto-sms \`" -ForegroundColor White
        Write-Host "  -H `"x-auth-token: $($response.token)`"" -ForegroundColor White
        Write-Host ""
        
        # Also save to clipboard if available
        try {
            $response.token | Set-Clipboard
            Write-Host "📋 Token copied to clipboard!" -ForegroundColor Green
        } catch {
            # Clipboard not available, skip
        }
    } else {
        Write-Host "❌ Login failed! No token received." -ForegroundColor Red
        Write-Host "Response: $response" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
