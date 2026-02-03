# Script to sync contract configuration from shared/ to frontend and backend
# Run this script whenever you update contract configuration

Write-Host "🔄 Syncing contract configuration..." -ForegroundColor Cyan

# Copy to frontend
Write-Host "📦 Copying to frontend..." -ForegroundColor Yellow
Copy-Item "shared/contract-abi.json" "frontend/src/config/contract-abi.json" -Force
Copy-Item "shared/contract-config.json" "frontend/src/config/contract-config.json" -Force
Write-Host "✅ Frontend updated" -ForegroundColor Green

# Copy to backend
Write-Host "📦 Copying to backend..." -ForegroundColor Yellow
Copy-Item "shared/contract-abi.json" "backend/src/config/contract-abi.json" -Force
Write-Host "✅ Backend updated" -ForegroundColor Green

Write-Host ""
Write-Host "✨ Contract configuration synced successfully!" -ForegroundColor Green
Write-Host "📝 Don't forget to commit and push the changes" -ForegroundColor Cyan
