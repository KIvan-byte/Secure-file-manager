const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// This script checks for and installs required dependencies
console.log('Checking dependencies for secure-file-manager...');

// Check if node_modules exists
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('Node modules not found. Installing dependencies...');
  exec('npm install', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error installing dependencies: ${error.message}`);
      return;
    }
    console.log('Dependencies installed successfully.');
  });
} else {
  // Check for specific packages
  const requiredPackages = ['concurrently', 'wait-on'];
  const missingPackages = [];
  
  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg);
    } catch (e) {
      missingPackages.push(pkg);
    }
  }
  
  if (missingPackages.length > 0) {
    console.log(`Installing missing packages: ${missingPackages.join(', ')}...`);
    exec(`npm install --save-dev ${missingPackages.join(' ')}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error installing missing packages: ${error.message}`);
        return;
      }
      console.log('Missing packages installed successfully.');
      console.log('You can now run the application with "npm start"');
    });
  } else {
    console.log('All required packages are installed.');
    console.log('You can now run the application with "npm start"');
  }
}