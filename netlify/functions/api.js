const serverless = require('serverless-http');

// Import the Express app (default export from TypeScript)
const { default: app } = require('../../dist/index.js');

// Export the serverless handler
exports.handler = serverless(app);