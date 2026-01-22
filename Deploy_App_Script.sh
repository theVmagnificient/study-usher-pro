#!/bin/bash

# Application deployment script - deploys current build to existing infrastructure
# Usage: ./deploy-app.sh [stack-name] [region]

set -e

STACK_NAME="${1:-platform-smi-xaidos-com}"
REGION="${2:-us-east-1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting application deployment...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if stack exists
if ! aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" &> /dev/null; then
    echo -e "${RED}Error: Stack '$STACK_NAME' does not exist${NC}"
    echo -e "${YELLOW}Please run ./deploy-infra.sh first to create the infrastructure${NC}"
    exit 1
fi

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}dist/ directory not found. Building application...${NC}"
    npm run build
fi

# Get stack outputs
echo -e "${GREEN}Getting stack outputs...${NC}"
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
    --output text)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text)

CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
    --output text)

if [ -z "$BUCKET_NAME" ] || [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${RED}Error: Failed to get stack outputs${NC}"
    echo -e "${YELLOW}Make sure the stack has been deployed successfully${NC}"
    exit 1
fi

echo -e "${GREEN}Bucket: $BUCKET_NAME${NC}"
echo -e "${GREEN}Distribution ID: $DISTRIBUTION_ID${NC}"

# Upload files to S3
echo -e "${GREEN}Uploading files to S3...${NC}"
aws s3 sync dist/ "s3://$BUCKET_NAME/" \
    --delete \
    --region "$REGION"

# Invalidate CloudFront cache
echo -e "${GREEN}Invalidating CloudFront cache...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --region "$REGION" \
    --query 'Invalidation.Id' \
    --output text)

echo -e "${GREEN}Invalidation created: $INVALIDATION_ID${NC}"

# Display summary
echo -e "\n${GREEN}=== Application Deployment Complete ===${NC}"
echo -e "${GREEN}Website URL: https://platform.smi.xaidos.com${NC}"
echo -e "${GREEN}CloudFront URL: https://$CLOUDFRONT_DOMAIN${NC}"
echo -e "${YELLOW}Note: Changes may take a few minutes to propagate through CloudFront${NC}"
