import { EventBridgeClient, PutRuleCommand, PutTargetsCommand } from "@aws-sdk/client-eventbridge";

const eventbridge = new EventBridgeClient({ region: "us-east-1" });

// 👉 Thay bằng giá trị thật của bạn:
const SQS_QUEUE_ARN = "arn:aws:sqs:us-east-1:940482432605:emailQueue"; // 👈 ARN của hàng đợi
const ROLE_ARN = "arn:aws:iam::940482432605:role/service-role/Amazon_EventBridge_Scheduler_SQS_5ac31d7ba5"; // 👈 ARN của IAM Role đã cấp quyền gửi vào SQS

export const handler = async (event) => {
  const campaignIdParam = event.pathParameters?.id;
  const body = JSON.parse(event.body || "{}");
  const scheduleTime = body.scheduleTime; // ISO 8601: "2025-04-29T10:00:00Z"

  if (!campaignIdParam || !scheduleTime) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Thiếu campaign id hoặc scheduleTime" }),
    };
  }

  const ruleName = `schedule-${campaignIdParam}-${Date.now()}`;

  try {
    // Bước 1: Tạo EventBridge Rule theo thời gian đã chọn
    await eventbridge.send(new PutRuleCommand({
      Name: ruleName,
      ScheduleExpression: `at(${scheduleTime})`, // định dạng: at(2025-04-29T10:00:00Z)
      State: "ENABLED",
    }));

    // Bước 2: Gắn target để gửi message vào SQS
    await eventbridge.send(new PutTargetsCommand({
      Rule: ruleName,
      Targets: [
        {
          Id: "Target0",
          Arn: SQS_QUEUE_ARN,
          RoleArn: ROLE_ARN,
          Input: JSON.stringify({
            campaign_id: `campaign#${campaignIdParam}`,
            action: "send_campaign",
          }),
        },
      ],
    }));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Đặt lịch thành công" }),
    };
  } catch (error) {
    console.error("Lỗi đặt lịch:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Lỗi khi tạo lịch gửi", error: error.message }),
    };
  }
};