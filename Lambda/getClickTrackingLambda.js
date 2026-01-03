const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const campaignId = event.pathParameters?.id;
  const fullCampaignId = campaignId.startsWith('campaign#') ? campaignId : `campaign#${campaignId}`;
  const messageId = event.queryStringParameters?.message_id;
  const redirectUrl = event.queryStringParameters?.url;
  const recipient = event.queryStringParameters?.recipient;

  if (!campaignId || !messageId || !redirectUrl || !recipient) {
    console.error('Missing campaign_id, message_id, url, or recipient', { event });
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing campaign_id, message_id, url, or recipient' }),
    };
  }

  try {
    // Query để lấy original_campaign_id
    const campaignParams = {
      TableName: "EmailCampaigns",
      KeyConditionExpression: "#cid = :cid",
      ExpressionAttributeNames: { "#cid": "campaign_id" },
      ExpressionAttributeValues: { ":cid": fullCampaignId }
    };
    const campaignData = await dynamodb.query(campaignParams).promise();
    const originalCampaignId = campaignData.Items[0]?.original_campaign_id || fullCampaignId;

    // ✅ FIX: Cập nhật status trong EmailCampaigns
    if (campaignData.Items && campaignData.Items.length > 0) {
      for (const item of campaignData.Items) {
        try {
          await dynamodb.update({
            TableName: 'EmailCampaigns',
            Key: {
              campaign_id: item.campaign_id,
              email_id: item.email_id
            },
            UpdateExpression: 'SET #st = :clicked',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: { ':clicked': 'CLICKED' }
          }).promise();
          console.log(`✅ Updated campaign status to CLICKED: ${item.campaign_id}`);
        } catch (updateErr) {
          console.error('Error updating campaign status:', updateErr);
        }
      }
    }

    // Check if Click event exists for this recipient
    const checkParams = {
      TableName: 'EmailTracking',
      IndexName: 'message_id-recipient_primary-index',
      KeyConditionExpression: 'message_id = :mid AND recipient_primary = :rec',
      FilterExpression: 'event_type = :et',
      ExpressionAttributeValues: {
        ':mid': messageId,
        ':rec': recipient,
        ':et': 'Click'
      },
    };

    const existingItems = await dynamodb.query(checkParams).promise();
    
    if (existingItems.Items.length > 0) {
      // Update click count
      const existingItem = existingItems.Items[0];
      const clickTimestamps = existingItem.click_timestamps || [];
      clickTimestamps.push(new Date().toISOString());
      
      console.log('Click event found, updating click count:', { 
        messageId, 
        recipient, 
        existingItem,
        newClickCount: clickTimestamps.length 
      });
      
      await dynamodb.update({
        TableName: 'EmailTracking',
        Key: { 
          message_id: existingItem.message_id,
          event_type: existingItem.event_type
        },
        UpdateExpression: 'SET click_timestamps = :cts, #ts = :newts',
        ExpressionAttributeNames: {
          '#ts': 'timestamp'
        },
        ExpressionAttributeValues: { 
          ':cts': clickTimestamps,
          ':newts': new Date().toISOString()
        },
      }).promise();
      
      console.log('Successfully updated click count');
    } else {
      // Create new Click event
      const item = {
        message_id: messageId,
        event_type: 'Click',
        campaign_id: fullCampaignId,
        original_campaign_id: originalCampaignId,
        timestamp: new Date().toISOString(),
        recipients: [recipient],
        recipient_primary: recipient,
        click_timestamps: [new Date().toISOString()],
        raw_event: JSON.stringify({ 
          eventType: 'Click', 
          campaign_id: fullCampaignId, 
          original_campaign_id: originalCampaignId, 
          url: redirectUrl, 
          recipient: recipient 
        }),
      };
      
      console.log('No click event found, writing new item:', item);
      await dynamodb.put({
        TableName: 'EmailTracking',
        Item: item,
      }).promise();
    }

    console.log('Successfully recorded/updated click event and status for:', { messageId, recipient });
    
    // Redirect to original URL
    return {
      statusCode: 302,
      headers: { 'Location': redirectUrl },
      body: '',
    };
  } catch (err) {
    console.error('Error recording/updating click event:', err, { event });
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error recording click event', error: err.message }),
    };
  }
};