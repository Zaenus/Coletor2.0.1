const { exec } = require('child_process');
const path = require('path');

// Start the server
const serverProcess = exec('node server/server.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error starting server: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Server stderr: ${stderr}`);
  }
  console.log(`Server stdout: ${stdout}`);
});

// Open the index.html file in the default browser
const indexPath = path.join(__dirname, 'index.html');
exec(`start ${indexPath}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error opening index.html: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Index.html stderr: ${stderr}`);
  }
  console.log(`Index.html stdout: ${stdout}`);
});

// Close the server when the script is interrupted
process.on('SIGINT', () => {
  console.log('Closing server...');
  serverProcess.kill();
  process.exit();
});