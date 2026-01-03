const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { SQSClient, SendMessageBatchCommand } = require("@aws-sdk/client-sqs");
const { SchedulerClient, CreateScheduleCommand } = require("@aws-sdk/client-scheduler");
const { v4: uuidv4 } = require("uuid");

const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient);
const sqsClient = new SQSClient({});
const schedulerClient = new SchedulerClient({});

// ✅ NEW: Use custom domain
const FROM_EMAIL = "noreply@oachxalach.com";
const QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/940482432605/emailQueue';
const TABLE_NAME = 'EmailCampaigns';

exports.handler = async (event) => {
  console.log("createCampaignLambda triggered");
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body);
    const userId = body.user_id;
    const recipients = body.recipients || [];
    const campaignType = body.campaign_type || "regular";
    const scheduleTime = body.scheduleTime || null;

    if (!userId || recipients.length === 0) {
      return { 
        statusCode: 400, 
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Thiếu user_id hoặc recipients" }) 
      };
    }

    const campaignId = `campaign#${uuidv4().slice(0, 8)}`;
    const timestamp = new Date().toISOString();

    // ✅ DRIP CAMPAIGN
    if (campaignType === "drip") {
      const shortId = uuidv4().slice(0, 8);
      const safeCampaignId = `${campaignId.replace(/[^a-zA-Z0-9-_.]/g, "-")}-${shortId}`;
      
      // ✅ Lưu vào DynamoDB TRƯỚC KHI gửi
      const campaignRecord = {
        user_id: userId,
        campaign_id: campaignId,
        email_id: "email#main",
        recipients: recipients,
        status: "SCHEDULED",
        timestamp,
        campaign_type: campaignType,
        drip_config: {
          email1: { subject: body.email1_subject, body: body.email1_body },
          emailA: { subject: body.emailA_subject, body: body.emailA_body },
          emailB: { subject: body.emailB_subject, body: body.emailB_body },
          wait_days: parseFloat(body.wait_days) || 2
        }
      };

      await ddb.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: campaignRecord
      }));
      console.log(`✅ Saved drip campaign to DynamoDB: ${campaignId}`);

      // Gửi Email 1
      const message = {
        Id: uuidv4(),
        MessageBody: JSON.stringify({
          campaign_id: campaignId,
          email_step: "email1",
          recipients: recipients,
          subject: body.email1_subject,
          body: body.email1_body,
          from_email: FROM_EMAIL  // ✅ Using custom domain
        })
      };

      if (scheduleTime) {
        await schedulerClient.send(new CreateScheduleCommand({
          Name: `drip-email1-${safeCampaignId}`,
          ScheduleExpression: `at(${new Date(scheduleTime).toISOString().slice(0,19)})`,
          FlexibleTimeWindow: { Mode: "OFF" },
          Target: {
            Arn: "arn:aws:lambda:us-east-1:940482432605:function:sendEmailLambda",
            RoleArn: "arn:aws:iam::940482432605:role/SchedulerExecutionRole",
            Input: JSON.stringify({ messages: [message] })
          }
        }));
      } else {
        await sqsClient.send(new SendMessageBatchCommand({
          QueueUrl: QUEUE_URL,
          Entries: [message]
        }));
      }

      // Schedule follow-up
      const waitDays = parseFloat(body.wait_days) || 2;
      const followUpTime = new Date(Date.now() + waitDays * 24 * 60 * 60 * 1000);

      await schedulerClient.send(new CreateScheduleCommand({
        Name: `drip-followup-${safeCampaignId}`,
        ScheduleExpression: `at(${followUpTime.toISOString().slice(0,19)})`,
        FlexibleTimeWindow: { Mode: "OFF" },
        Target: {
          Arn: "arn:aws:lambda:us-east-1:940482432605:function:DripFollowUpLambda",
          RoleArn: "arn:aws:iam::940482432605:role/SchedulerExecutionRole",
          Input: JSON.stringify({ campaign_id: campaignId }),
          RetryPolicy: {
            MaximumRetryAttempts: 2
          }
        }
      }));
      console.log(`✅ Scheduled Drip Follow-up: ${followUpTime}`);

      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ 
          campaignId: campaignId.replace("campaign#", ""), 
          type: campaignType 
        })
      };
    }

    // ✅ REGULAR CAMPAIGN
    else {
      const emailId = "email#regular";
      
      // ✅ CRITICAL: Lưu vào DynamoDB TRƯỚC KHI gửi SQS
      const campaignRecord = {
        user_id: userId,
        campaign_id: campaignId,
        email_id: emailId,
        subject: body.subject || "No Subject",
        body: body.content || "No Content",
        recipients: recipients,
        status: "SCHEDULED",
        timestamp,
        campaign_type: "regular"
      };

      await ddb.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: campaignRecord
      }));
      console.log(`✅ Saved regular campaign to DynamoDB: ${campaignId}, email_id: ${emailId}`);

      // Prepare SQS message
      const message = {
        Id: uuidv4(),
        MessageBody: JSON.stringify({
          campaign_id: campaignId,
          email_id: emailId,
          recipients: recipients,
          subject: body.subject,
          body: body.content,
          from_email: FROM_EMAIL  // ✅ Using custom domain
        })
      };

      if (scheduleTime) {
        const safeCampaignId = `${campaignId.replace(/[^a-zA-Z0-9-_.]/g, "-")}-${uuidv4().slice(0, 8)}`;
        
        await schedulerClient.send(new CreateScheduleCommand({
          Name: `regular-${safeCampaignId}`,
          ScheduleExpression: `at(${new Date(scheduleTime).toISOString().slice(0,19)})`,
          FlexibleTimeWindow: { Mode: "OFF" },
          Target: {
            Arn: "arn:aws:lambda:us-east-1:940482432605:function:sendEmailLambda",
            RoleArn: "arn:aws:iam::940482432605:role/SchedulerExecutionRole",
            Input: JSON.stringify({ messages: [message] })
          }
        }));
        console.log(`✅ Scheduled regular campaign for: ${scheduleTime}`);
      } else {
        await sqsClient.send(new SendMessageBatchCommand({
          QueueUrl: QUEUE_URL,
          Entries: [message]
        }));
        console.log(`✅ Sent regular campaign to SQS`);
      }

      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ 
          campaignId: campaignId.replace("campaign#", ""), 
          type: campaignType 
        })
      };
    }

  } catch (err) {
    console.error("❌ Error in createCampaignLambda:", err);
    return { 
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: err.message || "Internal Server Error" }) 
    };
  }
};