import boto3
import json
import logging
import uuid
from datetime import datetime
import re
import urllib.parse
import time

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ses = boto3.client("ses", region_name="us-east-1")
sqs = boto3.client("sqs", region_name="us-east-1")
dynamodb = boto3.resource("dynamodb", region_name="us-east-1")

SQS_QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/940482432605/emailQueue"
TABLE_NAME = "EmailCampaigns"
table = dynamodb.Table(TABLE_NAME)
CONFIG_SET_NAME = "EmailTracking"
MAX_RETRY_COUNT = 3
BATCH_SIZE = 50

DEFAULT_FROM_EMAIL = "noreply@oachxalach.com"
SUPPORT_EMAIL = "support@oachxalach.com"

def get_pending_emails():
    response = table.scan(
        FilterExpression="#status = :status_value",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={":status_value": "PENDING"}
    )
    return response.get("Items", [])

def get_unopened_recipients(campaign_id):
    try:
        response = table.query(
            KeyConditionExpression="campaign_id = :cid",
            ExpressionAttributeValues={":cid": campaign_id}
        )
        logger.info(f"DynamoDB query response in get_unopened_recipients: {json.dumps(response, default=str)}")
        items = response.get("Items", [])
        if not items:
            logger.error(f"Campaign not found: {campaign_id}")
            return []

        all_recipients = []
        for item in items:
            recipients = item.get("recipients", [])
            if isinstance(recipients, str):
                recipients = [recipients]
            all_recipients.extend(recipients)

        if not all_recipients:
            logger.info(f"No recipients found for campaign: {campaign_id}")
            return []

        tracking_table = dynamodb.Table("EmailTracking")
        opened_recipients = set()
        response = tracking_table.query(
            IndexName="campaign_id-event_type-index",
            KeyConditionExpression="campaign_id = :cid AND event_type = :et",
            ExpressionAttributeValues={":cid": campaign_id, ":et": "Open"}
        )
        for item in response.get("Items", []):
            opened_recipients.update(item.get("recipients", []))
        unopened_recipients = [r for r in all_recipients if r not in opened_recipients]
        logger.info(f"Unopened recipients for campaign {campaign_id}: {unopened_recipients}")
        return unopened_recipients
    except Exception as e:
        logger.error(f"Error getting unopened recipients: {str(e)}")
        return []

