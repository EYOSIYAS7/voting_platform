#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

# Default variables
IMAGE_NAME="voting-platform-frontend"
NAMESPACE="bc-edge-apps"
DEFAULT_TAG="latest"

# Build-time variables for Besu network defaults
NEXT_PUBLIC_CONTRACT_ADDRESS="0x8c0c3B8f93d627519E7C2451e52B834Ae240598a"
NEXT_PUBLIC_BESU_RPC_URL="http://172.27.3.251/rpc"
NEXT_PUBLIC_BESU_WS_URL="ws://172.27.3.251/ws"
NEXT_PUBLIC_BESU_CHAIN_ID="1337"
NEXT_PUBLIC_BESU_CHAIN_NAME="Besu Network"

echo "========================================="
echo "Voting Platform Frontend Deployer"
echo "========================================="

# Ask for GHCR Org/User if not set
if [ -z "$GHCR_ORG_OR_USER" ]; then
    read -p "Enter your GitHub username or organization name for GHCR (e.g. 'myorg'): " GHCR_ORG_OR_USER
    if [ -z "$GHCR_ORG_OR_USER" ]; then
        echo "Error: GHCR username or organization is required."
        exit 1
    fi
fi
GHCR_ORG_OR_USER=$(echo "$GHCR_ORG_OR_USER" | tr '[:upper:]' '[:lower:]')

# Define full image tag
FULL_IMAGE_NAME="ghcr.io/${GHCR_ORG_OR_USER}/${IMAGE_NAME}:${DEFAULT_TAG}"

echo ""
echo "Configuration:"
echo "-----------------------------------------"
echo "Namespace:      $NAMESPACE"
echo "Image Name:     $FULL_IMAGE_NAME"
echo "RPC URL:        $NEXT_PUBLIC_BESU_RPC_URL"
echo "WS URL:         $NEXT_PUBLIC_BESU_WS_URL"
echo "Contract Addr:  $NEXT_PUBLIC_CONTRACT_ADDRESS"
echo "-----------------------------------------"
echo ""

echo "Step 1: Building Docker Image..."
docker build \
  --build-arg NEXT_PUBLIC_CONTRACT_ADDRESS="$NEXT_PUBLIC_CONTRACT_ADDRESS" \
  --build-arg NEXT_PUBLIC_BESU_RPC_URL="$NEXT_PUBLIC_BESU_RPC_URL" \
  --build-arg NEXT_PUBLIC_BESU_WS_URL="$NEXT_PUBLIC_BESU_WS_URL" \
  --build-arg NEXT_PUBLIC_BESU_CHAIN_ID="$NEXT_PUBLIC_BESU_CHAIN_ID" \
  --build-arg NEXT_PUBLIC_BESU_CHAIN_NAME="$NEXT_PUBLIC_BESU_CHAIN_NAME" \
  -t "$FULL_IMAGE_NAME" \
  ./frontend

echo "Step 2: Pushing image to GHCR..."
echo "If you are not logged in, run 'docker login ghcr.io' first."
docker push "$FULL_IMAGE_NAME"

echo "Step 3: Preparing Kubernetes manifests..."
# Create a temporary file with the replaced image namespace
TEMP_DEPLOYMENT_FILE=$(mktemp)
sed "s|image: ghcr.io/your-gh-username-or-org/voting-platform-frontend:latest|image: $FULL_IMAGE_NAME|g" k8s/deployment.yaml > "$TEMP_DEPLOYMENT_FILE"

echo "Step 4: Applying manifests to cluster in namespace '$NAMESPACE'..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f "$TEMP_DEPLOYMENT_FILE"
kubectl apply -f k8s/service.yaml

# Clean up temp file
rm -f "$TEMP_DEPLOYMENT_FILE"

echo "Step 5: Verifying deployment..."
kubectl rollout status deployment/voting-platform-frontend -n "$NAMESPACE"

echo ""
echo "Deployment completed successfully!"
echo "Access the frontend at: http://<NODE_IP>:30080"
echo "========================================="
