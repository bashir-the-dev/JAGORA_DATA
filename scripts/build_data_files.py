import json
import re

with open('scripts/live_peyflex_plans.json', 'r', encoding='utf-8') as f:
    plans = json.load(f)

print(f"Loaded {len(plans)} plans from live_peyflex_plans.json")

# 1. Generate TypeScript mockData.ts
ts_lines = [
    "import { NetworkProvider, DataPlan, Transaction, NotificationItem, UserProfile, PeyflexDataNetwork } from '../types';",
    "",
    "export const initialUser: UserProfile = {",
    "  name: '',",
    "  phone: '',",
    "  email: '',",
    "  avatarUrl: '',",
    "  isVerified: false,",
    "  balance: 0.00,",
    "  bonusBalance: 0.00,",
    "  biometricEnabled: false,",
    "  hasPin: false,",
    "  virtualAccounts: [],",
    "};",
    "",
    "/**",
    " * General telecom carrier definitions for non-data services (Airtime, PIN, etc.)",
    " */",
    "export const networkProviders: NetworkProvider[] = [",
    "  {",
    "    id: 'mtn',",
    "    name: 'MTN',",
    "    badge: 'M',",
    "    badgeColor: '#ffdb3c',",
    "    textColor: '#ffdb3c',",
    "    bgColor: 'rgba(255, 219, 60, 0.1)',",
    "  },",
    "  {",
    "    id: 'airtel',",
    "    name: 'Airtel',",
    "    badge: 'A',",
    "    badgeColor: '#ffb4ab',",
    "    textColor: '#ff5252',",
    "    bgColor: 'rgba(255, 82, 82, 0.1)',",
    "  },",
    "  {",
    "    id: 'glo',",
    "    name: 'Glo',",
    "    badge: 'G',",
    "    badgeColor: '#34a853',",
    "    textColor: '#00c853',",
    "    bgColor: 'rgba(0, 200, 83, 0.1)',",
    "  },",
    "  {",
    "    id: '9mobile',",
    "    name: '9mobile',",
    "    badge: '9',",
    "    badgeColor: '#006400',",
    "    textColor: '#4caf50',",
    "    bgColor: 'rgba(76, 175, 80, 0.1)',",
    "  },",
    "];",
    "",
    "/**",
    " * AUTHORITATIVE PEYFLEX DATA NETWORKS",
    " * Strictly mirrors curl 'https://client.peyflex.com.ng/api/data/networks/'",
    " */",
    "export const peyflexDataNetworks: PeyflexDataNetwork[] = [",
    "  {",
    "    name: 'MTN (Data Share)',",
    "    identifier: 'mtn_data_share',",
    "    carrier: 'mtn',",
    "    badge: 'M',",
    "    badgeColor: '#ffdb3c',",
    "    textColor: '#ffdb3c',",
    "    bgColor: 'rgba(255, 219, 60, 0.1)',",
    "    category: 'Data Share',",
    "  },",
    "  {",
    "    name: 'MTN (Gifting)',",
    "    identifier: 'mtn_gifting_data',",
    "    carrier: 'mtn',",
    "    badge: 'M',",
    "    badgeColor: '#ffdb3c',",
    "    textColor: '#ffdb3c',",
    "    bgColor: 'rgba(255, 219, 60, 0.1)',",
    "    category: 'Gifting Data',",
    "  },",
    "  {",
    "    name: 'AIRTEL (GIFTING)',",
    "    identifier: 'airtel_data',",
    "    carrier: 'airtel',",
    "    badge: 'A',",
    "    badgeColor: '#ffb4ab',",
    "    textColor: '#ff5252',",
    "    bgColor: 'rgba(255, 82, 82, 0.1)',",
    "    category: 'Gifting Data',",
    "  },",
    "  {",
    "    name: 'GLO DATA (CG)',",
    "    identifier: 'glo_data',",
    "    carrier: 'glo',",
    "    badge: 'G',",
    "    badgeColor: '#34a853',",
    "    textColor: '#00c853',",
    "    bgColor: 'rgba(0, 200, 83, 0.1)',",
    "    category: 'Corporate Gifting',",
    "  },",
    "  {",
    "    name: '9MOBILE (CG)',",
    "    identifier: '9mobile_data',",
    "    carrier: '9mobile',",
    "    badge: '9',",
    "    badgeColor: '#006400',",
    "    textColor: '#4caf50',",
    "    bgColor: 'rgba(76, 175, 80, 0.1)',",
    "    category: 'Corporate Gifting',",
    "  },",
    "];",
    "",
    "export const dataPlans: DataPlan[] = ["
]

