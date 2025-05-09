const S3_BUCKET = 'your-s3-bucket-name';
const AWS_ACCESS_KEY = 'your-aws-access-key';
const AWS_SECRET_KEY = 'your-aws-secret-key';
const AWS_REGION = 'your-region';

// Use a package for AWS SDK
import { S3 } from 'aws-sdk';

const s3 = new S3({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
  region: AWS_REGION,
});

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const cookies = parseCookies(request.headers.get("Cookie"));
  const sessionId = cookies.session;

  // Intercept requests where items are added to the basket
  if (path === "/add") {
    const item = url.searchParams.get("item");

    // Collect the request body data
    const requestBody = await request.text();
    const logData = {
      sessionId,
      item,
      body: requestBody,
      timestamp: new Date().toISOString(),
    };

    // Send the log data to S3
    await logToS3(logData);

    return new Response("Item added to basket", { status: 200 });
  }

  return new Response("Not Found", { status: 404 });
}

function parseCookies(cookieHeader) {
  return Object.fromEntries(
    (cookieHeader || "")
      .split("; ")
      .map(cookie => cookie.split("="))
  );
}

// Function to log the data to S3
async function logToS3(logData) {
  const logString = JSON.stringify(logData);

  const params = {
    Bucket: S3_BUCKET,
    Key: `logs/${new Date().toISOString()}.json`,
    Body: logString,
    ContentType: 'application/json',
  };

  try {
    await s3.putObject(params).promise();
    console.log('Log successfully uploaded to S3');
  } catch (error) {
    console.error('Error uploading log to S3:', error);
  }
}