def update_email_status(campaign_id, email_id, status, message_id=None, unverified_emails=None):
    try:
        response = table.get_item(Key={"campaign_id": campaign_id, "email_id": email_id})
        if not response.get("Item"):
            logger.error(f"No item found for campaign_id={campaign_id}, email_id={email_id}")
            return False

        update_expr = "SET #st = :s, retry_count = if_not_exists(retry_count, :zero) + :inc"
        expr_attr_values = {":s": status, ":zero": 0, ":inc": 1}
        expr_attr_names = {"#st": "status"}

        if message_id:
            update_expr += ", message_id = :m"
            expr_attr_values[":m"] = message_id
        
        if unverified_emails:
            update_expr += ", unverified_emails = :uv"
            expr_attr_values[":uv"] = unverified_emails

        table.update_item(
            Key={"campaign_id": campaign_id, "email_id": email_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_attr_names,
            ExpressionAttributeValues=expr_attr_values
        )
        logger.info(f"Email {email_id} status updated to {status}")
        return True
    except Exception as e:
        logger.error(f"Failed to update status/message_id: {str(e)}")
        return False

def request_email_verification(email_address):
    try:
        response = ses.verify_email_identity(EmailAddress=email_address)
        logger.info(f"✅ Verification email sent to: {email_address}")
        logger.info(f"SES Response: {json.dumps(response, default=str)}")
        return True
    except ses.exceptions.ClientError as e:
        error_code = e.response['Error']['Code']
        logger.error(f"❌ Failed to send verification to {email_address}: {error_code}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error sending verification to {email_address}: {str(e)}")
        return False

def replace_links_with_tracking(body, campaign_id, temp_message_id, recipients):
    if not body or not isinstance(body, str):
        return body
    
    TRACKING_DOMAIN = "kbm7qykb6f.execute-api.us-east-1.amazonaws.com"
    recipient = recipients[0] if recipients else ""

    url_pattern = r'https?://[^\s<>"\']+|www\.[^\s<>"\']+'
    urls = re.findall(url_pattern, body)

    for url in urls:
        if TRACKING_DOMAIN in url or '/tracking/' in url:
            logger.info(f"Skipping tracking URL: {url}")
            continue

        img_pattern = f'<img[^>]*src=["\'][^"\']*{re.escape(url)}[^"\']*["\'][^>]*>'
        if re.search(img_pattern, body):
            logger.info(f"Skipping URL in <img> tag: {url}")
            continue

        encoded_url = urllib.parse.quote(url)
        tracking_url = (
            f"https://{TRACKING_DOMAIN}/campaigns/"
            f"{campaign_id.replace('campaign#', '')}/tracking/click?"
            f"message_id={temp_message_id}&"
            f"url={encoded_url}&"
            f"recipient={urllib.parse.quote(recipient)}"
        )
        body = body.replace(url, tracking_url)
        logger.info(f"Replaced: {url} → {tracking_url}")
    
    return body    

def send_email(recipients, subject, body, campaign_id, from_email=None):
    if not from_email:
        from_email = DEFAULT_FROM_EMAIL
    
    logger.info(f"✅ Sending email from: {from_email}")
    
    if not isinstance(recipients, list):
        recipients = [recipients]

    if not recipients:
        logger.error("No recipients provided")
        return False, [], [], []

    logger.info(f"Total recipients to send: {len(recipients)}")
    
    all_ses_message_ids = []
    failed_recipients = []
    unverified_recipients = []
    tracking_table = dynamodb.Table("EmailTracking")
    template_name = "EmailCampaignTemplate"
    
    for batch_index in range(0, len(recipients), BATCH_SIZE):
        batch_recipients = recipients[batch_index:batch_index + BATCH_SIZE]
        logger.info(f"Processing batch {batch_index // BATCH_SIZE + 1}: {len(batch_recipients)} recipients")
        
        destinations = []
        recipient_message_ids = {}
        
        for recipient in batch_recipients:
            recipient_message_id = f"msg-{uuid.uuid4()}"
            recipient_message_ids[recipient] = recipient_message_id
            
            processed_body = replace_links_with_tracking(body, campaign_id, recipient_message_id, [recipient])
            destinations.append({
                "Destination": {"ToAddresses": [recipient]},
                "ReplacementTemplateData": json.dumps({
                    "campaign_id": campaign_id.replace("campaign#", ""),
                    "message_id": recipient_message_id,
                    "recipient": recipient,
                    "body": processed_body,
                    "subject": subject
                })
            })
        
        try:
            logger.info(f"Sending batch with {len(destinations)} destinations")
            
            # ✅ FIX: Đổi DefaultEmailTags thành DefaultTags
            response = ses.send_bulk_templated_email(
                Source=from_email,
                Template=template_name,
                ConfigurationSetName=CONFIG_SET_NAME,
                ReplyToAddresses=[SUPPORT_EMAIL],
                DefaultTags=[  # ✅ THAY ĐỔI TỪ DefaultEmailTags
                    {'Name': 'campaign_type', 'Value': 'marketing'},
                ],
                DefaultTemplateData=json.dumps({"body": "Default body", "subject": "Default subject"}),
                Destinations=destinations
            )
            logger.info(f"Batch SES response: {json.dumps(response, default=str)}")

            statuses = response.get("BulkEmailStatuses") or response.get("Status", [])
            if not statuses:
                logger.error(f"No statuses in batch response: {json.dumps(response, default=str)}")
                failed_recipients.extend(batch_recipients)
                continue
            
            for idx, status in enumerate(statuses):
                recipient = batch_recipients[idx]
                recipient_message_id = recipient_message_ids[recipient]
                
                if status.get("Status") == "Success":
                    ses_message_id = status.get("MessageId")
                    all_ses_message_ids.append(ses_message_id)
                    
                    tracking_table.put_item(Item={
                        'message_id': recipient_message_id,
                        'ses_message_id': ses_message_id,
                        'campaign_id': campaign_id,
                        'event_type': 'Send',
                        'timestamp': datetime.now().isoformat(),
                        'recipients': [recipient],
                        'recipient_primary': recipient
                    })
                    logger.info(f"✓ Sent to {recipient} (RecipientMsgId: {recipient_message_id}, SESMsgId: {ses_message_id})")
                else:
                    error = status.get("Error", "Unknown error")

                    if "not verified" in error.lower() or "email address is not verified" in error.lower():
                        logger.warning(f"⚠️ Unverified email: {recipient}")
                        unverified_recipients.append(recipient)
                        verification_sent = request_email_verification(recipient)
                        if verification_sent:
                            logger.info(f"✅ Verification request sent to {recipient}")

                        tracking_table.put_item(Item={
                            'message_id': recipient_message_id,
                            'campaign_id': campaign_id,
                            'event_type': 'Unverified',
                            'timestamp': datetime.now().isoformat(),
                            'recipients': [recipient],
                            'recipient_primary': recipient,
                            'error_message': error,
                            'verification_sent': verification_sent
                        })
                    else:
                        logger.error(f"✗ Failed to send to {recipient}: {error}")
                        failed_recipients.append(recipient)

                        tracking_table.put_item(Item={
                            'message_id': recipient_message_id,
                            'campaign_id': campaign_id,
                            'event_type': 'Failed',
                            'timestamp': datetime.now().isoformat(),
                            'recipients': [recipient],
                            'recipient_primary': recipient,
                            'error_message': error
                        })
            
            if batch_index + BATCH_SIZE < len(recipients):
                logger.info("Sleeping 1 second between batches...")
                time.sleep(1)
                
        except ses.exceptions.ClientError as e:
            logger.error(f"SES ClientError for batch: {str(e.response)}")
            failed_recipients.extend(batch_recipients)
            continue
        except Exception as e:
            logger.error(f"Unexpected error sending batch: {str(e)}")
            failed_recipients.extend(batch_recipients)
            continue
    
    success = len(all_ses_message_ids) > 0
    logger.info(f"Email sending completed: {len(all_ses_message_ids)}/{len(recipients)} successful, "
                f"{len(failed_recipients)} failed, {len(unverified_recipients)} unverified")    
    
    return success, all_ses_message_ids, failed_recipients, unverified_recipients

def lambda_handler(event, context):
    logger.info("Lambda triggered: Processing emails...")
    logger.info(f"Event received: {json.dumps(event, default=str)}")

    try:
        if "pathParameters" in event and event["pathParameters"] and "id" in event["pathParameters"]:
            action = "resend_unopened"
            campaign_id = event["pathParameters"]["id"]
        elif "event" in event and isinstance(event["event"], dict):
            action = event["event"].get("action")
            campaign_id = event["event"].get("campaign_id")
        else:
            action = event.get("action")
            campaign_id = event.get("campaign_id")

        is_scheduled_event = 'time' in event.get('detail', {}) if 'detail' in event else False
        messages = event.get("Records", [])
        scheduler_messages = event.get("messages", None)

        if messages:
            logger.info(f"Received {len(messages)} messages from SQS")
            for message in messages:
                try:
                    body_str = message["body"]
                    logger.info(f"SQS message body: {body_str}")
                    body = json.loads(body_str)
                    logger.info(f"Parsed SQS message: {json.dumps(body)}")

                    campaign_id = body.get("campaign_id")                               
                    recipients = body.get("recipients", [])
                    subject = body.get("subject", "No Subject")
                    text_body = body.get("body", "<p>No content</p>")
                    from_email = body.get("from_email", DEFAULT_FROM_EMAIL)
                    email_step = body.get("email_step")
                    email_id = body.get("email_id", "email#regular")

                    if not campaign_id or not recipients:
                        logger.error("Missing required fields")
                        sqs.delete_message(QueueUrl=SQS_QUEUE_URL, ReceiptHandle=message["receiptHandle"])
                        continue
                    
                    if campaign_id and campaign_id.startswith("campaign#") and email_step in ["email1", "emailA", "emailB"]:
                        try:                                       
                            response = table.get_item(
                                Key={"campaign_id": campaign_id, "email_id": "email#main"}
                            )
                            item = response.get("Item")
                            if item and item.get("campaign_type") == "drip":
                                config = item.get("drip_config", {})
                                email_config = config.get(email_step)
                                if email_config:
                                    subject = email_config.get("subject", subject)
                                    text_body = email_config.get("body", text_body)
                                    logger.info(f"ĐÃ LẤY THÀNH CÔNG {email_step.upper()}: {subject}")
                        except Exception as e:
                            logger.error(f"Lỗi khi lấy drip_config: {str(e)}")
                    
                    success, ses_message_ids, failed_recipients, unverified_recipients = send_email(
                        recipients, subject, text_body, campaign_id, from_email
                    )

                    if success:
                        if len(failed_recipients) == 0 and len(unverified_recipients) == 0:
                            update_email_status(campaign_id, email_id, "SENT")
                            logger.info(f"EMAIL GỬI THÀNH CÔNG: {campaign_id} - {email_step or 'regular'}")
                        else:
                            if len(unverified_recipients) > 0:
                                update_email_status(
                                    campaign_id, email_id, "PENDING_VERIFICATION",
                                    unverified_emails=unverified_recipients
                                )
                                logger.warning(f"⚠️ PENDING VERIFICATION: {len(unverified_recipients)} emails cần xác thực")
                            else:
                                update_email_status(campaign_id, email_id, "PARTIALLY_SENT")
                                logger.warning(f"Partial success: {len(failed_recipients)} failed out of {len(recipients)}")
                        sqs.delete_message(QueueUrl=SQS_QUEUE_URL, ReceiptHandle=message["receiptHandle"])
                    else:
                        if len(unverified_recipients) > 0:
                            update_email_status(
                                campaign_id, email_id, "PENDING_VERIFICATION",
                                unverified_emails=unverified_recipients
                            )
                            logger.warning(f"⚠️ Campaign {campaign_id} chờ xác thực email")
                        else:
                            update_email_status(campaign_id, email_id, "FAILED")
                            logger.error(f"GỬI EMAIL THẤT BẠI: {campaign_id}")
                        sqs.delete_message(QueueUrl=SQS_QUEUE_URL, ReceiptHandle=message["receiptHandle"])
                        
                except Exception as e:
                    logger.error(f"Error processing SQS message: {str(e)}")
                    sqs.delete_message(QueueUrl=SQS_QUEUE_URL, ReceiptHandle=message["receiptHandle"])
                    continue
                    
        elif scheduler_messages:
            logger.info(f"Received {len(scheduler_messages)} messages from EventBridge Scheduler")
            for msg in scheduler_messages:
                try:
                    message_body_str = msg.get("MessageBody", "{}")
                    body = json.loads(message_body_str)
                    logger.info(f"Parsed scheduler message: {json.dumps(body)}")
                    
                    campaign_id = body.get("campaign_id")
                    email_id = body.get("email_id", "email#regular")
                    from_email = body.get("from_email", DEFAULT_FROM_EMAIL)

                    if not campaign_id:
                        logger.error("Missing campaign_id in scheduler message")
                        continue

                    response = table.get_item(Key={"campaign_id": campaign_id, "email_id": email_id})
                    item = response.get("Item")
                    if not item:
                        logger.error(f"No item found for campaign_id={campaign_id}, email_id={email_id}")
                        continue

                    recipients = item.get("recipients", [])
                    if isinstance(recipients, str):
                        recipients = [recipients]
                    subject = item.get("subject", "No Subject")
                    text_body = item.get("body", "<p>No content</p>")

                    if not recipients:
                        logger.warning(f"No recipients for {campaign_id}")
                        continue

                    logger.info(f"Sending scheduled email for {campaign_id} to {len(recipients)} recipients")
                    
                    success, ses_message_ids, failed_recipients, unverified_recipients = send_email(
                        recipients, subject, text_body, campaign_id, from_email
                    )
                    
                    if success:
                        if len(failed_recipients) == 0 and len(unverified_recipients) == 0:
                            update_email_status(campaign_id, email_id, "SENT")
                        elif len(unverified_recipients) > 0:
                            update_email_status(campaign_id, email_id, "PENDING_VERIFICATION", unverified_emails=unverified_recipients)
                        else:
                            update_email_status(campaign_id, email_id, "PARTIALLY_SENT")
                    else:
                        if len(unverified_recipients) > 0:
                            update_email_status(campaign_id, email_id, "PENDING_VERIFICATION", unverified_emails=unverified_recipients)
                        else:
                            update_email_status(campaign_id, email_id, "FAILED")

                except Exception as e:
                    logger.error(f"Error processing scheduler message: {str(e)}")
                    continue

        elif action == "resend_unopened":
            if not campaign_id:
                logger.error("Missing campaign_id for resend_unopened")
                return {
                    "statusCode": 400,
                    "headers": {
                        "Access-Control-Allow-Origin": "https://main.d1c35am1kqmp7j.amplifyapp.com",
                        "Access-Control-Allow-Methods": "POST,OPTIONS",
                        "Access-Control-Allow-Headers": "Authorization,Content-Type"
                    }, 
                    "body": json.dumps({"message": "Missing campaign_id"})
                }

            campaign_id = campaign_id if campaign_id.startswith("campaign#") else f"campaign#{campaign_id}"
            logger.info(f"Normalized campaign_id for resend: {campaign_id}")

            response = table.query(KeyConditionExpression="campaign_id = :cid", ExpressionAttributeValues={":cid": campaign_id})
            logger.info(f"DynamoDB query response: {json.dumps(response, default=str)}")
            items = response.get("Items", [])
            if not items:
                logger.error(f"Campaign not found: {campaign_id}")
                return {
                    "statusCode": 404,
                    "headers": {
                        "Access-Control-Allow-Origin": "https://main.d1c35am1kqmp7j.amplifyapp.com",
                        "Access-Control-Allow-Methods": "POST,OPTIONS",
                        "Access-Control-Allow-Headers": "Authorization,Content-Type"
                    },
                    "body": json.dumps({"message": "Campaign not found"})
                }

            campaign = items[0]
            logger.info(f"Found campaign: {json.dumps(campaign, default=str)}")
            
            unopened_recipients = get_unopened_recipients(campaign_id)
            if not unopened_recipients:
                logger.info(f"No unopened recipients found for campaign: {campaign_id}")
                return {
                    "statusCode": 200,
                    "headers": {
                        "Access-Control-Allow-Origin": "https://main.d1c35am1kqmp7j.amplifyapp.com",
                        "Access-Control-Allow-Methods": "POST,OPTIONS",
                        "Access-Control-Allow-Headers": "Authorization,Content-Type"
                    },
                    "body": json.dumps({"message": "No unopened recipients found"})
                }

            new_campaign_id = f"campaign#{str(uuid.uuid4())[:8]}"
            new_email_id = f"email#{str(uuid.uuid4())[:8]}"
            subject = campaign.get("subject", "")
            text_body = campaign.get("body", "")
            from_email = DEFAULT_FROM_EMAIL

            campaign_record = {
                "campaign_id": new_campaign_id,
                "email_id": new_email_id,
                "subject": subject,
                "body": text_body,
                "recipients": unopened_recipients,
                "status": "PENDING",
                "timestamp": datetime.now().isoformat(),
                "original_campaign_id": campaign_id
            }
            table.put_item(Item=campaign_record)
            logger.info(f"Created resend campaign: {new_campaign_id}")

            sqs.send_message(QueueUrl=SQS_QUEUE_URL, MessageBody=json.dumps({
                "campaign_id": new_campaign_id, 
                "email_id": new_email_id, 
                "from_email": from_email,
                "recipients": unopened_recipients,
                "subject": subject,
                "body": text_body
            }))
            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "https://main.d1c35am1kqmp7j.amplifyapp.com",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Authorization,Content-Type"
                }, 
                "body": json.dumps({"message": f"Resend campaign created: {new_campaign_id}"})
            }

        elif is_scheduled_event or ('to' in event and 'subject' in event and 'body' in event):
            logger.info("Processing direct event from EventBridge or test invocation")
            if 'detail' in event and isinstance(event['detail'], dict):
                detail = event['detail']
                recipients = detail.get("to", [])
                subject = detail.get("subject", "")
                text_body = detail.get("body", "")
            else:
                recipients = event.get("to", [])
                subject = event.get("subject", "")
                text_body = event.get("body", "")

            if isinstance(recipients, str):
                recipients = [recipients]

            campaign_id = f"campaign#{str(uuid.uuid4())[:8]}"
            email_id = f"email#{str(uuid.uuid4())[:8]}"

            logger.info(f"Creating campaign: {campaign_id}, email: {email_id} for recipients: {recipients}")

            try:
                temp_message_id = f"msg-{uuid.uuid4()}"
                campaign_record = {
                    "campaign_id": campaign_id,
                    "email_id": email_id,
                    "subject": subject,
                    "body": text_body,
                    "recipients": recipients,
                    "status": "PENDING",
                    "timestamp": datetime.now().isoformat(),
                    "message_id": temp_message_id
                }

                logger.info(f"Saving campaign record to DynamoDB: {json.dumps(campaign_record)}")
                table.put_item(Item=campaign_record)
                logger.info(f"Campaign {campaign_id} created successfully in DynamoDB")

                success, ses_message_ids, failed_recipients, unverified_recipients = send_email(
                    recipients, subject, text_body, campaign_id, DEFAULT_FROM_EMAIL
                )
                
                if success:
                    if len(failed_recipients) == 0 and len(unverified_recipients) == 0:
                        for ses_message_id in ses_message_ids:
                            update_email_status(campaign_id, email_id, "SENT", message_id=ses_message_id)
                        logger.info(f"Email status updated to SENT")
                    elif len(unverified_recipients) > 0:
                        update_email_status(campaign_id, email_id, "PENDING_VERIFICATION", unverified_emails=unverified_recipients)
                    else:
                        update_email_status(campaign_id, email_id, "PARTIALLY_SENT")
                        logger.warning(f"Partial send: {len(failed_recipients)} failed")
                else:
                    if len(unverified_recipients) > 0:
                        update_email_status(campaign_id, email_id, "PENDING_VERIFICATION", unverified_emails=unverified_recipients)
                    else:
                        update_email_status(campaign_id, email_id, "FAILED")
                        logger.error(f"Failed to send email")

            except Exception as e:
                logger.error(f"Failed to process direct event: {str(e)}")

        logger.info("Fetching pending emails from DynamoDB")
        pending_emails = get_pending_emails()
        logger.info(f"Found {len(pending_emails)} pending emails in DynamoDB")

        if pending_emails:
            for email in pending_emails:
                try:
                    if email.get("campaign_type") == "drip":
                        logger.info(f"Skip drip campaign: {email.get('campaign_id')}")
                        continue
                    
                    campaign_id = email.get("campaign_id")
                    email_id = email.get("email_id")
                    subject = email.get("subject", "No Subject (old campaign)")
                    body = email.get("body", "<p>No content (old campaign)</p>")
                    recipients = email.get("recipients", [])
                    if isinstance(recipients, str):
                        recipients = [recipients]
                    if not recipients:
                        logger.warning(f"Skip pending email {email_id}: no recipients")
                        continue
                    
                    logger.info(f"Processing old pending email {email_id} to {recipients}")
                    
                    success, _, failed_recipients, unverified_recipients = send_email(
                        recipients, subject, body, campaign_id, DEFAULT_FROM_EMAIL
                    )
                    
                    if success:
                        if len(failed_recipients) == 0 and len(unverified_recipients) == 0:
                            update_email_status(campaign_id, email_id, "SENT")
                        elif len(unverified_recipients) > 0:
                            update_email_status(campaign_id, email_id, "PENDING_VERIFICATION", unverified_emails=unverified_recipients)
                        else:
                            update_email_status(campaign_id, email_id, "PARTIALLY_SENT")
                    else:
                        if len(unverified_recipients) > 0:
                            update_email_status(campaign_id, email_id, "PENDING_VERIFICATION", unverified_emails=unverified_recipients)
                        else:
                            update_email_status(campaign_id, email_id, "FAILED")
                except Exception as e:
                    logger.error(f"Error processing pending email {email.get('campaign_id', 'unknown')}: {str(e)}")
                    continue
                    
    except Exception as e:
        logger.error(f"Error in Lambda execution: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "https://main.d1c35am1kqmp7j.amplifyapp.com",
                "Access-Control-Allow-Methods": "POST,OPTIONS",
                "Access-Control-Allow-Headers": "Authorization,Content-Type"
            },
            "body": json.dumps({"message": f"Error processing emails: {str(e)}"})
        }

    return {"statusCode": 200, "body": "Emails processed successfully"}