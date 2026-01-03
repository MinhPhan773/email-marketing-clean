const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  let campaignId = event.pathParameters?.id;
  if (!campaignId) {
    console.error('Không tìm thấy campaign_id trong pathParameters');
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "https://main.d1c35am1kqmp7j.amplifyapp.com" },
      body: JSON.stringify({ message: "Thiếu campaign_id" }),
    };
  }

  const fullCampaignId = campaignId.startsWith('campaign#') ? campaignId : `campaign#${campaignId}`;
  console.log('Full Campaign Id:', fullCampaignId);

  try {
    const campaignParams = {
      TableName: "EmailCampaigns",
      KeyConditionExpression: "#cid = :cid",
      ExpressionAttributeNames: { "#cid": "campaign_id" },
      ExpressionAttributeValues: { ":cid": fullCampaignId }
    };

    const campaignData = await docClient.query(campaignParams).promise();
    if (!campaignData.Items || campaignData.Items.length === 0) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "https://main.d1c35am1kqmp7j.amplifyapp.com" },
        body: JSON.stringify({ total_sent: 0, open_rate: 0, click_rate: 0, delivery: 0 }),
      };
    }

    const campaign = campaignData.Items[0];
    let totalSent = Array.isArray(campaign.recipients) ? campaign.recipients.length : 1;
    const timestamp = new Date(campaign.timestamp);
    timestamp.setUTCHours(timestamp.getUTCHours() + 7);
    const formattedTime = timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(/,/, '').replace(/\//g, '-');

    let totalOpen = 0, totalClick = 0, totalDelivery = 0;
    const processedRecipients = {
      Open: new Set(),
      Click: new Set(),
      Delivery: new Set()
    };

    // Sửa query để lấy cả original_campaign_id
    const trackingParams = {
      TableName: "EmailTracking",
      IndexName: "original_campaign_id-event_type-index", // Giả sử có index này
      KeyConditionExpression: "original_campaign_id = :cid",
      ExpressionAttributeValues: { ":cid": fullCampaignId },
    };

    const trackingData = await docClient.query(trackingParams).promise();
    console.log('Tracking data:', JSON.stringify(trackingData));
    for (const item of trackingData.Items) {
      const recipient = item.recipient_primary || item.recipients?.[0];
      if (!recipient) continue;

      if (item.event_type === "Open" && !processedRecipients.Open.has(recipient)) {
        totalOpen++;
        processedRecipients.Open.add(recipient);
      } else if (item.event_type === "Click" && !processedRecipients.Click.has(recipient)) {
        totalClick++;
        processedRecipients.Click.add(recipient);
      } else if (item.event_type === "Delivery" && !processedRecipients.Delivery.has(recipient)) {
        totalDelivery++;
        processedRecipients.Delivery.add(recipient);
      }
    }

    const openRate = totalSent > 0 ? Math.min((totalOpen / totalSent) * 100, 100) : 0;
    const clickRate = totalSent > 0 ? Math.min((totalClick / totalSent) * 100, 100) : 0;

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "https://main.d1c35am1kqmp7j.amplifyapp.com" },
      body: JSON.stringify({
        total_sent: totalSent,
        open_rate: openRate,
        click_rate: clickRate,
        delivery: totalDelivery,
        timestamp: formattedTime
      }),
    };
  } catch (err) {
    console.error("Lỗi truy vấn:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "https://main.d1c35am1kqmp7j.amplifyapp.com" },
      body: JSON.stringify({ message: "Lỗi server", error: err.message }),
    };
  }
};