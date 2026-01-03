import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE_CAMPAIGNS = "EmailCampaigns";
const TABLE_TRACKING = "EmailTracking";

export const handler = async (event) => {
  const userId = event.queryStringParameters?.user_id;
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing user_id" }) };
  }

  try {
    const campaignsRes = await ddb.send(new ScanCommand({
      TableName: TABLE_CAMPAIGNS,
      FilterExpression: "user_id = :uid AND campaign_type = :type AND contains(#cid, :prefix)",
      ExpressionAttributeNames: { "#cid": "campaign_id" },
      ExpressionAttributeValues: { ":uid": userId, ":type": "drip", ":prefix": "campaign#" }
    }));

    const dripCampaigns = campaignsRes.Items || [];

    const campaignsWithStats = await Promise.all(
      dripCampaigns.map(async (camp) => {
        const cid = camp.campaign_id;

        // Lấy tracking events
        const trackingRes = await ddb.send(new QueryCommand({
          TableName: TABLE_TRACKING,
          IndexName: "original_campaign_id-event_type-index",
          KeyConditionExpression: "original_campaign_id = :cid",
          ExpressionAttributeValues: { ":cid": cid }
        })).catch(() => ddb.send(new QueryCommand({
          TableName: TABLE_TRACKING,
          IndexName: "campaign_id-event_type-index",
          KeyConditionExpression: "campaign_id = :cid",
          ExpressionAttributeValues: { ":cid": cid }
        })));

        const events = trackingRes?.Items || [];
        
        const recipients = camp.recipients || [];
        const totalRecipients = Array.isArray(recipients) ? recipients.length : 0;

        // ✅ FIX: CHỈ TÍNH NGƯỜI ĐÃ MỞ THẬT (verified_human = true)
        const uniqueOpens = new Set();
        const uniqueClicks = new Set();
        const uniqueSends = new Set();
        
        events.forEach(e => {
          const recipient = e.recipient_primary || e.recipients?.[0];
          if (!recipient) return;
          
          // ✅ Chỉ đếm Open event từ người dùng thật
          if (e.event_type === "Open") {
            try {
              const rawEvent = JSON.parse(e.raw_event || "{}");
              if (rawEvent.verified_human === true) {
                uniqueOpens.add(recipient);
                console.log(`✅ Counted real open from: ${recipient}`);
              } else {
                console.log(`⚠️ Skipped bot prefetch from: ${recipient}`);
              }
            } catch {
              // Backward compatibility: nếu không có flag, vẫn đếm
              uniqueOpens.add(recipient);
            }
          }
          
          if (e.event_type === "Click") {
            uniqueClicks.add(recipient);
          }
          
          if (e.event_type === "Send") {
            uniqueSends.add(recipient);
          }
        });

        const totalSent = uniqueSends.size || totalRecipients;
        const opens = uniqueOpens.size;
        const clicks = uniqueClicks.size;

        const openRate = totalRecipients > 0 ? (opens / totalRecipients) * 100 : 0;
        const clickRate = totalRecipients > 0 ? (clicks / totalRecipients) * 100 : 0;

        return {
          ...camp,
          stats: {
            sent: totalSent,
            opened: opens,
            clicked: clicks,
            openRate: Math.min(openRate, 100).toFixed(1),
            clickRate: Math.min(clickRate, 100).toFixed(1),
            totalRecipients: totalRecipients
          }
        };
      })
    );

    // Tính summary
    const total = campaignsWithStats.length;
    const active = campaignsWithStats.filter(c => {
      const created = new Date(c.timestamp);
      const waitDays = c.drip_config?.wait_days || 2;
      const followUpTime = new Date(created.getTime() + waitDays * 86400000);
      return new Date() < followUpTime;
    }).length;
    const completed = total - active;

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization,Content-Type"
      },
      body: JSON.stringify({
        campaigns: campaignsWithStats,
        summary: { total, active, completed }
      })
    };

  } catch (err) {
    console.error("Lỗi Lambda:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error", details: err.message })
    };
  }
};