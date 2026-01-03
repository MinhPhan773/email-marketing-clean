import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const campaignIdParam = event.pathParameters?.id;

  if (!campaignIdParam) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Thiếu campaign id" }),
    };
  }

  const campaignId = `campaign#${campaignIdParam}`;
  console.log("Attempting to delete campaign with campaignId:", campaignId);

  try {
    // Query để lấy tất cả email_id liên quan đến campaign_id
    const queryParams = {
      TableName: "EmailCampaigns",
      KeyConditionExpression: "campaign_id = :cid",
      ExpressionAttributeValues: {
        ":cid": campaignId,
      },
    };

    const queryResult = await ddb.send(new QueryCommand(queryParams));
    const items = queryResult.Items;

    if (!items || items.length === 0) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Không tìm thấy chiến dịch" }),
      };
    }

    // Xóa từng bản ghi
    for (const item of items) {
      const deleteParams = {
        TableName: "EmailCampaigns",
        Key: {
          campaign_id: item.campaign_id,
          email_id: item.email_id,
        },
      };
      await ddb.send(new DeleteCommand(deleteParams));
      console.log(`Deleted item with campaign_id: ${item.campaign_id}, email_id: ${item.email_id}`);
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Chiến dịch đã được xóa" }),
    };
  } catch (err) {
    console.error("Lỗi khi xóa chiến dịch:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Lỗi khi xóa chiến dịch", details: err.message }),
    };
  }
};