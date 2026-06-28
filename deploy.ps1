$ErrorActionPreference = "Stop"

# Default variables
$ImageName = "voting_platform"
$Namespace = "bc-edge-apps"
$DefaultTag = "latest"

# Build-time variables for Besu network defaults
$NextPublicContractAddress = "0x8c0c3B8f93d627519E7C2451e52B834Ae240598a"
$NextPublicBesuRpcUrl = "http://172.27.3.58:30425"
$NextPublicBesuWsUrl = "ws://172.27.3.58:32575"
$NextPublicBesuChainId = "1337"
$NextPublicBesuChainName = "Besu Network"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Voting Platform Frontend Deployer (PowerShell)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$GhcrOrgOrUser = Read-Host "Enter your GitHub username or organization name for GHCR (e.g. 'myorg')"
if ([string]::IsNullOrWhiteSpace($GhcrOrgOrUser)) {
    Write-Error "Error: GHCR username or organization is required."
    exit 1
}
$GhcrOrgOrUser = $GhcrOrgOrUser.ToLower()

$FullImageName = "ghcr.io/$GhcrOrgOrUser/$ImageName`:$DefaultTag"

Write-Host ""
Write-Host "Configuration:"
Write-Host "-----------------------------------------"
Write-Host "Namespace:      $Namespace"
Write-Host "Image Name:     $FullImageName"
Write-Host "RPC URL:        $NextPublicBesuRpcUrl"
Write-Host "WS URL:         $NextPublicBesuWsUrl"
Write-Host "Contract Addr:  $NextPublicContractAddress"
Write-Host "-----------------------------------------"
Write-Host ""

Write-Host "Step 1: Building Docker Image..." -ForegroundColor Yellow
docker build `
  --build-arg NEXT_PUBLIC_CONTRACT_ADDRESS="$NextPublicContractAddress" `
  --build-arg NEXT_PUBLIC_BESU_RPC_URL="$NextPublicBesuRpcUrl" `
  --build-arg NEXT_PUBLIC_BESU_WS_URL="$NextPublicBesuWsUrl" `
  --build-arg NEXT_PUBLIC_BESU_CHAIN_ID="$NextPublicBesuChainId" `
  --build-arg NEXT_PUBLIC_BESU_CHAIN_NAME="$NextPublicBesuChainName" `
  -t "$FullImageName" `
  ./frontend

Write-Host "Step 2: Pushing image to GHCR..." -ForegroundColor Yellow
Write-Host "If you are not logged in, run 'docker login ghcr.io' first."
docker push "$FullImageName"

Write-Host "Step 3: Preparing Kubernetes manifests..." -ForegroundColor Yellow
$DeploymentContent = Get-Content -Raw -Path "k8s/deployment.yaml"
$UpdatedDeploymentContent = $DeploymentContent -replace "image: ghcr.io/eyosiyas7/voting_platform:latest", "image: $FullImageName"

$TempDeploymentFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $TempDeploymentFile -Value $UpdatedDeploymentContent

Write-Host "Step 4: Applying manifests to cluster in namespace '$Namespace'..." -ForegroundColor Yellow
kubectl apply -f k8s/configmap.yaml
kubectl apply -f $TempDeploymentFile
kubectl apply -f k8s/service.yaml

Remove-Item -Path $TempDeploymentFile -Force

Write-Host "Step 5: Verifying deployment..." -ForegroundColor Yellow
kubectl rollout status deployment/voting-platform -n $Namespace

Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Access the frontend at: http://<NODE_IP>:30081" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
