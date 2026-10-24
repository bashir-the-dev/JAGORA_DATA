import json

with open('scripts/live_peyflex_plans.json', 'r', encoding='utf-8') as f:
    plans = json.load(f)

# Build vtu_plans insert
vtu_insert = "INSERT INTO `vtu_plans` (`provider_id`, `network`, `plan_name`, `original_wholesale_price`, `custom_retail_price`, `api_plan_id`, `status`, `category`, `size`, `validity`) VALUES\n"
vtu_rows = []
for p in plans:
    net_enum = p['carrier'].upper()
    name_clean = p['name'].replace("'", "\\'")
    cat_clean = p['category'].replace("'", "\\'")
    vtu_rows.append(f"('payflex', '{net_enum}', '{name_clean}', {p['gateway_price']:.2f}, {p['selling_price']:.2f}, '{p['plan_code']}', 'active', '{cat_clean}', '{p['size']}', '{p['validity']}')")

vtu_insert += ',\n'.join(vtu_rows)
vtu_insert += "\nON DUPLICATE KEY UPDATE `original_wholesale_price`=VALUES(`original_wholesale_price`), `custom_retail_price`=VALUES(`custom_retail_price`);"

# Build data_plans insert
dp_insert = "INSERT INTO `data_plans` (`plan_id`, `network`, `type`, `size`, `price`, `validity`, `provider_code`, `is_active`) VALUES\n"
dp_rows = []
for p in plans:
    name_clean = p['name'].replace("'", "\\'")
    cat_clean = p['category'].replace("'", "\\'")
    dp_rows.append(f"('{p['id']}', '{p['carrier']}', '{cat_clean}', '{p['size']}', {p['selling_price']:.2f}, '{p['validity']}', '{p['plan_code']}', 1)")

dp_insert += ',\n'.join(dp_rows)
dp_insert += "\nON DUPLICATE KEY UPDATE `price`=VALUES(`price`);"

with open('cpanel-backend/database.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

# Find marker for data_plans
dp_start_marker = "-- 3. Table: data_plans"
idx_dp_table = sql.find(dp_start_marker)
# Find where INSERT INTO data_plans starts after that
idx_insert_dp = sql.find("INSERT INTO `data_plans`", idx_dp_table)

vtu_start_marker = "-- Seed Popular VTU Plans"
idx_vtu = sql.find(vtu_start_marker)
super_admin_marker = "-- Seed Super Admin User (Bashir Abubakar)"
idx_admin = sql.find(super_admin_marker)

print(f"Indices: dp={idx_insert_dp}, vtu={idx_vtu}, admin={idx_admin}")

if idx_insert_dp != -1 and idx_vtu != -1 and idx_admin != -1:
    new_sql = sql[:idx_insert_dp] + dp_insert + "\n\n" + "-- Seed Popular VTU Plans (vtu_plans) - API Reseller Discounted Wholesale Rates\n" + vtu_insert + "\n\n" + sql[idx_admin:]
    with open('cpanel-backend/database.sql', 'w', encoding='utf-8') as f:
        f.write(new_sql)
    print("Updated cpanel-backend/database.sql with all 86 plans successfully!")
else:
    print("Could not find markers in cpanel-backend/database.sql")
