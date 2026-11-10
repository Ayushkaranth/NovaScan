import resend
import logging
import asyncio
from html import escape
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


async def send_password_reset_email(email: str, reset_url: str) -> bool:
    """Send a one-time password reset link without logging its secret URL."""
    if not settings.RESEND_API_KEY:
        logger.error("Password reset email is unavailable: RESEND_API_KEY is not configured")
        return False

    safe_url = escape(reset_url, quote=True)
    payload = {
        "from": f"NovaScan <{settings.SMTP_USER}>",
        "to": [email],
        "subject": "Reset your NovaScan password",
        "html": f"""
        <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
          <div style="padding: 28px; border: 1px solid #e5e7eb; border-radius: 16px;">
            <p style="margin: 0 0 8px; color: #6366f1; font-weight: 700;">NOVASCAN</p>
            <h1 style="font-size: 22px; margin: 0 0 12px;">Reset your password</h1>
            <p style="line-height: 1.6; color: #4b5563;">We received a request to reset the password for your account. This link expires in 30 minutes and can only be used once.</p>
            <p style="margin: 24px 0;"><a href="{safe_url}" style="display: inline-block; padding: 12px 18px; border-radius: 9px; background: #4f46e5; color: #fff; text-decoration: none; font-weight: 600;">Choose a new password</a></p>
            <p style="font-size: 13px; line-height: 1.6; color: #6b7280;">If you didn’t request a reset, you can ignore this email. Your password will remain unchanged.</p>
          </div>
        </div>
        """,
        "text": f"Reset your NovaScan password using this link (expires in 30 minutes): {reset_url}\n\nIf you didn’t request a reset, ignore this email.",
    }
    return await asyncio.to_thread(_send_email_api, payload)
