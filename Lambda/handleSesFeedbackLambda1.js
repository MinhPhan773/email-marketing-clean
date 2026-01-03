const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      const snsMessage = record.Sns.Message;
      
      // ✅ Skip SES validation messages
      if (typeof snsMessage === 'string' && snsMessage.includes('Successfully validated SNS topic')) {
        console.log('ℹ️ Skipping SES validation message');
        continue;
      }
      
      // Parse JSON payload
      let payload;
      try {
        payload = JSON.parse(snsMessage);
      } catch (parseErr) {
        console.error('Failed to parse SNS message as JSON:', snsMessage);
        continue;
      }
      
      await handle_event(payload);
    }
    return {
      statusCode: 200,
      body: JSON.stringify('Processed SES feedback event(s).')
    };
  } catch (err) {
    console.error('Error processing SNS event:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error processing SNS event', error: err.message })
    };
  }
};

function mapEventTypeToStatus(sesEventType) {
  const mapping = {
    'Send': 'SENT',
    'Delivery': 'SENT',
    'Open': 'OPENED',
    'Click': 'CLICKED',
    'Bounce': 'FAILED',
    'Complaint': 'FAILED',
    'Reject': 'FAILED',
    'Rendering Failure': 'FAILED'
  };
  const uiStatus = mapping[sesEventType] || sesEventType;
  console.log(`Mapped SES event "${sesEventType}" → UI status "${uiStatus}"`);
  return uiStatus;
}

function getStatusPriority(status) {
  const priorities = {
    'SCHEDULED': 0,
    'PENDING_VERIFICATION': 1,
    'SENT': 2,
    'OPENED': 3,
    'CLICKED': 4,
    'FAILED': 5  // ✅ FAILED có priority cao nhất
  };
  return priorities[status] || 0;
}

async function handle_event(event) {
  console.log('Payload:', JSON.stringify(event, null, 2));

  // ✅ FIX: Xử lý cả Send/Delivery/Open/Click events VÀ Bounce/Complaint events
  let sesEventType;
  let mail;
  let sesMessageId;
  let timestamp;
  let recipients;

  if (event.eventType) {
    // Standard events: Send, Delivery, Open, Click
    sesEventType = event.eventType;
    mail = event.mail || {};
    sesMessageId = mail.messageId;
    timestamp = mail.timestamp || new Date().toISOString();
    recipients = mail.destination || [];
  } else if (event.notificationType) {
    // Bounce/Complaint events
    sesEventType = event.notificationType; // "Bounce" or "Complaint"
    mail = event.mail || {};
    sesMessageId = mail.messageId;
    timestamp = event.bounce?.timestamp || event.complaint?.timestamp || mail.timestamp || new Date().toISOString();
    
    // Get recipients from bounced/complained recipients
    if (event.bounce?.bouncedRecipients) {
      recipients = event.bounce.bouncedRecipients.map(r => r.emailAddress);
    } else if (event.complaint?.complainedRecipients) {
      recipients = event.complaint.complainedRecipients.map(r => r.emailAddress);
    } else {
      recipients = mail.destination || [];
    }
  } else {
    console.error('❌ Unknown event format:', JSON.stringify(event));
    return;
  }

  if (!sesMessageId || !sesEventType) {
    console.error('Missing messageId or eventType', { sesMessageId, sesEventType });
    return;
  }

  const uiStatus = mapEventTypeToStatus(sesEventType);

  // ✅ IMPROVED: Tìm campaign với nhiều chiến lược
  let campaignInfo = null;
  
  // Strategy 1: Tìm qua EmailTracking (nhanh nhất nếu có Send event)
  campaignInfo = await lookup_via_tracking(sesMessageId);
  
  if (!campaignInfo && recipients.length > 0) {
    // Strategy 2: Tìm trực tiếp trong EmailCampaigns theo recipients
    console.log('⏳ Trying direct lookup in EmailCampaigns...');
    campaignInfo = await lookup_via_campaigns_direct(recipients, timestamp);
  }
  
  if (!campaignInfo) {
    console.warn(`⚠️ No campaign found for SES MessageId: ${sesMessageId}`);
    
    // Still record to EmailTracking for debugging
    await dynamodb.put({
      TableName: 'EmailTracking',
      Item: {
        message_id: sesMessageId,
        ses_message_id: sesMessageId,
        event_type: sesEventType,
        timestamp: timestamp,
        recipients: recipients,
        recipient_primary: recipients[0] || null,
        raw_event: JSON.stringify(event)
      }
    }).promise();
    
    return;
  }

  console.log(`✅ Found campaign: ${campaignInfo.campaign_id}`);

  // Check priority
  const currentStatus = campaignInfo.status || 'SCHEDULED';
  const currentPriority = getStatusPriority(currentStatus);
  const newPriority = getStatusPriority(uiStatus);

  if (newPriority >= currentPriority) {
    await update_campaign_status(
      campaignInfo.campaign_id,
      campaignInfo.email_id,
      uiStatus
    );
    console.log(`✅ Updated status: ${currentStatus} → ${uiStatus}`);
  } else {
    console.log(`ℹ️ Skipped update: ${uiStatus} (priority ${newPriority}) < ${currentStatus} (priority ${currentPriority})`);
  }

  // Record to EmailTracking
  await dynamodb.put({
    TableName: 'EmailTracking',
    Item: {
      message_id: campaignInfo.tracking_message_id || sesMessageId,
      ses_message_id: sesMessageId,
      event_type: sesEventType,
      timestamp: timestamp,
      recipients: recipients,
      recipient_primary: recipients[0] || null,
      campaign_id: campaignInfo.campaign_id,
      original_campaign_id: campaignInfo.original_campaign_id || campaignInfo.campaign_id,
      raw_event: JSON.stringify(event)
    }
  }).promise();
  
  console.log(`✅ Recorded ${sesEventType} event to EmailTracking`);
}

