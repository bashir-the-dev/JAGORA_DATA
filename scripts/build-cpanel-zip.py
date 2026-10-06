#!/usr/bin/env python3
import os
import zipfile
import shutil
import re

ROOT_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
DIST_DIR = os.path.join(ROOT_DIR, 'dist')
SOURCE_DIR = os.path.join(ROOT_DIR, 'cpanel_deploy_package')
BACKEND_DIR = os.path.join(ROOT_DIR, 'cpanel-backend')
OUTPUT_PATHS = [
    os.path.join(ROOT_DIR, 'alaminjagora_cpanel_files.zip'),
    os.path.join(ROOT_DIR, 'public', 'alaminjagora_cpanel_files.zip'),
    os.path.join(ROOT_DIR, 'dist', 'alaminjagora_cpanel_files.zip')
]

android_assets_zip = os.path.join(ROOT_DIR, 'android', 'app', 'src', 'main', 'assets', 'public', 'alaminjagora_cpanel_files.zip')
if os.path.exists(os.path.dirname(android_assets_zip)):
    OUTPUT_PATHS.append(android_assets_zip)

print("==================================================================")
print("AL'AMIN JAGORA DATA - CPANEL DEPLOYMENT BUILD & SYNC ENGINE")
print("==================================================================")

# 0. Synchronize backend PHP & SQL files from cpanel-backend/ into cpanel_deploy_package/
if os.path.exists(BACKEND_DIR):
    backend_copied = 0
    for root, dirs, files in os.walk(BACKEND_DIR):
        rel_dir = os.path.relpath(root, BACKEND_DIR)
        target_dir = os.path.join(SOURCE_DIR, rel_dir) if rel_dir != '.' else SOURCE_DIR
        os.makedirs(target_dir, exist_ok=True)
        for f in files:
            if f in ['.DS_Store', 'Thumbs.db'] or f.endswith('.zip'):
                continue
            src_file = os.path.join(root, f)
            dst_file = os.path.join(target_dir, f)
            shutil.copy2(src_file, dst_file)
            backend_copied += 1
    print(f"-> Synchronized {backend_copied} backend PHP, SQL & config files from cpanel-backend/ into {SOURCE_DIR}")

# 1. Verify that dist/ exists with compiled frontend
dist_index = os.path.join(DIST_DIR, 'index.html')
dist_assets = os.path.join(DIST_DIR, 'assets')

if not os.path.exists(dist_index) or not os.path.exists(dist_assets):
    print("WARNING: dist/index.html or dist/assets/ not found. Running vite build first...")
    os.system('npm run build')

if not os.path.exists(dist_index):
    raise FileNotFoundError(f"Missing compiled index.html in {DIST_DIR}")

# 2. Synchronize dist/ assets into cpanel_deploy_package/
cpanel_assets = os.path.join(SOURCE_DIR, 'assets')
os.makedirs(cpanel_assets, exist_ok=True)

# Remove stale JS / CSS files from cpanel_deploy_package/assets
for item in os.listdir(cpanel_assets):
    item_path = os.path.join(cpanel_assets, item)
    if os.path.isfile(item_path):
        os.remove(item_path)
    elif os.path.isdir(item_path) and item not in ['aistudio']:
        shutil.rmtree(item_path)

# Copy freshly compiled files from dist/assets into cpanel_deploy_package/assets
for item in os.listdir(dist_assets):
    src_path = os.path.join(dist_assets, item)
    dst_path = os.path.join(cpanel_assets, item)
    if os.path.isfile(src_path):
        shutil.copy2(src_path, dst_path)
    elif os.path.isdir(src_path):
        shutil.copytree(src_path, dst_path, dirs_exist_ok=True)

print(f"-> Successfully synchronized {len(os.listdir(cpanel_assets))} fresh asset files into {cpanel_assets}")

# 3. Synchronize compiled index.html
cpanel_index = os.path.join(SOURCE_DIR, 'index.html')
shutil.copy2(dist_index, cpanel_index)

