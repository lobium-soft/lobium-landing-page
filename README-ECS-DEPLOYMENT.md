# Simple AWS ECS Deployment Guide for Lobium Landing Page

This guide explains how to deploy the Lobium landing page to AWS ECS (Elastic Container Service) using a simple approach with a single instance and basic load balancer.

## Overview

The deployment uses:
- **AWS ECS with Fargate**: Serverless compute for containers
- **Application Load Balancer**: Routes traffic from port 80 to container port 8080
- **Amazon ECR**: Stores your Docker container image
- **Single instance**: Keeps costs low with just one container running

## Prerequisites

1. AWS CLI installed and configured with appropriate permissions
2. Docker installed on your local machine
3. Your AWS Account ID

## Setup Instructions

### 1. Edit the Deployment Script

Open `deploy-to-ecs.sh` and update the following values:

```bash
AWS_REGION="us-east-1"  # Change if you want to use a different region
AWS_ACCOUNT_ID="YOUR_AWS_ACCOUNT_ID"  # Replace with your actual AWS account ID
```

### 2. Run the Deployment Script

```bash
./deploy-to-ecs.sh
```

This single script will:
- Create an ECR repository for your Docker image
- Build and push your Docker image to ECR
- Create/update the ECS task definition
- Create a cluster, security group, and load balancer if needed
- Deploy your application with a single container instance

### 3. Access Your Application

After deployment completes, the script will output a URL where your application is accessible. It will look something like:
```
http://lobium-lb-12345678.us-east-1.elb.amazonaws.com
```

Your application will be accessible with basic authentication:
- Username: `lobium`
- Password: `jomathlobium`

## Understanding the Deployment

### Task Definition

The `aws-ecs-task-definition.json` file defines:
- Container image and port mappings (8080)
- CPU and memory allocation (256 CPU units, 512MB RAM)
- Environment variables
- Logging configuration

### Security

The deployment creates a security group that:
- Allows inbound traffic on port 80 (for the load balancer)
- Allows inbound traffic on port 8080 (for container access)

### Costs

This deployment is designed to be cost-effective by:
- Using a single container instance
- Using Fargate (pay only for what you use)
- Using minimal CPU and memory resources

## Troubleshooting

### Deployment Failures

If deployment fails, check:
1. AWS CLI credentials are correct
2. You have the necessary permissions in AWS
3. The AWS account ID is correct in the script

### Application Not Accessible

If you can't access your application:
1. Check if the ECS service is running:
   ```bash
   aws ecs describe-services --cluster lobium-cluster --services lobium-service
   ```
2. Check the container logs:
   ```bash
   aws logs get-log-events --log-group /ecs/lobium-landing-page --log-stream <log-stream-name>
   ```

### Updating the Application

To update your application after making changes:
1. Simply run the deployment script again:
   ```bash
   ./deploy-to-ecs.sh
   ```
   
The script will rebuild your Docker image, push it to ECR, and update the ECS service.
