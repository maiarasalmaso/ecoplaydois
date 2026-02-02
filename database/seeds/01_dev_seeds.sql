-- Seed Data for Dev Environment

-- Warehouses
INSERT INTO warehouses (code, location_name, address_json) VALUES
('SP-01', 'São Paulo Main Hub', '{"zip": "01000-000", "city": "São Paulo", "state": "SP"}'),
('RJ-01', 'Rio Operations', '{"zip": "20000-000", "city": "Rio de Janeiro", "state": "RJ"}')
ON CONFLICT (code) DO NOTHING;

-- Products
INSERT INTO products (name, slug, base_attributes) VALUES
('EcoBottle 500ml', 'ecobottle-500ml', '{"color": "green", "material": "recycled_plastic", "weight": "200g"}'),
('Solar Charger Generic', 'solar-charger-gen1', '{"capacity": "10000mAh", "ports": 2, "waterproof": true}')
ON CONFLICT (slug) DO NOTHING;

-- Users removed per request
-- INSERT INTO users ...


-- Inventory (Linking Products to Warehouses)
-- Note: We need to look up IDs dynamically in a real script, but for SQL seeds we often assume knowledge or use subqueries.
INSERT INTO inventory (product_id, warehouse_id, quantity)
SELECT p.id, w.id, 100
FROM products p, warehouses w
WHERE p.slug = 'ecobottle-500ml' AND w.code = 'SP-01'
ON CONFLICT (product_id, warehouse_id) DO NOTHING;

INSERT INTO inventory (product_id, warehouse_id, quantity)
SELECT p.id, w.id, 50
FROM products p, warehouses w
WHERE p.slug = 'solar-charger-gen1' AND w.code = 'SP-01'
ON CONFLICT (product_id, warehouse_id) DO NOTHING;