# Read index.html to extract current script/css hashes for verification
with open(cpanel_index, 'r', encoding='utf-8') as f:
    index_content = f.read()

scripts = re.findall(r'src=["\']([^"\']+\.js)["\']', index_content)
stylesheets = re.findall(r'href=["\']([^"\']+\.css)["\']', index_content)
print(f"-> Active JS Bundle: {scripts}")
print(f"-> Active Stylesheet: {stylesheets}")

# 4. Synchronize telecom icons & logos if present
dist_telecom = os.path.join(DIST_DIR, 'telecom')
cpanel_telecom = os.path.join(SOURCE_DIR, 'telecom')
if os.path.exists(dist_telecom):
    shutil.copytree(dist_telecom, cpanel_telecom, dirs_exist_ok=True)

for asset_file in ['logo.png', 'logo.svg', 'favicon.ico', 'sw.js', 'manifest.json', 'pwa-192.png', 'pwa-512.png']:
    src_asset = os.path.join(DIST_DIR, asset_file)
    dst_asset = os.path.join(SOURCE_DIR, asset_file)
    if os.path.exists(src_asset):
        shutil.copy2(src_asset, dst_asset)

# 5. Create temporary clean ZIP package
temp_zip = os.path.join(ROOT_DIR, 'temp_cpanel_build.zip')
if os.path.exists(temp_zip):
    os.remove(temp_zip)

file_count = 0
with zipfile.ZipFile(temp_zip, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
    for root, dirs, files in os.walk(SOURCE_DIR):
        dirs.sort()
        files.sort()
        for file in files:
            if file in ['.DS_Store', 'Thumbs.db'] or file.endswith('.zip'):
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, SOURCE_DIR)
            rel_path_unix = rel_path.replace(os.path.sep, '/')
            zipf.write(full_path, rel_path_unix)
            file_count += 1

print(f"-> Compressed {file_count} production files into clean ZIP archive.")

# 6. Copy to all target destinations
for out_path in OUTPUT_PATHS:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    shutil.copyfile(temp_zip, out_path)
    file_size_kb = os.path.getsize(out_path) / 1024
    print(f"-> Updated: {out_path} ({file_size_kb:.1f} KB)")

if os.path.exists(temp_zip):
    os.remove(temp_zip)

# 7. Synchronize fresh compiled assets directly into android/app/src/main/assets/public/
android_public = os.path.join(ROOT_DIR, 'android', 'app', 'src', 'main', 'assets', 'public')
if os.path.exists(android_public):
    android_assets = os.path.join(android_public, 'assets')
    os.makedirs(android_assets, exist_ok=True)
    for item in os.listdir(android_assets):
        ipath = os.path.join(android_assets, item)
        if os.path.isfile(ipath):
            os.remove(ipath)
        elif os.path.isdir(ipath) and item not in ['aistudio']:
            shutil.rmtree(ipath)
    for item in os.listdir(dist_assets):
        src_path = os.path.join(dist_assets, item)
        dst_path = os.path.join(android_assets, item)
        if os.path.isfile(src_path):
            shutil.copy2(src_path, dst_path)
        elif os.path.isdir(src_path):
            shutil.copytree(src_path, dst_path, dirs_exist_ok=True)
    shutil.copy2(dist_index, os.path.join(android_public, 'index.html'))
    for asset_file in ['logo.png', 'logo.svg', 'favicon.ico', 'sw.js', 'manifest.json', 'pwa-192.png', 'pwa-512.png']:
        src_asset = os.path.join(DIST_DIR, asset_file)
        dst_asset = os.path.join(android_public, asset_file)
        if os.path.exists(src_asset):
            shutil.copy2(src_asset, dst_asset)
    if os.path.exists(dist_telecom):
        shutil.copytree(dist_telecom, os.path.join(android_public, 'telecom'), dirs_exist_ok=True)
    print(f"-> Successfully synchronized fresh compiled assets into Android assets: {android_public}")

print("==================================================================")
print("SUCCESS: cPanel deployment package is 100% in sync with the app!")
print("==================================================================")
