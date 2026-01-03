import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { SchedulerClient, DeleteScheduleCommand, ListSchedulesCommand } from "@aws-sdk/client-scheduler";

const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient);
const schedulerClient = new SchedulerClient({});

const TABLE_CAMPAIGNS = "EmailCampaigns";
const TABLE_TRACKING = "EmailTracking";

export const handler = async (event) => {
  const campaignIdParam = event.pathParameters?.id;

  if (!campaignIdParam) {
    return {
      statusCode: 400,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization,Content-Type"
      },
      body: JSON.stringify({ error: "Thiếu campaign id" }),
    };
  }

  const campaignId = campaignIdParam.startsWith("campaign#") 
    ? campaignIdParam 
    : `campaign#${campaignIdParam}`;
  
  console.log("Attempting to delete drip campaign:", campaignId);

  try {
    // 1. Query để lấy campaign và verify nó là drip campaign
    const queryParams = {
      TableName: TABLE_CAMPAIGNS,
      KeyConditionExpression: "campaign_id = :cid",
      ExpressionAttributeValues: { ":cid": campaignId },
    };

    const queryResult = await ddb.send(new QueryCommand(queryParams));
    const items = queryResult.Items;

    if (!items || items.length === 0) {
      return {
        statusCode: 404,
        headers: { 
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Authorization,Content-Type"
        },
        body: JSON.stringify({ error: "Không tìm thấy chiến dịch" }),
      };
    }

    // Verify đây là drip campaign
    const mainItem = items.find(i => i.email_id === "email#main");
    if (!mainItem || mainItem.campaign_type !== "drip") {
      return {
        statusCode: 400,
        headers: { 
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Authorization,Content-Type"
        },
        body: JSON.stringify({ error: "Đây không phải drip campaign" }),
      };
    }

    // 2. Xóa EventBridge Scheduler schedules
    try {
      // Tìm và xóa schedule cho drip follow-up
      const scheduleNamePattern = campaignId.replace(/[^a-zA-Z0-9-_.]/g, "-");
      
      // List schedules để tìm các schedule liên quan
      const listParams = {
        NamePrefix: `drip-`,
        MaxResults: 100
      };
      
      const schedules = await schedulerClient.send(new ListSchedulesCommand(listParams));
      
      // Tìm và xóa các schedule có chứa campaign ID
      for (const schedule of schedules.Schedules || []) {
        if (schedule.Name.includes(scheduleNamePattern) || 
            schedule.Name.includes(campaignIdParam)) {
          try {
            await schedulerClient.send(new DeleteScheduleCommand({
              Name: schedule.Name
            }));
            console.log(`Deleted schedule: ${schedule.Name}`);
          } catch (schedErr) {
            // Nếu schedule không tồn tại hoặc đã chạy xong thì bỏ qua
            if (schedErr.name !== "ResourceNotFoundException") {
              console.warn(`Error deleting schedule ${schedule.Name}:`, schedErr.message);
            }
          }
        }
      }
    } catch (schedError) {
      // Log nhưng không fail toàn bộ request nếu không xóa được schedule
      console.warn("Error cleaning up schedules:", schedError.message);
    }

    // 3. Xóa tracking data (optional - tùy bạn có muốn giữ lại không)
    try {
      const trackingQuery = {
        TableName: TABLE_TRACKING,
        IndexName: "campaign_id-event_type-index",
        KeyConditionExpression: "campaign_id = :cid",
        ExpressionAttributeValues: { ":cid": campaignId }
      };
      
      const trackingResult = await ddb.send(new QueryCommand(trackingQuery));
      
      // Xóa từng tracking record
      for (const trackingItem of trackingResult.Items || []) {
        await ddb.send(new DeleteCommand({
          TableName: TABLE_TRACKING,
          Key: {
            message_id: trackingItem.message_id,
            event_type: trackingItem.event_type
          }
        }));
      }
      console.log(`Deleted ${trackingResult.Items?.length || 0} tracking records`);
    } catch (trackErr) {
      console.warn("Error deleting tracking data:", trackErr.message);
    }

    // 4. Xóa campaign records từ DynamoDB
    for (const item of items) {
      const deleteParams = {
        TableName: TABLE_CAMPAIGNS,
        Key: {
          campaign_id: item.campaign_id,
          email_id: item.email_id,
        },
      };
      await ddb.send(new DeleteCommand(deleteParams));
      console.log(`Deleted campaign record: ${item.campaign_id}, ${item.email_id}`);
    }

    return {
      statusCode: 200,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization,Content-Type"
      },
      body: JSON.stringify({ 
        message: "Drip campaign đã được xóa thành công",
        deleted_records: items.length
      }),
    };
    
  } catch (err) {
    console.error("Lỗi khi xóa drip campaign:", err);
    return {
      statusCode: 500,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization,Content-Type"
      },
      body: JSON.stringify({ 
        error: "Lỗi khi xóa drip campaign", 
        details: err.message 
      }),
    };
  }
};