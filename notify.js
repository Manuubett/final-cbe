// Netlify serverless function — calls OneSignal API server-side (no CORS)
// Deploy: push to GitHub, Netlify auto-deploys functions in /netlify/functions/

exports.handler = async function(event, context) {
  // Only allow POST
  if(event.httpMethod !== 'POST'){
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Basic security — check secret key
  const SECRET = process.env.NOTIFY_SECRET || 'cbe-notify-2026';
  const body = JSON.parse(event.body || '{}');
  
  if(body.secret !== SECRET){
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const REST_KEY = process.env.ONESIGNAL_REST_KEY;
  const APP_ID   = '141d7cd0-8727-4066-a62c-8e0da7f85762';

  if(!REST_KEY){
    return { statusCode: 500, body: JSON.stringify({ error: 'REST key not configured' }) };
  }

  try{
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + REST_KEY
      },
      body: JSON.stringify({
        app_id:              APP_ID,
        included_segments:   ['Total Subscriptions'],
        headings:            { en: body.title  || '🏫 New Registration' },
        contents:            { en: body.message || 'A school is awaiting approval.' },
        url:                 body.url || 'https://bett-owner.netlify.app',
        priority:            10,
        android_sound:       'notification',
        android_led_color:   'FF1A56DB',
        android_visibility:  1
      })
    });

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };

  }catch(e){
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
