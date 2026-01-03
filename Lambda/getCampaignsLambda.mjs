import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

export const handler = async (event) => {
  try {
    const userId = event.queryStringParameters?.user_id;

    if (!userId) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Thiếu user_id trong query string" }),
      };
    }

    const params = {
      TableName: "EmailCampaigns",
    };

    const data = await client.send(new ScanCommand(params));
    const items = data.Items.map((item) => unmarshall(item));

    // ✅ FIX: Chỉ lấy regular campaign (loại bỏ drip campaigns)
    const campaigns = items.filter((item) =>
      item.campaign_id?.startsWith("campaign#") &&
      item.email_id?.startsWith("email#") &&
      item.user_id === userId &&
      item.campaign_type !== "drip" // ← THÊM FILTER NÀY
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({ campaigns })
    };
  } catch (error) {
    console.error("Lỗi truy vấn:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Lỗi truy xuất chiến dịch", error: error.message })
    };
  }
};