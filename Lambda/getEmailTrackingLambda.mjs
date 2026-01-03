import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const campaignId = event.pathParameters?.id;
  console.log("Sự kiện event nhận được:", JSON.stringify(event));
  console.log("Campaign ID nhận được:", campaignId);

  if (!campaignId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Thiếu campaign_id trong path." }),
    };
  }

  const fullCampaignId = campaignId.startsWith('campaign#') ? campaignId : `campaign#${campaignId}`;
  console.log('fullCampaignId:', fullCampaignId);

  try {
    const params = {
      TableName: "EmailTracking",
      IndexName: "original_campaign_id-event_type-index", // Sử dụng index mới
      KeyConditionExpression: "original_campaign_id = :cid",
      ExpressionAttributeValues: {
        ":cid": fullCampaignId,
      },
      ScanIndexForward: false,
    };

    console.log("Tham số truy vấn DynamoDB:", JSON.stringify(params));

    const result = await ddb.send(new QueryCommand(params));
    console.log("Kết quả thô từ DynamoDB:", JSON.stringify(result));

    // Chuyển đổi và định dạng timestamp
    const formattedItems = (result.Items || []).map(item => {
      const timestamp = new Date(item.timestamp);
      timestamp.setUTCHours(timestamp.getUTCHours() + 7);
      const formattedTime = timestamp.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).replace(/,/, '').replace(/\//g, '-');
      return {
        ...item,
        timestamp: formattedTime
      };
    });

    console.log("Kết quả định dạng từ DynamoDB:", JSON.stringify(formattedItems));
    return {
      statusCode: 200,
      body: JSON.stringify({ tracking: formattedItems }),
    };
  } catch (err) {
    console.error("Lỗi truy vấn DynamoDB:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Lỗi server.", message: err.message }),
    };
  }
};