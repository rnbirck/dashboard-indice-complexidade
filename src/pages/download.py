"""
Download page for the Institutional Complexity Index Dashboard.
"""

import os
import smtplib
from datetime import datetime
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from io import BytesIO

import pandas as pd
import streamlit as st


def render_download_page(get_country_list_func, get_year_range_func, load_data_func):
    """
    Render the data download page with email request form.

    Args:
        get_country_list_func: Function to get list of countries
        get_year_range_func: Function to get year range
        load_data_func: Function to load complexity data
    """
    st.subheader("📥 Data Download Request")

    st.markdown("""
    To download the Institutional Complexity Index data, please fill out the form below. 
    The data will be sent to your email address.
    """)

    st.markdown("---")

    # Request form
    st.markdown("### 📋 Download Request Form")

    with st.form("download_request_form"):
        col1, col2 = st.columns(2)

        with col1:
            user_name = st.text_input("Full Name *", placeholder="Enter your full name")
            user_email = st.text_input(
                "Email Address *", placeholder="your.email@example.com"
            )
            institution = st.text_input(
                "Institution/Organization *", placeholder="University, Company, etc."
            )

        with col2:
            purpose = st.text_area(
                "Purpose of Use *",
                placeholder="Please describe how you intend to use this data",
                height=150,
            )

        st.markdown("---")

        # Filter options
        st.markdown("### 🔍 Data Filters")

        col3, col4 = st.columns(2)

        with col3:
            download_countries = st.multiselect(
                "Select Countries (leave empty for all)",
                options=get_country_list_func(),
                default=[],
                key="download_countries",
            )

        with col4:
            year_min_dl, year_max_dl = get_year_range_func()
            download_years = st.slider(
                "Select Year Range",
                min_value=year_min_dl,
                max_value=year_max_dl,
                value=(year_min_dl, year_max_dl),
                key="download_years",
            )

        # Format preference
        file_format = st.radio(
            "Preferred Format",
            options=["CSV", "Excel"],
            horizontal=True,
            key="file_format",
        )

        # Submit button
        submitted = st.form_submit_button("📧 Request Data", use_container_width=True)

        if submitted:
            _process_download_request(
                user_name=user_name,
                user_email=user_email,
                institution=institution,
                purpose=purpose,
                download_countries=download_countries,
                download_years=download_years,
                file_format=file_format,
                load_data_func=load_data_func,
            )

    st.markdown("---")

    st.info("""
    **Note:** All index values range from 0 to 100, where higher values indicate 
    better institutional quality. The total index is calculated as the average of 
    the five component indices.
    
    **Privacy:** Your information will only be used for research purposes and will not be shared with third parties.
    """)


def _process_download_request(
    user_name,
    user_email,
    institution,
    purpose,
    download_countries,
    download_years,
    file_format,
    load_data_func,
):
    """Process the download request and send email."""
    # Validate fields
    if not user_name or not user_email or not institution or not purpose:
        st.error("❌ Please fill in all required fields marked with *")
        return

    if "@" not in user_email or "." not in user_email:
        st.error("❌ Please enter a valid email address")
        return

    # Load and prepare data
    if download_countries:
        df_download = load_data_func(
            countries=download_countries,
            years=tuple(range(download_years[0], download_years[1] + 1)),
        )
    else:
        df_download = load_data_func(
            years=tuple(range(download_years[0], download_years[1] + 1))
        )

    # Remove n_dims_ok column and rename columns
    df_download = df_download.drop(columns=["n_dims_ok"], errors="ignore")
    df_download = df_download.rename(
        columns={
            "country_name": "Country Name",
            "country_cod": "Country Code",
            "year": "Year",
            "indice_socio_cultural": "Socio-Cultural Index",
            "indice_mercados_negocios": "Markets & Business Index",
            "indice_empreendedorismo": "Entrepreneurship Index",
            "indice_eficiencia_governo": "Government Efficiency Index",
            "indice_ambiente_juridico": "Legal Environment Index",
            "indice_total": "Total Complexity Index",
        }
    )

    try:
        _send_download_email(
            user_name=user_name,
            user_email=user_email,
            institution=institution,
            purpose=purpose,
            download_countries=download_countries,
            download_years=download_years,
            file_format=file_format,
            df_download=df_download,
        )
    except Exception as e:
        st.error(f"❌ Error sending email: {str(e)}")
        st.info("If the problem persists, please contact the administrator.")
        _show_fallback_download(df_download, download_years)


