import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

logger = logging.getLogger(__name__)

async def send_manager_to_employee_alert(
    manager_name: str,
    manager_email: str,
    employee_emails: list,
    project_name: str,
    risk_data: dict,
    pr_url: str
):
    if not employee_emails:
        logger.warning("⚠️ No employee emails assigned to this project. Skipping email.")
        return

    # 1. Setup the Identity
    msg = MIMEMultipart()
    # This shows the Manager's Name in the inbox but uses your SMTP to send
    msg['From'] = f"{manager_name} | NovaScan <{settings.SMTP_USER}>"
    msg['To'] = ", ".join(employee_emails)
    msg['Reply-To'] = manager_email  # Replies go to the real Manager
    msg['Subject'] = f"🚨 SECURITY ALERT: High Risk in {project_name}"

    # 2. Construct HTML Body
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
    msg.attach(MIMEText(html_content, 'html'))

    # 3. Send via SMTP
    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"✅ Security alert sent to {len(employee_emails)} employees.")
    except Exception as e:
        logger.error(f"❌ SMTP Error: {str(e)}")