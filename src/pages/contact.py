"""
Contact page for the Institutional Complexity Index Dashboard.
"""

import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import streamlit as st


def render_contact_page():
    """Render the contact page with email form."""
    st.subheader("📧 Contact Us")

    st.markdown("""
    Have questions, suggestions, or collaboration opportunities? We'd love to hear from you!
    
    Fill out the form below and we'll get back to you as soon as possible.
    """)

    st.markdown("---")

    # Contact information

    st.markdown("### 📋 Send us a message")

    with st.form("contact_form"):
        # Form fields
        name = st.text_input("Name *", placeholder="Your full name")
        email = st.text_input("Email *", placeholder="your.email@example.com")
        subject = st.text_input(
            "Subject *", placeholder="Brief subject of your message"
        )
        message = st.text_area(
            "Message *",
            placeholder="Type your message here...",
            height=200,
        )

        # Submit button
        submitted = st.form_submit_button("📤 Send Message", use_container_width=True)

        if submitted:
            _process_contact_form(name, email, subject, message)

    st.markdown("---")

    st.info("""
    **Privacy Notice:** Your personal information will be used solely to respond to your inquiry 
    and will not be shared with third parties.
    """)


def _process_contact_form(name, email, subject, message):
    """Process and send contact form."""
    # Validate fields
    if not name or not email or not subject or not message:
        st.error("❌ Please fill in all required fields marked with *")
        return

    if "@" not in email or "." not in email:
        st.error("❌ Please enter a valid email address")
        return

    try:
        _send_contact_email(name, email, subject, message)
    except Exception as e:
        st.error(f"❌ Error sending message: {str(e)}")
        st.info(
            "If the problem persists, please contact us directly at contact@research.org"
        )


def _send_contact_email(name, email, subject, message):
    """Send contact email to admin."""
    # Email configuration from environment variables
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD")
    admin_email = os.getenv("ADMIN_EMAIL")

    if not all([sender_email, sender_password, admin_email]):
        st.error("❌ Email configuration not found. Please contact the administrator.")
        st.info("""
        **For Administrator:** Please configure the following environment variables:
        - SMTP_SERVER (default: smtp.gmail.com)
        - SMTP_PORT (default: 587)
        - SENDER_EMAIL
        - SENDER_PASSWORD
        - ADMIN_EMAIL
        """)
        return

    # Send email to admin (contact form submission)
    msg_admin = MIMEMultipart()
    msg_admin["From"] = sender_email
    msg_admin["To"] = admin_email
    msg_admin["Subject"] = f"Contact Form Submission: {subject}"

    body_admin = f"""
New contact form submission received:

**Sender Information:**
- Name: {name}
- Email: {email}
- Date/Time: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

**Subject:**
{subject}

**Message:**
{message}

---
To reply, send an email to: {email}

This is an automated notification from the Institutional Complexity Index Dashboard.
"""

    msg_admin.attach(MIMEText(body_admin, "plain"))

    # Send confirmation to user
    msg_user = MIMEMultipart()
    msg_user["From"] = sender_email
    msg_user["To"] = email
    msg_user["Subject"] = "Thank you for contacting us - Institutional Complexity Index"

    body_user = f"""
Dear {name},

Thank you for reaching out to us regarding: "{subject}"


For your records, here is a copy of your message:

---
{message}
---

Best regards,
Institutional Complexity Index Team
"""

    msg_user.attach(MIMEText(body_user, "plain"))

    # Send both emails
    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg_admin)
        server.send_message(msg_user)

    st.success(f"✅ Message sent successfully! We've sent a confirmation to {email}.")
