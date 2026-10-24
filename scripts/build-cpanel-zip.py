#!/usr/bin/env python3
import os
import zipfile
import shutil
import re
import struct
import zlib
import base64
import time

ROOT_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
DIST_DIR = os.path.join(ROOT_DIR, 'dist')
SOURCE_DIR = os.path.join(ROOT_DIR, 'cpanel_deploy_package')
BACKEND_DIR = os.path.join(ROOT_DIR, 'cpanel-backend')

# All archive filenames expected in cPanel backend and workspace root
BACKEND_ARCHIVE_NAMES = [
    'ajdatasub_cpanel_file.zip',      # Singular (explicit user target)
    'ajdatasub_cpanel_files.zip',     # Plural
    'alaminjagora_cpanel_file.zip',   # Singular
    'alaminjagora_cpanel_files.zip',  # Plural (explicit user target)
    'archive.zip',
    'cpanel_backend.zip'
]

ROOT_ARCHIVE_NAMES = [
    'ajdatasub_cpanel_file.zip',
    'alaminjagora_cpanel_files.zip',
]

OUTPUT_PATHS = []
for name in BACKEND_ARCHIVE_NAMES:
    OUTPUT_PATHS.append(os.path.join(BACKEND_DIR, name))
for name in ROOT_ARCHIVE_NAMES:
    OUTPUT_PATHS.append(os.path.join(ROOT_DIR, name))

print("==================================================================")
print("AL'AMIN JAGORA DATA - CPANEL DEPLOYMENT BUILD & SYNC ENGINE")
print("==================================================================")


def make_png_chunk(chunk_type: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(chunk_type + data) & 0xffffffff
    return struct.pack(">I", len(data)) + chunk_type + data + struct.pack(">I", crc)


def optimize_png_file(png_path: str, target_dim: int = 256) -> None:
    """
    Compresses oversized uncompressed PNG files (such as 1024x1024 logo.png)
    into compact, crisp PNGs (~30 KB) using standard-library struct + zlib
    so that cPanel ZIP archives stay under 600 KB and never hit 1MB chunk truncation.
    """
    if not os.path.exists(png_path) or os.path.getsize(png_path) < 100000:
        return

    with open(png_path, "rb") as f:
        png = f.read()

    if png[:8] != b"\x89PNG\r\n\x1a\n":
        return

    pos = 8
    idat = bytearray()
    width = height = bit_depth = color_type = 0
    while pos < len(png):
        length, ctype = struct.unpack(">I4s", png[pos:pos + 8])
        chunk_data = png[pos + 8:pos + 8 + length]
        if ctype == b"IHDR":
            width, height, bit_depth, color_type = struct.unpack(">IIBB", chunk_data[:10])
        elif ctype == b"IDAT":
            idat.extend(chunk_data)
        pos += 12 + length

    if bit_depth != 8 or color_type not in (2, 6) or width < target_dim or height < target_dim:
        return

    bpp = 3 if color_type == 2 else 4
    stride = width * bpp
    raw = zlib.decompress(bytes(idat))
    prev_row = bytearray(stride)
    pixels = bytearray(width * height * bpp)

    for y in range(height):
        row_start = y * (stride + 1)
        ftype = raw[row_start]
        row = bytearray(raw[row_start + 1:row_start + 1 + stride])
        if ftype == 1:
            for i in range(bpp, stride):
                row[i] = (row[i] + row[i - bpp]) & 0xff
        elif ftype == 2:
            for i in range(stride):
                row[i] = (row[i] + prev_row[i]) & 0xff
        elif ftype == 3:
            for i in range(stride):
                a = row[i - bpp] if i >= bpp else 0
                b = prev_row[i]
                row[i] = (row[i] + ((a + b) >> 1)) & 0xff
        elif ftype == 4:
            for i in range(stride):
                a = row[i - bpp] if i >= bpp else 0
                b = prev_row[i]
                c = prev_row[i - bpp] if i >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                row[i] = (row[i] + pr) & 0xff
        pixels[y * stride:(y + 1) * stride] = row
        prev_row = row

    scale_x = max(1, width // target_dim)
    scale_y = max(1, height // target_dim)
    new_w = width // scale_x
    new_h = height // scale_y

    out_raw = bytearray()
    for ny in range(new_h):
        out_row = bytearray(new_w * bpp)
        sy = ny * scale_y
        for nx in range(new_w):
            sx = nx * scale_x
            for c in range(bpp):
                val = pixels[sy * stride + sx * bpp + c]
                out_row[nx * bpp + c] = val & 0xfc
        sub_row = bytearray(new_w * bpp)
        for i in range(new_w * bpp):
            a = out_row[i - bpp] if i >= bpp else 0
            sub_row[i] = (out_row[i] - a) & 0xff
        out_raw.append(1)
        out_raw.extend(sub_row)

    ihdr_data = struct.pack(">IIBBBBB", new_w, new_h, 8, color_type, 0, 0, 0)
    compressed_idat = zlib.compress(bytes(out_raw), 9)
    new_png = (
        b"\x89PNG\r\n\x1a\n"
        + make_png_chunk(b"IHDR", ihdr_data)
        + make_png_chunk(b"IDAT", compressed_idat)
        + make_png_chunk(b"IEND", b"")
    )

    tmp_p = png_path + ".tmp"
    with open(tmp_p, "wb") as f:
        f.write(new_png)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp_p, png_path)
    print(f"-> Optimized PNG {os.path.relpath(png_path, ROOT_DIR)}: {len(new_png) / 1024:.1f} KB")


def optimize_embedded_svg(svg_path: str, optimized_png_path: str) -> None:
    """
    Replaces 1MB+ Base64-embedded PNG inside logo.svg with the optimized PNG
    so logo.svg drops from 1,049 KB to ~45 KB.
    """
    if not os.path.exists(svg_path) or not os.path.exists(optimized_png_path):
        return
    if os.path.getsize(svg_path) < 100000:
        return

    with open(optimized_png_path, "rb") as f:
        b64_png = base64.b64encode(f.read()).decode("ascii")

    new_svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">\n'
        f'  <image width="512" height="512" href="data:image/png;base64,{b64_png}" />\n'
        '</svg>\n'
    )
    tmp_p = svg_path + ".tmp"
    with open(tmp_p, "w", encoding="utf-8") as f:
        f.write(new_svg)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp_p, svg_path)
    print(f"-> Optimized SVG {os.path.relpath(svg_path, ROOT_DIR)}: {len(new_svg) / 1024:.1f} KB")