// ✅ Strategy 1: Tìm qua EmailTracking (Send event)
async function lookup_via_tracking(sesMessageId) {
  try {
    const trackingResponse = await dynamodb.scan({
      TableName: 'EmailTracking',
      FilterExpression: 'ses_message_id = :msgid AND event_type = :send',
      ExpressionAttributeValues: {
        ':msgid': sesMessageId,
        ':send': 'Send'
      },
      Limit: 1
    }).promise();

    if (!trackingResponse.Items || trackingResponse.Items.length === 0) {
      console.log(`No Send event found in EmailTracking for: ${sesMessageId}`);
      return null;
    }

    const trackingItem = trackingResponse.Items[0];
    const campaignId = trackingItem.campaign_id;

    if (!campaignId) {
      console.log('No campaign_id in tracking item');
      return null;
    }

    // Get campaign from EmailCampaigns
    const campaignResponse = await dynamodb.query({
      TableName: 'EmailCampaigns',
      KeyConditionExpression: 'campaign_id = :cid',
      ExpressionAttributeValues: {
        ':cid': campaignId
      },
      Limit: 1
    }).promise();

    if (!campaignResponse.Items || campaignResponse.Items.length === 0) {
      console.log(`No campaign found in EmailCampaigns for ${campaignId}`);
      return null;
    }

    const campaign = campaignResponse.Items[0];
    console.log('✅ Found via EmailTracking:', {
      campaign_id: campaign.campaign_id,
      email_id: campaign.email_id
    });

    return {
      ...campaign,
      tracking_message_id: trackingItem.message_id,
      original_campaign_id: trackingItem.original_campaign_id || campaign.original_campaign_id
    };
  } catch (err) {
    console.error('Error in lookup_via_tracking:', err);
    return null;
  }
}

// ✅ Strategy 2: Tìm trực tiếp trong EmailCampaigns (fallback)
async function lookup_via_campaigns_direct(recipients, eventTimestamp) {
  if (!recipients || recipients.length === 0) {
    return null;
  }
  
  try {
    const primaryRecipient = recipients[0];
    const eventTime = new Date(eventTimestamp);
    const searchWindowStart = new Date(eventTime.getTime() - 5 * 60 * 1000); // 5 phút trước
    
    console.log(`Searching for recipient: ${primaryRecipient}, time window: ${searchWindowStart.toISOString()} - ${eventTime.toISOString()}`);
    
    // Scan EmailCampaigns để tìm campaign gần nhất
    const response = await dynamodb.scan({
      TableName: 'EmailCampaigns',
      FilterExpression: 'contains(recipients, :recipient) AND (#ts >= :startTime) AND (#ts <= :endTime)',
      ExpressionAttributeNames: {
        '#ts': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':recipient': primaryRecipient,
        ':startTime': searchWindowStart.toISOString(),
        ':endTime': eventTime.toISOString()
      }
    }).promise();
    
    if (response.Items && response.Items.length > 0) {
      // Sắp xếp theo thời gian gần nhất
      const sortedItems = response.Items.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      const campaign = sortedItems[0];
      console.log('✅ Found via direct search:', {
        campaign_id: campaign.campaign_id,
        email_id: campaign.email_id,
        timestamp: campaign.timestamp
      });
      
      return campaign;
    }
    
    console.log('No campaign found via direct search');
    return null;
  } catch (err) {
    console.error('Error in lookup_via_campaigns_direct:', err);
    return null;
  }
}

async function update_campaign_status(campaign_id, email_id, status) {
  try {
    await dynamodb.update({
      TableName: 'EmailCampaigns',
      Key: {
        campaign_id: campaign_id,
        email_id: email_id
      },
      UpdateExpression: 'SET #s = :status',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':status': status }
    }).promise();
    console.log('✅ Updated campaign status:', { campaign_id, email_id, status });
  } catch (err) {
    console.error('❌ Error updating campaign status:', err);
  }
}