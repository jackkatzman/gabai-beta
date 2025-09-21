const serverless = require('serverless-http');

// Import the Express app
const app = require('../../dist/index.js');

// Export the serverless handler
exports.handler = serverless(app);