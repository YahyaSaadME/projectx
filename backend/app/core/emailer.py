from email.message import EmailMessage
import smtplib

from backend.app.core.config import Settings


def send_email(settings: Settings, recipient: str, subject: str, body: str) -> None:
    if not settings.smtp_host or not settings.smtp_username or not settings.smtp_password:
        raise RuntimeError("SMTP settings are not configured")

    message = EmailMessage()
    message["From"] = settings.smtp_from_email
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as client:
        if settings.smtp_use_tls:
            client.starttls()
        client.login(settings.smtp_username, settings.smtp_password)
        client.send_message(message)