for p in plans:
    name_clean = p["name"].replace("'", "\\'")
    ts_lines.append(
        f"  {{ id: '{p['id']}', network: '{p['network_key']}', networkKey: '{p['network_key']}', size: '{p['size']}', validity: '{p['validity']}', type: '{p['category']}', price: {p['selling_price']}, costPrice: {p['gateway_price']}, gatewayPrice: {p['gateway_price']}, planCode: '{p['plan_code']}', name: '{name_clean}' }},"
    )

ts_lines.extend([
    "];",
    "",
    "export const initialTransactions: Transaction[] = [];",
    "",
    "export const initialNotifications: NotificationItem[] = [];",
    ""
])

with open('src/data/mockData.ts', 'w', encoding='utf-8') as f:
    f.write('\n'.join(ts_lines))
print("-> Updated src/data/mockData.ts with peyflexDataNetworks and all 86 plans")

# 2. Generate PHP catalog for cpanel-backend/vtu/plans.php
php_catalog_lines = ["$masterCatalog = ["]
for p in plans:
    name_clean = p["name"].replace("'", "\\'")
    cat_clean = p["category"].replace("'", "\\'")
    php_catalog_lines.append(
        f"    ['id' => '{p['id']}', 'api_plan_id' => '{p['plan_code']}', 'plan_code' => '{p['plan_code']}', 'network' => '{p['carrier']}', 'network_key' => '{p['network_key']}', 'network_identifier' => '{p['network_key']}', 'size' => '{p['size']}', 'validity' => '{p['validity']}', 'type' => '{cat_clean}', 'category' => '{cat_clean}', 'price' => {p['selling_price']}, 'cost_price' => {p['gateway_price']}, 'gateway_price' => {p['gateway_price']}, 'wholesale' => {p['gateway_price']}, 'plan_name' => '{name_clean}'],"
    )
php_catalog_lines.append("];")

with open('scripts/php_master_catalog.php', 'w', encoding='utf-8') as f:
    f.write('\n'.join(php_catalog_lines))
print("-> Generated scripts/php_master_catalog.php")

# 3. Generate SQL for cpanel-backend/database.sql
sql_vtu_plans = [
    "INSERT INTO `vtu_plans` (`provider_id`, `network`, `plan_name`, `original_wholesale_price`, `custom_retail_price`, `api_plan_id`, `status`, `category`, `size`, `validity`) VALUES"
]
sql_vtu_entries = []
for p in plans:
    net_enum = p['carrier'].upper()
    name_clean = p["name"].replace("'", "\\'")
    cat_clean = p["category"].replace("'", "\\'")
    sql_vtu_entries.append(
        f"('payflex', '{net_enum}', '{name_clean}', {p['gateway_price']:.2f}, {p['selling_price']:.2f}, '{p['plan_code']}', 'active', '{cat_clean}', '{p['size']}', '{p['validity']}')"
    )

sql_vtu_plans.append(',\n'.join(sql_vtu_entries))
sql_vtu_plans.append("ON DUPLICATE KEY UPDATE `original_wholesale_price`=VALUES(`original_wholesale_price`), `custom_retail_price`=VALUES(`custom_retail_price`);")

with open('scripts/vtu_plans_seed.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_vtu_plans))
print("-> Generated scripts/vtu_plans_seed.sql")