# 0. Optimize oversized logos & remove stale duplicate zip files in non-backend folders
for folder in [os.path.join(ROOT_DIR, 'public'), BACKEND_DIR, os.path.join(ROOT_DIR, 'vtu-script', 'assets')]:
    logo_png = os.path.join(folder, 'logo.png')
    logo_svg = os.path.join(folder, 'logo.svg')
    pwa_512 = os.path.join(folder, 'pwa-512.png')
    optimize_png_file(logo_png, 256)
    optimize_embedded_svg(logo_svg, logo_png)
    optimize_png_file(pwa_512, 256)

# Remove unnecessary duplicate .zip files from public/, android/, and root so workspace stays lean (<10MB total)
for cleanup_dir in [
    os.path.join(ROOT_DIR, 'public'),
    os.path.join(ROOT_DIR, 'android', 'app', 'src', 'main', 'assets', 'public'),
]:
    if os.path.exists(cleanup_dir):
        for fname in os.listdir(cleanup_dir):
            if fname.endswith('.zip'):
                try:
                    os.remove(os.path.join(cleanup_dir, fname))
                except OSError:
                    pass
        stale_aistudio = os.path.join(cleanup_dir, 'assets', 'aistudio')
        if os.path.exists(stale_aistudio):
            shutil.rmtree(stale_aistudio, ignore_errors=True)

for root_stale in ['ajdatasub_cpanel_files.zip', 'alaminjagora_cpanel_file.zip', 'archive.zip', 'cpanel_backend.zip', 'vtu_script.zip']:
    p = os.path.join(ROOT_DIR, root_stale)
    if os.path.exists(p):
        try:
            os.remove(p)
        except OSError:
            pass

# 0a. Synchronize backend PHP & SQL files from cpanel-backend/ into cpanel_deploy_package/
if os.path.exists(SOURCE_DIR):
    shutil.rmtree(SOURCE_DIR, ignore_errors=True)
os.makedirs(SOURCE_DIR, exist_ok=True)

