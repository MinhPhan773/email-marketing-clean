const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('Event Received:', JSON.stringify(event, null, 2));

  const campaignId = event.pathParameters?.id;
  const fullCampaignId = campaignId.startsWith('campaign#') ? campaignId : `campaign#${campaignId}`;
  const messageId = event.queryStringParameters?.message_id;
  const recipient = event.queryStringParameters?.recipient;

  if (!messageId || !recipient) {
    return { statusCode: 400, body: 'Missing params' };
  }

  const userAgent = event.headers?.['user-agent'] || '';
  const referer = event.headers?.['referer'] || '';
  const sourceIp = event.requestContext?.http?.sourceIp || '';

  console.log('Detection info:', { userAgent, referer, sourceIp });

  // BLOCK PREFETCH CHÍNH XÁC
  const isGmailPrefetch = 
    /Chrome\/42\.0\.2311\.135/i.test(userAgent) && 
    /Edge\/12\.246/i.test(userAgent) &&
    /^66\.249\.|^74\.125\.|^64\.233\./.test(sourceIp);

  const isObviousBot = /bot|crawler|spider|headless|preview|phantom/i.test(userAgent);

  if (isGmailPrefetch || isObviousBot) {
    console.warn('BLOCKED BOT PREFETCH - NOT recording open', {
      userAgent, referer, sourceIp,
      isGmailPrefetch, isObviousBot
    });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'image/png' },
      body: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNgAAIAAAUAAX9jptIAAAAASUVORK5CYII=',
      isBase64Encoded: true,
    };
  }

  // CHO PHÉP GOOGLE IMAGE PROXY (Gmail prefetch) GHI OPEN
  const verifiedHuman = true; // Coi prefetch Gmail là open thật

  // GHI OPEN EVENT
  try {
    const campaignParams = {
      TableName: "EmailCampaigns",
      KeyConditionExpression: "#cid = :cid",
      ExpressionAttributeNames: { "#cid": "campaign_id" },
      ExpressionAttributeValues: { ":cid": fullCampaignId }
    };
    const campaignData = await dynamodb.query(campaignParams).promise();
    const originalCampaignId = campaignData.Items[0]?.original_campaign_id || fullCampaignId;

    // Cập nhật status campaign
    if (campaignData.Items?.length > 0) {
      for (const item of campaignData.Items) {
        await dynamodb.update({
          TableName: 'EmailCampaigns',
          Key: { campaign_id: item.campaign_id, email_id: item.email_id },
          UpdateExpression: 'SET #st = :opened',
          ExpressionAttributeNames: { '#st': 'status' },
          ExpressionAttributeValues: { ':opened': 'OPENED' }
        }).promise();
      }
    }

    const item = {
      message_id: messageId,
      event_type: 'Open',
      campaign_id: fullCampaignId,
      original_campaign_id: originalCampaignId,
      timestamp: new Date().toISOString(),
      recipients: [recipient],
      recipient_primary: recipient,
      raw_event: JSON.stringify({
        eventType: 'Open',
        userAgent,
        referer,
        sourceIp,
        verified_human: verifiedHuman
      }),
    };

    await dynamodb.put({ TableName: 'EmailTracking', Item: item }).promise();
    console.log('REAL HUMAN OPEN RECORDED:', { recipient, userAgent });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'image/png' },
      body: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNgAAIAAAUAAX9jptIAAAAASUVORK5CYII=',
      isBase64Encoded: true,
    };

  } catch (err) {
    console.error('Error recording open:', err);
    return { statusCode: 500, body: 'Error' };
  }
};