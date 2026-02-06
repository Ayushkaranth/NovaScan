import resend
import logging
import asyncio
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure Resend with your API Key
resend.api_key = settings.RESEND_API_KEY

def _send_email_api(payload):
    """
    Sends email via HTTP (Port 443).
    This bypasses all SMTP firewalls and blocking issues.
    """
    try:
        response = resend.Emails.send(payload)
        logger.info(f"✅ Email dispatched via Resend. ID: {response.get('id')}")
        return True
    except Exception as e:
        logger.error(f"❌ Resend API Error: {str(e)}")
        return False

async def send_manager_to_employee_alert(
    manager_name: str,
    manager_email: str,
    employee_emails: list,
    project_name: str,
    risk_data: dict,
    pr_url: str
):
    if not employee_emails:
        logger.warning("⚠️ No employee emails assigned. Skipping.")
        return

    # 1. Construct the HTML Body
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #e11d48;">High Risk Code Detected</h2>
        <p>Hello Team,</p>
        <p>A new Pull Request in <strong>{project_name}</strong> has been flagged with a 
           <span style="font-weight: bold; color: #e11d48;">Risk Score of {risk_data['risk_score']}/10</span>.</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>AI Analysis:</strong> {risk_data['reason']}</p>
        </div>

        <p><a href="{pr_url}" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review Code on GitHub
        </a></p>

        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
            Authorized by Project Manager: {manager_name}
        </p>
    </div>
    """

    # 2. Prepare Payload
    # Note: 'from' must be 'onboarding@resend.dev' until you verify your own domain.
    # It works perfectly for testing.
    payload = {
        "from": "NovaScan Security <onboarding@resend.dev>",
        "to": employee_emails,
        "reply_to": manager_email,
        "subject": f"🚨 SECURITY ALERT: High Risk in {project_name}",
        "html": html_content
    }

    # 3. Send via Background Thread (Fast & Non-blocking)
    logger.info(f"📤 Sending email via API to {len(employee_emails)} recipients...")
    await asyncio.to_thread(_send_email_api, payload)