if os.path.exists(BACKEND_DIR):
    backend_copied = 0
    for root, dirs, files in os.walk(BACKEND_DIR):
        rel_dir = os.path.relpath(root, BACKEND_DIR)
        target_dir = os.path.join(SOURCE_DIR, rel_dir) if rel_dir != '.' else SOURCE_DIR
        os.makedirs(target_dir, exist_ok=True)
        for f in files:
            if f in ['.DS_Store', 'Thumbs.db'] or f.endswith('.zip') or f.endswith('.tmp'):
                continue
            src_file = os.path.join(root, f)
            dst_file = os.path.join(target_dir, f)
            shutil.copy2(src_file, dst_file)
            backend_copied += 1
    print(f"-> Synchronized {backend_copied} backend PHP, SQL & config files from cpanel-backend/ into staging")

# 0b. Standalone vtu-script packaging
VTU_SCRIPT_DIR = os.path.join(ROOT_DIR, 'vtu-script')
if os.path.exists(VTU_SCRIPT_DIR):
    vtu_zip_paths = [
        os.path.join(BACKEND_DIR, 'vtu_script.zip'),
        os.path.join(ROOT_DIR, 'dist', 'vtu_script.zip')
    ]
    temp_vtu_zip = os.path.join(ROOT_DIR, 'temp_vtu_build.zip')
    if os.path.exists(temp_vtu_zip):
        os.remove(temp_vtu_zip)
    with zipfile.ZipFile(temp_vtu_zip, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as vzf:
        for root, dirs, files in os.walk(VTU_SCRIPT_DIR):
            dirs.sort()
            for file in sorted(files):
                if file in ['.DS_Store', 'Thumbs.db'] or file.endswith('.zip'):
                    continue
                full_p = os.path.join(root, file)
                rel_p = os.path.relpath(full_p, VTU_SCRIPT_DIR).replace(os.path.sep, '/')
                mtime_tuple = time.localtime(os.path.getmtime(full_p))[:6]
                zinfo = zipfile.ZipInfo(rel_p, date_time=mtime_tuple)
                zinfo.compress_type = zipfile.ZIP_DEFLATED
                zinfo.external_attr = 0o644 << 16
                with open(full_p, 'rb') as rf:
                    vzf.writestr(zinfo, rf.read(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    for vp in vtu_zip_paths:
        os.makedirs(os.path.dirname(vp), exist_ok=True)
        tmp_v = vp + '.tmp'
        shutil.copyfile(temp_vtu_zip, tmp_v)
        with open(tmp_v, 'rb') as tf:
            tf.flush()
            os.fsync(tf.fileno())
        os.replace(tmp_v, vp)
    if os.path.exists(temp_vtu_zip):
        os.remove(temp_vtu_zip)
    print(f"-> Packaged standalone vtu_script.zip ({os.path.getsize(vtu_zip_paths[0]) / 1024:.1f} KB)")

# 1. Verify that dist/ exists with compiled frontend
dist_index = os.path.join(DIST_DIR, 'index.html')
dist_assets = os.path.join(DIST_DIR, 'assets')

if not os.path.exists(dist_index) or not os.path.exists(dist_assets):
    print("-> Compiling fresh production build with npx vite build...")
    build_code = os.system('npx vite build')
    if build_code != 0 or not os.path.exists(dist_index):
        raise RuntimeError(f"Vite build failed with code {build_code}")
else:
    print("-> Using existing compiled dist/ frontend assets...")


# 2. Synchronize dist/ assets into cpanel_deploy_package/
cpanel_assets = os.path.join(SOURCE_DIR, 'assets')
os.makedirs(cpanel_assets, exist_ok=True)

for item in os.listdir(cpanel_assets):
    item_path = os.path.join(cpanel_assets, item)
    if os.path.isfile(item_path):
        os.remove(item_path)
    elif os.path.isdir(item_path):
        shutil.rmtree(item_path)

for item in os.listdir(dist_assets):
    if item == 'aistudio':
        continue
    src_path = os.path.join(dist_assets, item)
    dst_path = os.path.join(cpanel_assets, item)
    if os.path.isfile(src_path):
        shutil.copy2(src_path, dst_path)
    elif os.path.isdir(src_path):
        shutil.copytree(src_path, dst_path, dirs_exist_ok=True)

# 3. Synchronize compiled index.html
cpanel_index = os.path.join(SOURCE_DIR, 'index.html')
shutil.copy2(dist_index, cpanel_index)

with open(cpanel_index, 'r', encoding='utf-8') as f:
    index_content = f.read()

scripts = re.findall(r'src=["\']([^"\']+\.js)["\']', index_content)
stylesheets = re.findall(r'href=["\']([^"\']+\.css)["\']', index_content)
print(f"-> Active JS Bundle: {scripts}")
print(f"-> Active Stylesheet: {stylesheets}")

# 4. Synchronize all public assets (including all PDFs, .htaccess, icons & logos)
public_dir = os.path.join(ROOT_DIR, 'public')
if os.path.exists(public_dir):
    for f in os.listdir(public_dir):
        if f.endswith('.zip') or f.endswith('.tmp') or f in ['.DS_Store', 'Thumbs.db']:
            continue
        full_f = os.path.join(public_dir, f)
        if os.path.isfile(full_f):
            shutil.copy2(full_f, os.path.join(SOURCE_DIR, f))

dist_telecom = os.path.join(DIST_DIR, 'telecom')
cpanel_telecom = os.path.join(SOURCE_DIR, 'telecom')
if os.path.exists(dist_telecom):
    shutil.copytree(dist_telecom, cpanel_telecom, dirs_exist_ok=True)


# 5. Create temporary clean ZIP package with deterministic headers
temp_zip = os.path.join(ROOT_DIR, 'temp_cpanel_build.zip')
if os.path.exists(temp_zip):
    os.remove(temp_zip)

file_count = 0
with zipfile.ZipFile(temp_zip, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
    for root, dirs, files in os.walk(SOURCE_DIR):
        if 'aistudio' in dirs:
            dirs.remove('aistudio')
        dirs.sort()
        files.sort()
        for file in files:
            if file in ['.DS_Store', 'Thumbs.db', 'server.cjs', 'server.cjs.map'] or file.endswith('.zip') or file.endswith('.tmp'):
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, SOURCE_DIR)
            rel_path_unix = rel_path.replace(os.path.sep, '/')
            mtime_tuple = time.localtime(os.path.getmtime(full_path))[:6]
            zinfo = zipfile.ZipInfo(rel_path_unix, date_time=mtime_tuple)
            zinfo.compress_type = zipfile.ZIP_DEFLATED
            zinfo.external_attr = 0o644 << 16
            with open(full_path, 'rb') as rf:
                zipf.writestr(zinfo, rf.read(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
            file_count += 1

# Verify ZIP integrity before copying
with zipfile.ZipFile(temp_zip, 'r') as verify_zf:
    bad_file = verify_zf.testzip()
    if bad_file is not None:
        raise ValueError(f"Corrupted file inside ZIP archive: {bad_file}")

temp_size = os.path.getsize(temp_zip)
print(f"-> Compressed {file_count} production files into clean ZIP archive ({temp_size / 1024:.1f} KB).")

if temp_size < 300000:
    raise ValueError(f"Build failed: package size ({temp_size} bytes) is suspiciously small (< 300KB)!")

# 6. Atomically write to all target destinations so files are NEVER 0 bytes
for out_path in OUTPUT_PATHS:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    tmp_dest = out_path + '.tmp'
    shutil.copyfile(temp_zip, tmp_dest)
    with open(tmp_dest, 'rb') as tf:
        tf.flush()
        os.fsync(tf.fileno())
    os.replace(tmp_dest, out_path)
    file_size = os.path.getsize(out_path)
    if file_size == 0 or file_size < 300000:
        raise ValueError(f"CRITICAL ERROR: {out_path} has invalid size: {file_size} bytes")
    print(f"-> Verified non-zero ({file_size / 1024:.1f} KB | {file_size} bytes): {os.path.relpath(out_path, ROOT_DIR)}")

if os.path.exists(temp_zip):
    os.remove(temp_zip)

# Clean up staging directory so it never bloats workspace sync
if os.path.exists(SOURCE_DIR):
    shutil.rmtree(SOURCE_DIR, ignore_errors=True)

print("==================================================================")
print(f"SUCCESS: All cPanel archive zip files verified non-zero ({temp_size / 1024:.1f} KB, {file_count} files)!")
print("==================================================================")
