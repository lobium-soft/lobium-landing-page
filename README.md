# Lobium Landing Page

This repository contains the landing page for Lobium, a software service business. The landing page is designed to showcase Lobium's services, projects, technologies, and company information in a modern and professional manner. The landing page is currently deployed on AWS ECS and is accessible at https://lobium-soft.com.

## Project Stack

This project is built using the following technologies:

- **Pug** (formerly Jade): A template engine for Node.js that compiles to HTML
- **Sass/SCSS**: CSS preprocessor for advanced styling capabilities
- **Express.js**: Node.js web application framework for serving the application during development
- **Gulp**: Task runner for automating development workflows
- **Browser-Sync**: Tool for synchronized browser testing during development
- **Node.js**: JavaScript runtime environment for server-side execution

## Project Structure

```
lobium-landing-page/
├── dist/                  # Production build output directory
├── src/                   # Source files
│   ├── assets/            # Static assets (images, fonts, etc.)
│   ├── components/        # Reusable UI components
│   │   ├── base/          # Base styles and configurations
│   │   ├── section/       # Page sections
│   │   ├── footer/        # Footer components
│   │   └── ...            # Other component categories
│   └── index.pug          # Main page template
├── public/                # Public static files
├── build.js               # Static build script
├── gulpfile.js            # Gulp configuration
└── package.json           # Project dependencies and scripts
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lobium-soft/lobium-landing-page
   cd lobium-landing-page
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Development

To start the development server with hot reloading:

```bash
npm run dev
# or
yarn dev
```

This will start a development server at http://localhost:8000 (proxying from http://localhost:3000) with Browser-Sync enabled for live reloading.

### Production Build

To build the static site for production:

```bash
npm run build:static
# or
yarn build:static
```

This will generate the production-ready files in the `dist` directory.

### Starting Without Hot Reload

To start the server without hot reload:

```bash
npm start
# or
yarn start
```

This will start the Express server at http://localhost:3000.

## Features

- Responsive design for all device sizes
- Modern UI components
- Optimized for performance
- Easy to customize and extend
- Component-based architecture using Pug templates
- Sass styling with organized structure

## Deployment

### AWS ECS Deployment

This project is configured to automatically deploy to AWS ECS (Elastic Container Service) using GitHub Actions.

#### Deployment Process

1. **Push to the `deploy` branch**:
   ```bash
   git checkout -b deploy
   git push origin deploy
   ```

2. **GitHub Actions Workflow**:
   - The push to the `deploy` branch triggers the GitHub Actions workflow defined in `.github/workflows/aws-ecs-deploy.yml`
   - The workflow builds a Docker image and pushes it to Amazon ECR
   - It then creates or updates the ECS service with the new image

3. **Infrastructure Created**:
   - ECS Cluster: `lobium-cluster`
   - ECS Service: `lobium-service`
   - Load Balancer: `lobium-lb`
   - Target Group: `lobium-tg` (with health check on `/health` endpoint)

4. **Access the Deployed Application**:
   - The application will be available at https://lobium-soft.com

#### Prerequisites for Deployment

- AWS credentials (Access Key ID and Secret Access Key) configured as GitHub repository secrets:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
- The AWS user must have permissions for ECR, ECS, IAM, CloudWatch Logs, EC2, and Load Balancer services

#### Local Docker Testing

Before deploying, you can test the Docker container locally:

```bash
npm run start:docker
# or
yarn start:docker
```

This will build and run the Docker container locally, making the application available at http://localhost:8080.
