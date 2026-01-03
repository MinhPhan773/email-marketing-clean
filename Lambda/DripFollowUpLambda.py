import boto3
import json
import logging
import uuid
from datetime import datetime
import time

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('EmailCampaigns')
tracking_table = dynamodb.Table('EmailTracking')
sqs = boto3.client('sqs')
SQS_QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/940482432605/emailQueue"

# ✅ NEW: Use custom domain
FROM_EMAIL = "noreply@oachxalach.com"

def get_opened_recipients(campaign_id):
    """Lấy danh sách người đã MỞ EMAIL THẬT (không phải bot)"""
    response = tracking_table.query(
        IndexName="campaign_id-event_type-index",
        KeyConditionExpression="campaign_id = :cid AND event_type = :et",
        ExpressionAttributeValues={":cid": campaign_id, ":et": "Open"}
    )
    
    opened = set()
    for item in response.get("Items", []):
        # ✅ QUAN TRỌNG: Chỉ đếm Open event từ người dùng thật
        raw_event = item.get("raw_event", "{}")
        try:
            event_data = json.loads(raw_event)
            # Bỏ qua nếu là bot prefetch
            if event_data.get("verified_human") == True:
                opened.update(item.get("recipients", []))
                logger.info(f"✅ Verified human open: {item.get('recipients')}")
            else:
                logger.info(f"⚠️ Skipped bot prefetch open: {item.get('recipients')}")
        except:
            # Nếu không parse được hoặc không có flag, vẫn đếm (backward compatibility)
            opened.update(item.get("recipients", []))
    
    return opened

def lambda_handler(event, context):
    logger.info(f"DripFollowUpLambda TRIGGERED! Event: {json.dumps(event)}")
    
    # ✅ THÊM DELAY 30 GIÂY để đảm bảo tất cả tracking events đã được ghi
    logger.info("⏳ Waiting 30 seconds for all tracking events to be recorded...")
    time.sleep(30)
    
    campaign_id = event.get("campaign_id")
    if not campaign_id:
        return {"status": "error", "message": "Missing campaign_id"}
    
    # Lấy campaign
    response = table.get_item(Key={"campaign_id": campaign_id, "email_id": "email#main"})
    item = response.get("Item")
    if not item or item.get("campaign_type") != "drip":
        logger.info(f"Không phải drip campaign hoặc không tồn tại: {campaign_id}")
        return {"status": "skipped"}
    
    config = item["drip_config"]
    recipients = item["recipients"]
    if isinstance(recipients, str):
        recipients = [recipients]
    
    # ✅ Lấy danh sách người đã mở THẬT (không phải bot)
    opened = get_opened_recipients(campaign_id)
    opened_list = [r for r in recipients if r in opened]
    unopened_list = [r for r in recipients if r not in opened]
    
    logger.info(f"📊 REAL Opens: {len(opened_list)}, Unopened: {len(unopened_list)}")
    logger.info(f"📧 Opened emails: {opened_list}")
    logger.info(f"📧 Unopened emails: {unopened_list}")
    
    messages = []
    
    # Gửi Email A cho người đã mở THẬT
    if opened_list and config.get("emailA"):
        messages.append({
            "Id": str(uuid.uuid4()),
            "MessageBody": json.dumps({
                "campaign_id": campaign_id,
                "email_step": "emailA",
                "recipients": opened_list,
                "from_email": FROM_EMAIL  # ✅ Using custom domain
            })
        })
        logger.info(f"✅ Tạo message Email A cho {len(opened_list)} người đã mở THẬT")
    
    # Gửi Email B cho người chưa mở
    if unopened_list and config.get("emailB"):
        messages.append({
            "Id": str(uuid.uuid4()),
            "MessageBody": json.dumps({
                "campaign_id": campaign_id,
                "email_step": "emailB",
                "recipients": unopened_list,
                "from_email": FROM_EMAIL  # ✅ Using custom domain
            })
        })
        logger.info(f"✅ Tạo message Email B cho {len(unopened_list)} người chưa mở")
    
    if messages:
        try:
            sqs.send_message_batch(QueueUrl=SQS_QUEUE_URL, Entries=messages)
            logger.info(f"🚀 Đã gửi {len(messages)} message vào SQS thành công!")
        except Exception as e:
            logger.error(f"❌ Lỗi gửi SQS: {str(e)}")
            return {"status": "error", "message": str(e)}
    else:
        logger.info("ℹ️ Không có email nào để gửi")
    
    return {
        "status": "success", 
        "sent_to_opened": len(opened_list), 
        "sent_to_unopened": len(unopened_list)
    }