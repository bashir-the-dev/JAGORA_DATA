import os

def upgrade_file(filepath):
    if filepath.endswith("metadata.json"):
        return
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except Exception:
        return

    orig = content
    replacements = [
        ("support@alaminjagoradata.com.ng", "support@ajdatasub.com.ng"),
        ("support@alaminajdatasub.com.ng", "support@ajdatasub.com.ng"),
        ("support@alaminjagora.ng", "support@ajdatasub.com.ng"),
        ("admin@jagoradata.com", "admin@ajdatasub.com.ng"),
        ("admin@alaminajdatasub.com.ng", "admin@ajdatasub.com.ng"),
        ("alaminjagora.ng", "ajdatasub.com.ng"),
        ("alaminajdatasub.com.ng", "ajdatasub.com.ng"),
        ("alaminjagoradata.com.ng", "ajdatasub.com.ng"),
        ("chat.whatsapp.com/alaminajdatasub", "chat.whatsapp.com/AJDATASUBOfficialGroup"),
        ("chat.whatsapp.com/JagoraOfficialGroup", "chat.whatsapp.com/AJDATASUBOfficialGroup"),
        ("Al'amin AJ Admin", "AJDATASUB Admin"),
        ("Al'amin AJDATASUB", "AJDATASUB"),
        ("Al'amin Jagora Data", "AJDATASUB"),
        ("Al’amin Jagora Data", "AJDATASUB"),
        ("Alamin Jagora Data", "AJDATASUB"),
        ("AL'AMIN JAGORA DATA", "AJDATASUB"),
        ("JagoraData", "AJDATASUB"),
        ("jagora-api", "ajdatasub-api"),
        ("jagora_data", "ajdatasub_data"),
        ("cpaneluser_jagoravtu", "cpaneluser_ajdatasub"),
        ("Al'amin Data", "AJDATASUB"),
        ("Alamin Data", "AJDATASUB"),
        ("Al'amin Telecom", "AJDATASUB Telecom"),
        ("AJ DATA", "AJDATASUB"),
        ("AJ Data", "AJDATASUB"),
        ("AJDATA", "AJDATASUB"),
    ]

    for old, new in replacements:
        content = content.replace(old, new)

    if content != orig:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print("Upgraded brand in:", filepath)

for root, dirs, files in os.walk("/app/applet"):
    if any(skip in root for skip in [".git", "node_modules", "dist", ".aistudio"]):
        continue
    for file in files:
        if file.endswith((".ts", ".tsx", ".js", ".php", ".html", ".json", ".md", ".htaccess", ".sql")):
            upgrade_file(os.path.join(root, file))

print("Brand upgrade to AJDATASUB completed successfully.")
