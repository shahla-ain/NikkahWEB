/**
 * Netlify Functions wrapper
 * Located at: netlify/functions/api.js
 *
 * Netlify calls this file for all /api/* requests
 * (mapped via netlify.toml redirect rules)
 */
const { handler } = require('../../api/index.js');
exports.handler = handler;
