import { AwsClient } from 'aws4fetch';

export default {
  async fetch(request, env, ctx) {
    // Only log requests to /shop
    if (request.url.includes('/shop')) {
      // Clone request so body can be read
      const requestClone = request.clone();
      const logPromise = (async () => {
        try {
          const aws = new AwsClient({
            accessKeyId: env.AWS_KEY,
            secretAccessKey: env.AWS_SECRET_KEY,
            service: 's3',
            region: env.BUCKET_REGION,
          });

          const body = await requestClone.text();
          const session = request.headers.get('Cookie') || 'no-session';
          const logData = `Session: ${session}\nURL: ${request.url}\nBody:\n${body}`;

          const now = new Date().toISOString();
          const key = `logs/${now}.txt`;
          const s3Url = `https://${env.BUCKET_NAME}.s3.${env.BUCKET_REGION}.amazonaws.com/${key}`;

          await aws.fetch(s3Url, {
            method: 'PUT',
            headers: { 'Content-Type': 'text/plain' },
            body: logData,
          });
        } catch (err) {
          console.error('S3 logging failed:', err);
        }
      })();

      // Allow logging to run in background
      ctx.waitUntil(logPromise);
    }

    // Forward the request to the origin (your website's backend)
    return fetch(request);
  },
};
