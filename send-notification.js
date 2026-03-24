// netlify/functions/send-notification.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { title, body, url } = JSON.parse(event.body);
    
    // Your webhook URL for push notifications (e.g., Discord, Slack, or custom webhook)
    const webhookUrl = process.env.PUSH_NOTIFICATION_WEBHOOK;
    
    if (!webhookUrl) {
      throw new Error('Webhook URL not configured');
    }
    
    const payload = {
      content: `**${title}**\n${body}\n\nView: ${url}`,
      username: 'CBE Registration Bot'
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
