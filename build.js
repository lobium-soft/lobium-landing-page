/**
 * Standalone build script for Lobium Landing Page
 * Compatible with Apple Silicon (arm64) architecture
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sass = require('sass'); // Dart Sass implementation

// Paths
const PATHS = {
  src: `src`,
  dist: `dist`
};

// Utility functions
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

function copyFiles(src, dest, filter = null) {
  if (Array.isArray(src)) {
    src.forEach(pattern => {
      const files = findFiles(pattern);
      files.forEach(file => {
        const relativePath = path.relative(PATHS.src, file);
        const destPath = path.join(dest, relativePath);
        copyFile(file, destPath);
      });
    });
  } else {
    const files = findFiles(src);
    files.forEach(file => {
      const relativePath = path.relative(PATHS.src, file);
      const destPath = path.join(dest, relativePath);
      copyFile(file, destPath);
    });
  }
}

function copyFile(src, dest) {
  ensureDirectoryExists(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${src} -> ${dest}`);
}

function findFiles(pattern) {
  try {
    // Use find command for better glob support
    const cmd = `find ${PATHS.src} -type f -path "${pattern}" -not -path "*/node_modules/*" -not -path "*/\\.git/*"`;
    const result = execSync(cmd, { encoding: 'utf8' });
    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error(`Error finding files with pattern ${pattern}:`, error);
    return [];
  }
}

function compileSass(src, dest) {
  const files = findFiles(src);

  files.forEach(file => {
    try {
      const relativePath = path.relative(PATHS.src, file);
      const destPath = path.join(dest, relativePath.replace('.scss', '.css'));
      
      ensureDirectoryExists(path.dirname(destPath));
      
      const result = sass.compile(file, {
        style: 'expanded',
        sourceMap: false
      });
      
      fs.writeFileSync(destPath, result.css);
      console.log(`Compiled Sass: ${file} -> ${destPath}`);
    } catch (error) {
      console.error(`Error compiling Sass file ${file}:`, error);
    }
  });
}

function compilePug(src, dest) {
  try {
    // Use pug-cli to compile pug files
    const cmd = `npx pug ${src} --out ${dest} --pretty`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`Compiled Pug files from ${src} to ${dest}`);
  } catch (error) {
    console.error(`Error compiling Pug files:`, error);
  }
}

function deleteDirectory(dir) {
  if (fs.existsSync(dir)) {
    console.log(`Removing directory: ${dir}`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function build() {
  console.log('Starting build process...');
  
  // 1. Clean dist directory
  console.log('Cleaning dist directory...');
  deleteDirectory(PATHS.dist);
  
  // 2. Create necessary directories
  ensureDirectoryExists(PATHS.dist);
  
  // 3. Compile Sass
  console.log('Compiling Sass files...');
  compileSass(`${PATHS.src}/**/*.scss`, PATHS.dist);
  
  // 4. Compile Pug
  console.log('Compiling Pug files...');
  compilePug(`${PATHS.src}/*.pug`, PATHS.dist);
  
  // 5. Copy JS files
  console.log('Copying JS files...');
  copyFiles(`${PATHS.src}/**/*.js`, PATHS.dist);
  
  // 6. Copy fonts
  console.log('Copying fonts...');
  copyFiles([
    `${PATHS.src}/**/*.otf`,
    `${PATHS.src}/**/*.eot`,
    `${PATHS.src}/**/*.svg`,
    `${PATHS.src}/**/*.ttf`,
    `${PATHS.src}/**/*.woff`,
    `${PATHS.src}/**/*.woff2`
  ], PATHS.dist);
  
  // 7. Copy images
  console.log('Copying images...');
  copyFiles([
    `${PATHS.src}/**/*.png`,
    `${PATHS.src}/**/*.jpg`,
    `${PATHS.src}/**/*.gif`
  ], PATHS.dist);
  
  // 8. Copy other files
  console.log('Copying other files...');
  copyFiles([
    `${PATHS.src}/**/*.ico`,
    `${PATHS.src}/**/*.php`,
    `${PATHS.src}/**/*.json`,
    `${PATHS.src}/**/*.txt`,
    `${PATHS.src}/**/*.mp4`
  ], PATHS.dist);
  
  console.log('Build completed successfully!');
}

// Execute build
build().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});