def _send_download_email(
    user_name,
    user_email,
    institution,
    purpose,
    download_countries,
    download_years,
    file_format,
    df_download,
):
    """Send download email to user and notification to admin."""
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

    # Prepare file attachment
    if file_format == "CSV":
        file_data = df_download.to_csv(index=False).encode("utf-8")
        filename = f"institutional_complexity_index_{download_years[0]}_{download_years[1]}.csv"
    else:  # Excel
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            df_download.to_excel(writer, index=False, sheet_name="Complexity Index")
        file_data = buffer.getvalue()
        filename = f"institutional_complexity_index_{download_years[0]}_{download_years[1]}.xlsx"

    # Send email to user
    msg_user = MIMEMultipart()
    msg_user["From"] = sender_email
    msg_user["To"] = user_email
    msg_user["Subject"] = "Institutional Complexity Index - Data Download"

    countries_str = "All" if not download_countries else ", ".join(download_countries)
    body_user = f"""
Dear {user_name},

Thank you for your interest in the Institutional Complexity Index data.

Please find attached the requested data file.

**Download Details:**
- Format: {file_format}
- Year Range: {download_years[0]} - {download_years[1]}
- Countries: {countries_str}
- Total Records: {len(df_download):,}

If you have any questions or need assistance, please don't hesitate to contact us.

Best regards,
Institutional Complexity Index Team
"""

    msg_user.attach(MIMEText(body_user, "plain"))

    # Attach file
    part = MIMEBase("application", "octet-stream")
    part.set_payload(file_data)
    encoders.encode_base64(part)
    part.add_header("Content-Disposition", f"attachment; filename= {filename}")
    msg_user.attach(part)

    # Send notification to admin
    msg_admin = MIMEMultipart()
    msg_admin["From"] = sender_email
    msg_admin["To"] = admin_email
    msg_admin["Subject"] = f"New Data Download Request - {user_name}"

    body_admin = f"""
New data download request received:

**User Information:**
- Name: {user_name}
- Email: {user_email}
- Institution: {institution}
- Purpose: {purpose}

**Download Details:**
- Date/Time: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
- Format: {file_format}
- Year Range: {download_years[0]} - {download_years[1]}
- Countries: {countries_str}
- Total Records: {len(df_download):,}

---
This is an automated notification from the Institutional Complexity Index Dashboard.
"""

    msg_admin.attach(MIMEText(body_admin, "plain"))

    # Send both emails
    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg_user)
        server.send_message(msg_admin)

    st.success(
        f"✅ Success! The data has been sent to {user_email}. Please check your inbox (and spam folder)."
    )


def _show_fallback_download(df_download, download_years):
    """Show fallback download buttons when email fails."""
    st.markdown("---")
    st.markdown("### Alternative: Direct Download")

    col_fallback1, col_fallback2 = st.columns(2)

    with col_fallback1:
        csv = df_download.to_csv(index=False).encode("utf-8")
        st.download_button(
            label="📄 Download as CSV",
            data=csv,
            file_name=f"institutional_complexity_index_{download_years[0]}_{download_years[1]}.csv",
            mime="text/csv",
            use_container_width=True,
        )

    with col_fallback2:
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            df_download.to_excel(writer, index=False, sheet_name="Complexity Index")

        st.download_button(
            label="📊 Download as Excel",
            data=buffer.getvalue(),
            file_name=f"institutional_complexity_index_{download_years[0]}_{download_years[1]}.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True,
        )
