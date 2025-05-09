import { AwsClient } from 'aws4fetch';

export default {
  async fetch(request, env, ctx) {
    // Log to S3
    try {
      const aws = new AwsClient({
        accessKeyId: env.AWS_KEY,
        secretAccessKey: env.AWS_SECRET_KEY,
        service: 's3',
        region: env.BUCKET_REGION,
      });

      const body = await request.text();
      const session = request.headers.get('Cookie') || 'no-session';
      const logData = `Session: ${session}\nURL: ${request.url}\nBody:\n${body}`;

      const now = new Date().toISOString();
      const key = `logs/${now}.txt`;

      const s3Url = `https://${env.BUCKET_NAME}.s3.${env.BUCKET_REGION}.amazonaws.com/${key}`;

      // Reconstruct the request because body was already consumed
      const logResponse = await aws.fetch(s3Url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: logData,
      });

      if (!logResponse.ok) {
        console.error(`Failed to log to S3: ${logResponse.status}`);
      }
    } catch (err) {
      console.error('Error logging to S3:', err);
    }

    // Forward original request (must re-create it if body was consumed)
    const newRequest = new Request(request, {
      body: request.body,
      redirect: 'follow',
    });

    return fetch(newRequest);
  },
};
