#!/bin/bash
# Simple AWS ECS deployment script for Lobium Landing Page

# Configuration - CHANGE THESE VALUES
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="336177900185"  # Your AWS Account ID

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment to AWS ECS...${NC}"

# Step 1: Create IAM execution role for ECS if it doesn't exist
echo -e "${YELLOW}Checking if ECS execution role exists...${NC}"
if ! aws iam get-role --role-name ecsTaskExecutionRole 2>/dev/null; then
  echo -e "${YELLOW}Creating ECS execution role...${NC}"
  
  # Create the role
  aws iam create-role \
    --role-name ecsTaskExecutionRole \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "ecs-tasks.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }' \
    --region $AWS_REGION
  
  # Attach the AmazonECSTaskExecutionRolePolicy to the role
  aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy \
    --region $AWS_REGION
  
  echo -e "${GREEN}ECS execution role created successfully.${NC}"
else
  echo -e "${GREEN}ECS execution role already exists.${NC}"
fi

# Step 2: Create ECR repository if it doesn't exist
echo -e "${YELLOW}Creating ECR repository if needed...${NC}"
aws ecr describe-repositories --repository-names lobium-landing-page --region $AWS_REGION > /dev/null 2>&1 || \
aws ecr create-repository --repository-name lobium-landing-page --region $AWS_REGION

# Step 3: Login to ECR
echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Step 4: Build the Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t lobium-landing-page .

# Step 5: Tag and push the image to ECR
echo -e "${YELLOW}Tagging and pushing image to ECR...${NC}"
docker tag lobium-landing-page:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/lobium-landing-page:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/lobium-landing-page:latest

# Step 6: Create CloudWatch log group if it doesn't exist
echo -e "${YELLOW}Creating CloudWatch log group if needed...${NC}"
aws logs describe-log-groups --log-group-name-prefix /ecs/lobium-landing-page --region $AWS_REGION > /dev/null 2>&1 || \
aws logs create-log-group --log-group-name /ecs/lobium-landing-page --region $AWS_REGION

# Step 7: Update the task definition with the correct values
echo -e "${YELLOW}Updating task definition...${NC}"
sed "s/ACCOUNT_ID/$AWS_ACCOUNT_ID/g; s/REGION/$AWS_REGION/g" aws/aws-ecs-task-definition.json > aws/task-definition-updated.json

# Step 8: Register the task definition
echo -e "${YELLOW}Registering task definition...${NC}"
TASK_DEFINITION=$(aws ecs register-task-definition \
  --cli-input-json file://aws/task-definition-updated.json \
  --execution-role-arn arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskExecutionRole \
  --region $AWS_REGION)

# Step 9: Create the ECS cluster if it doesn't exist
echo -e "${YELLOW}Creating ECS cluster if needed...${NC}"
aws ecs describe-clusters --clusters lobium-cluster --region $AWS_REGION | grep "clusterName" > /dev/null || \
aws ecs create-cluster --cluster-name lobium-cluster --region $AWS_REGION

# Step 10: Create security group for the service
echo -e "${YELLOW}Setting up networking...${NC}"
VPC_ID=$(aws ec2 describe-vpcs --query "Vpcs[0].VpcId" --output text --region $AWS_REGION)

# Check if security group exists
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=lobium-sg" --query "SecurityGroups[0].GroupId" --output text --region $AWS_REGION)

if [ "$SG_ID" == "None" ]; then
  echo -e "${YELLOW}Creating security group...${NC}"
  SG_ID=$(aws ec2 create-security-group --group-name lobium-sg --description "Security group for Lobium Landing Page" --vpc-id $VPC_ID --region $AWS_REGION --output text --query "GroupId")
  
  # Add inbound rules to security group
  aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION
  aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 8080 --cidr 0.0.0.0/0 --region $AWS_REGION
fi

# Get subnet IDs
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[0:2].SubnetId" --output text --region $AWS_REGION)
SUBNET_ID_1=$(echo $SUBNET_IDS | cut -d' ' -f1)
SUBNET_ID_2=$(echo $SUBNET_IDS | cut -d' ' -f2)

# Step 11: Check if service exists
echo -e "${YELLOW}Checking if ECS service exists...${NC}"
SERVICE_EXISTS=$(aws ecs describe-services --cluster lobium-cluster --services lobium-service --region $AWS_REGION | grep "ACTIVE")

if [ -z "$SERVICE_EXISTS" ]; then
  echo -e "${YELLOW}Creating load balancer...${NC}"
  # Create load balancer
  LB_ARN=$(aws elbv2 create-load-balancer --name lobium-lb --subnets $SUBNET_ID_1 $SUBNET_ID_2 --security-groups $SG_ID --region $AWS_REGION --query "LoadBalancers[0].LoadBalancerArn" --output text)
  
  # Create target group
  TG_ARN=$(aws elbv2 create-target-group --name lobium-tg --protocol HTTP --port 8080 --vpc-id $VPC_ID --target-type ip --health-check-path "/" --region $AWS_REGION --query "TargetGroups[0].TargetGroupArn" --output text)
  
  # Create listener
  aws elbv2 create-listener --load-balancer-arn $LB_ARN --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=$TG_ARN --region $AWS_REGION
  
  echo -e "${YELLOW}Creating ECS service...${NC}"
  # Create the service
  aws ecs create-service \
    --cluster lobium-cluster \
    --service-name lobium-service \
    --task-definition lobium-landing-page \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID_1],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$TG_ARN,containerName=lobium-landing-page,containerPort=8080" \
    --region $AWS_REGION
  
  # Get the DNS name of the load balancer
  LB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $LB_ARN --region $AWS_REGION --query "LoadBalancers[0].DNSName" --output text)
  echo -e "${GREEN}Service created! Your application will be available at: http://${LB_DNS}${NC}"
else
  echo -e "${YELLOW}Updating ECS service...${NC}"
  # Update the service
  aws ecs update-service \
    --cluster lobium-cluster \
    --service lobium-service \
    --task-definition lobium-landing-page \
    --force-new-deployment \
    --region $AWS_REGION
  
  # Get the DNS name of the load balancer
  LB_ARN=$(aws elbv2 describe-target-groups --names lobium-tg --region $AWS_REGION --query "TargetGroups[0].LoadBalancerArns[0]" --output text)
  LB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $LB_ARN --region $AWS_REGION --query "LoadBalancers[0].DNSName" --output text)
  echo -e "${GREEN}Service updated! Your application is available at: http://${LB_DNS}${NC}"
fi

echo -e "${GREEN}Deployment completed!${NC}"
