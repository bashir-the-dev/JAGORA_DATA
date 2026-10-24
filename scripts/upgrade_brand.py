import os

def replace_in_file(filepath):
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    orig = content
    replacements = [
        ("Al'amin Jagora Data", "AJ DATA"),
        ("Al’amin Jagora Data", "AJ DATA"),
        ("Al-amin Jagora Data", "AJ DATA"),
        ("Alamin Jagora Data", "AJ DATA"),
        ("AL'AMIN JAGORA DATA", "AJ DATA"),
        ("Al'amin Jagora", "AJ Data"),
        ("Al’amin Jagora", "AJ Data"),
        ("Alamin Jagora", "AJ Data"),
        ("Jagora Data", "AJ DATA"),
        ("Jagora Admin", "AJ Admin"),
        ("Jagora Telecom", "AJ Telecom"),
    ]
    
    for old, new in replacements:
        content = content.replace(old, new)

    if content != orig:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated:", filepath)

for root, dirs, files in os.walk("/app/applet"):
    if ".git" in root or "node_modules" in root or "dist" in root or ".aistudio" in root:
        continue
    for file in files:
        if file.endswith((".ts", ".tsx", ".js", ".php", ".html", ".json", ".md", ".htaccess", ".sql")):
            replace_in_file(os.path.join(root, file))
print("Brand upgrade complete.")
