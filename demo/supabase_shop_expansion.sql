-- Additive expansion for the Supabase DBthon demo shop.
-- All generated people and contact addresses are fictional example.test data.

-- Grow the existing core so the new relationships have realistic volume.
insert into public.demo_customers (full_name, email, city, created_at)
select 'Demo Customer ' || lpad(n::text, 3, '0'),
       format('demo.customer.%s@example.test', lpad(n::text, 3, '0')),
       (array['Bengaluru','Pune','Kolkata','Mumbai','Chennai','Hyderabad','Delhi','Jaipur','Kochi','Ahmedabad'])[((n-1)%10)+1],
       timestamptz '2026-01-01 09:00:00+00' + n * interval '1 day'
from generate_series(1, 60) n
on conflict (email) do nothing;

insert into public.demo_products (category_id, sku, name, unit_price, stock_quantity, active)
select c.id, format('DEMO-%s', lpad(n::text, 4, '0')),
       format('%s Demo Product %s', c.name, lpad(n::text, 3, '0')),
       (199 + ((n * 173) % 50000))::numeric / 100,
       (n * 13) % 250,
       n % 17 <> 0
from generate_series(1, 60) n
join lateral (select id, name from public.demo_categories order by name offset ((n-1) % (select count(*) from public.demo_categories)) limit 1) c on true
on conflict (sku) do nothing;

insert into public.demo_orders (order_number, customer_id, placed_at, status, shipping_city, note)
select format('ORD-X%s', lpad(n::text, 5, '0')),
       c.id,
       timestamptz '2026-01-01 10:00:00+00' + n * interval '7 hours',
       (array['paid','shipped','pending','cancelled'])[((n-1)%4)+1],
       c.city,
       case when n % 9 = 0 then 'Synthetic gift order' else null end
from generate_series(1, 180) n
join lateral (select id, city from public.demo_customers order by email offset ((n*7) % (select count(*) from public.demo_customers)) limit 1) c on true
on conflict (order_number) do nothing;

insert into public.demo_order_items (order_id, product_id, quantity, unit_price)
select o.id, p.id, 1 + ((o.seq + line_no) % 4), p.unit_price
from (
  select id, row_number() over (order by order_number) as seq
  from public.demo_orders where order_number like 'ORD-X%'
) o
cross join generate_series(1, 3) line_no
join lateral (
  select id, unit_price from public.demo_products order by sku
  offset ((o.seq * 3 + line_no * 7) % (select count(*) from public.demo_products)) limit 1
) p on true
on conflict (order_id, product_id) do nothing;

insert into public.demo_payments (order_id, amount, method, status, paid_at)
select o.id, sum(oi.quantity * oi.unit_price),
       (array['card','upi','cash'])[((row_number() over (order by o.order_number)-1)%3)+1],
       'completed', o.placed_at + interval '4 minutes'
from public.demo_orders o
join public.demo_order_items oi on oi.order_id = o.id
where o.order_number like 'ORD-X%' and o.status in ('paid','shipped')
group by o.id, o.order_number, o.placed_at
on conflict (order_id) do nothing;

insert into public.demo_shipments (order_id, carrier, tracking_number, shipped_at, delivered_at)
select o.id, (array['Demo Parcel','Fictional Express','Sample Logistics'])[((row_number() over (order by o.order_number)-1)%3)+1],
       'TRACK-X' || lpad(row_number() over (order by o.order_number)::text, 6, '0'),
       o.placed_at + interval '1 day',
       case when row_number() over (order by o.order_number) % 3 = 0 then o.placed_at + interval '4 days' else null end
from public.demo_orders o
where o.order_number like 'ORD-X%' and o.status = 'shipped'
on conflict (order_id) do nothing;

-- New shop entities.
create table if not exists public.demo_addresses (
  id bigint generated always as identity primary key,
  customer_id bigint not null references public.demo_customers(id) on delete cascade,
  address_label text not null check (address_label in ('home','work')),
  address_line text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (customer_id, address_label)
);

create table if not exists public.demo_suppliers (
  id bigint generated always as identity primary key,
  supplier_code text not null unique,
  name text not null,
  contact_email text not null unique,
  city text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.demo_product_suppliers (
  product_id bigint not null references public.demo_products(id) on delete cascade,
  supplier_id bigint not null references public.demo_suppliers(id),
  supplier_sku text not null,
  unit_cost numeric(10,2) not null check (unit_cost >= 0),
  lead_time_days integer not null check (lead_time_days > 0),
  primary key (product_id, supplier_id),
  unique (supplier_id, supplier_sku)
);

create table if not exists public.demo_warehouses (
  id bigint generated always as identity primary key,
  warehouse_code text not null unique,
  name text not null,
  city text not null,
  capacity_units integer not null check (capacity_units > 0),
  active boolean not null default true
);

create table if not exists public.demo_stock_levels (
  product_id bigint not null references public.demo_products(id) on delete cascade,
  warehouse_id bigint not null references public.demo_warehouses(id),
  quantity_on_hand integer not null check (quantity_on_hand >= 0),
  reorder_point integer not null check (reorder_point >= 0),
  updated_at timestamptz not null default now(),
  primary key (product_id, warehouse_id)
);

create table if not exists public.demo_inventory_movements (
  id bigint generated always as identity primary key,
  movement_ref text not null unique,
  product_id bigint not null references public.demo_products(id),
  warehouse_id bigint not null references public.demo_warehouses(id),
  movement_type text not null check (movement_type in ('receipt','sale','return','adjustment','transfer')),
  quantity_delta integer not null check (quantity_delta <> 0),
  occurred_at timestamptz not null,
  note text
);

create table if not exists public.demo_product_images (
  product_id bigint not null references public.demo_products(id) on delete cascade,
  image_position smallint not null check (image_position > 0),
  image_url text not null,
  alt_text text not null,
  primary key (product_id, image_position)
);

create table if not exists public.demo_product_reviews (
  id bigint generated always as identity primary key,
  review_ref text not null unique,
  product_id bigint not null references public.demo_products(id) on delete cascade,
  customer_id bigint not null references public.demo_customers(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text not null,
  body text not null,
  verified_purchase boolean not null default false,
  created_at timestamptz not null
);

create table if not exists public.demo_discounts (
  id bigint generated always as identity primary key,
  code text not null unique,
  description text not null,
  discount_percent numeric(5,2) not null check (discount_percent > 0 and discount_percent <= 90),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  check (ends_at > starts_at)
);

create table if not exists public.demo_order_discounts (
  order_id bigint not null references public.demo_orders(id) on delete cascade,
  discount_id bigint not null references public.demo_discounts(id),
  amount_saved numeric(10,2) not null check (amount_saved >= 0),
  primary key (order_id, discount_id)
);

create table if not exists public.demo_returns (
  id bigint generated always as identity primary key,
  return_number text not null unique,
  order_id bigint not null unique references public.demo_orders(id),
  reason text not null,
  status text not null check (status in ('requested','approved','received','refunded','rejected')),
  requested_at timestamptz not null,
  resolved_at timestamptz,
  check (resolved_at is null or resolved_at >= requested_at)
);

create table if not exists public.demo_return_items (
  return_id bigint not null references public.demo_returns(id) on delete cascade,
  product_id bigint not null references public.demo_products(id),
  quantity integer not null check (quantity > 0),
  refund_amount numeric(10,2) not null check (refund_amount >= 0),
  primary key (return_id, product_id)
);

create table if not exists public.demo_support_tickets (
  id bigint generated always as identity primary key,
  ticket_number text not null unique,
  customer_id bigint not null references public.demo_customers(id) on delete cascade,
  order_id bigint references public.demo_orders(id) on delete set null,
  subject text not null,
  category text not null check (category in ('delivery','payment','product','return','account')),
  status text not null check (status in ('open','in_progress','waiting_customer','resolved','closed')),
  priority smallint not null check (priority between 1 and 5),
  created_at timestamptz not null,
  resolved_at timestamptz
);

create table if not exists public.demo_carts (
  id bigint generated always as identity primary key,
  cart_ref text not null unique,
  customer_id bigint not null references public.demo_customers(id) on delete cascade,
  status text not null check (status in ('active','converted','abandoned')),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.demo_cart_items (
  cart_id bigint not null references public.demo_carts(id) on delete cascade,
  product_id bigint not null references public.demo_products(id),
  quantity integer not null check (quantity > 0),
  added_at timestamptz not null,
  primary key (cart_id, product_id)
);

create table if not exists public.demo_shipment_events (
  id bigint generated always as identity primary key,
  shipment_id bigint not null references public.demo_shipments(id) on delete cascade,
  event_code text not null,
  description text not null,
  location text not null,
  occurred_at timestamptz not null,
  unique (shipment_id, event_code)
);

create table if not exists public.demo_loyalty_accounts (
  customer_id bigint primary key references public.demo_customers(id) on delete cascade,
  points_balance integer not null default 0 check (points_balance >= 0),
  tier text not null check (tier in ('bronze','silver','gold','platinum')),
  joined_at timestamptz not null
);

create table if not exists public.demo_loyalty_transactions (
  id bigint generated always as identity primary key,
  transaction_ref text not null unique,
  customer_id bigint not null references public.demo_loyalty_accounts(customer_id) on delete cascade,
  points_delta integer not null check (points_delta <> 0),
  reason text not null,
  created_at timestamptz not null
);

create index if not exists demo_addresses_customer_id_idx on public.demo_addresses(customer_id);
create index if not exists demo_carts_customer_id_idx on public.demo_carts(customer_id);
create index if not exists demo_product_suppliers_supplier_id_idx on public.demo_product_suppliers(supplier_id);
create index if not exists demo_stock_levels_warehouse_id_idx on public.demo_stock_levels(warehouse_id);
create index if not exists demo_inventory_movements_product_time_idx on public.demo_inventory_movements(product_id, occurred_at desc);
create index if not exists demo_inventory_movements_warehouse_time_idx on public.demo_inventory_movements(warehouse_id, occurred_at desc);
create index if not exists demo_product_reviews_product_created_idx on public.demo_product_reviews(product_id, created_at desc);
create index if not exists demo_product_reviews_customer_id_idx on public.demo_product_reviews(customer_id);
create index if not exists demo_order_discounts_discount_id_idx on public.demo_order_discounts(discount_id);
create index if not exists demo_returns_order_id_idx on public.demo_returns(order_id);
create index if not exists demo_return_items_product_id_idx on public.demo_return_items(product_id);
create index if not exists demo_support_tickets_customer_created_idx on public.demo_support_tickets(customer_id, created_at desc);
create index if not exists demo_support_tickets_order_id_idx on public.demo_support_tickets(order_id);
create index if not exists demo_support_tickets_status_idx on public.demo_support_tickets(status);
create index if not exists demo_cart_items_product_id_idx on public.demo_cart_items(product_id);
create index if not exists demo_shipment_events_shipment_time_idx on public.demo_shipment_events(shipment_id, occurred_at);
create index if not exists demo_loyalty_transactions_customer_time_idx on public.demo_loyalty_transactions(customer_id, created_at desc);

-- Keep every exposed-schema table closed to public API roles and readable only
-- by the workbench's dedicated inspection role, matching the existing demo.
do $$
declare t text;
begin
  foreach t in array array[
    'demo_addresses','demo_suppliers','demo_product_suppliers','demo_warehouses',
    'demo_stock_levels','demo_inventory_movements','demo_product_images',
    'demo_product_reviews','demo_discounts','demo_order_discounts','demo_returns',
    'demo_return_items','demo_support_tickets','demo_carts','demo_cart_items',
    'demo_shipment_events','demo_loyalty_accounts','demo_loyalty_transactions'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select on public.%I to agentic_inspector', t);
    execute format('drop policy if exists %I on public.%I', t || '_inspector_read', t);
    execute format('create policy %I on public.%I for select to agentic_inspector using (true)', t || '_inspector_read', t);
  end loop;
end $$;

-- Fictional operational records: addresses, suppliers, warehouses, stock,
-- movements, images, reviews, promotions, returns, tickets, carts and loyalty.
insert into public.demo_addresses (customer_id, address_label, address_line, city, state, postal_code, is_default)
select c.id, l.label, format('%s %s Demo Street', 10 + c.id % 980, initcap(l.label)), c.city,
       (array['Karnataka','Maharashtra','West Bengal','Tamil Nadu','Telangana','Delhi','Kerala','Rajasthan'])[(c.id % 8)+1],
       lpad((100000 + (c.id * 37 % 899999))::text, 6, '0'), l.label = 'home'
from public.demo_customers c cross join (values ('home'),('work')) l(label)
on conflict (customer_id, address_label) do nothing;

insert into public.demo_suppliers (supplier_code, name, contact_email, city, active)
select 'SUP-' || lpad(n::text, 3, '0'), format('Demo Supplier %s', lpad(n::text, 2, '0')),
       format('supplier.%s@example.test', lpad(n::text, 2, '0')),
       (array['Bengaluru','Mumbai','Pune','Chennai','Delhi','Hyderabad'])[((n-1)%6)+1], n % 11 <> 0
from generate_series(1, 24) n on conflict (supplier_code) do nothing;

insert into public.demo_warehouses (warehouse_code, name, city, capacity_units, active)
select 'WH-' || lpad(n::text, 2, '0'), format('%s Fulfillment Center', city), city, 10000 + n * 2500, true
from generate_series(1, 6) n
cross join lateral (select (array['Bengaluru','Mumbai','Delhi','Chennai','Kolkata','Hyderabad'])[n] city) c
on conflict (warehouse_code) do nothing;

insert into public.demo_product_suppliers (product_id, supplier_id, supplier_sku, unit_cost, lead_time_days)
select p.id, s.id, format('%s-%s', s.supplier_code, p.sku), round(p.unit_price * (0.42 + ((p.id % 20)::numeric / 100)), 2), 3 + (p.id + s.id) % 18
from public.demo_products p
join public.demo_suppliers s on s.id = (select id from public.demo_suppliers order by supplier_code offset ((p.id-1) % (select count(*) from public.demo_suppliers)) limit 1)
on conflict (product_id, supplier_id) do nothing;

insert into public.demo_stock_levels (product_id, warehouse_id, quantity_on_hand, reorder_point)
select p.id, w.id, (p.id * 19 + w.id * 7) % 180, 10 + (p.id + w.id) % 35
from public.demo_products p cross join public.demo_warehouses w
on conflict (product_id, warehouse_id) do nothing;

insert into public.demo_inventory_movements (movement_ref, product_id, warehouse_id, movement_type, quantity_delta, occurred_at, note)
select 'MOV-' || lpad(n::text, 5, '0'), p.id, w.id,
       (array['receipt','sale','return','adjustment','transfer'])[((n-1)%5)+1],
       case when n % 5 = 0 then -1 * (1 + n % 12) else 1 + n % 28 end,
       timestamptz '2026-01-01 00:00:00+00' + n * interval '3 hours',
       case when n % 10 = 0 then 'Cycle count adjustment' else 'Synthetic warehouse activity' end
from generate_series(1, 900) n
join lateral (select id from public.demo_products order by sku offset ((n*11) % (select count(*) from public.demo_products)) limit 1) p on true
join lateral (select id from public.demo_warehouses order by warehouse_code offset (n % (select count(*) from public.demo_warehouses)) limit 1) w on true
on conflict (movement_ref) do nothing;

insert into public.demo_product_images (product_id, image_position, image_url, alt_text)
select p.id, i.position, format('https://images.example.test/products/%s-%s.jpg', p.sku, i.position), format('%s view %s', p.name, i.position)
from public.demo_products p cross join generate_series(1, 3) i(position)
on conflict (product_id, image_position) do nothing;

insert into public.demo_product_reviews (review_ref, product_id, customer_id, rating, title, body, verified_purchase, created_at)
select 'REV-' || lpad(n::text, 5, '0'), p.id, c.id, 1 + (n % 5),
       (array['Great value','Works as expected','Nice quality','Would recommend','Could be better'])[(n%5)+1],
       format('Fictional demo review %s for catalog and reporting examples.', n), n % 3 <> 0,
       timestamptz '2026-02-01 12:00:00+00' + n * interval '11 hours'
from generate_series(1, 360) n
join lateral (select id from public.demo_products order by sku offset ((n*13) % (select count(*) from public.demo_products)) limit 1) p on true
join lateral (select id from public.demo_customers order by email offset ((n*17) % (select count(*) from public.demo_customers)) limit 1) c on true
on conflict (review_ref) do nothing;

insert into public.demo_discounts (code, description, discount_percent, starts_at, ends_at, active)
select 'DEMO-SAVE-' || lpad(n::text, 2, '0'), format('Synthetic promotion %s', n), 5 + (n*3 % 46),
       timestamptz '2026-01-01 00:00:00+00' + n * interval '1 day',
       timestamptz '2027-12-31 23:59:59+00', n % 9 <> 0
from generate_series(1, 20) n on conflict (code) do nothing;

insert into public.demo_order_discounts (order_id, discount_id, amount_saved)
select o.id, d.id, round((select coalesce(sum(oi.quantity * oi.unit_price),0) from public.demo_order_items oi where oi.order_id=o.id) * d.discount_percent / 100, 2)
from (select id, status, row_number() over (order by order_number) n from public.demo_orders where order_number like 'ORD-X%') o
join public.demo_discounts d on d.code = 'DEMO-SAVE-' || lpad((((o.n-1)%20)+1)::text, 2, '0')
where o.n % 3 = 0 and o.status in ('paid','shipped')
on conflict (order_id, discount_id) do nothing;

insert into public.demo_returns (return_number, order_id, reason, status, requested_at, resolved_at)
select 'RET-' || lpad(o.n::text, 5, '0'), o.id,
       (array['size_or_fit','changed_mind','damaged_in_transit','not_as_described','duplicate_order'])[((o.n-1)%5)+1],
       (array['requested','approved','received','refunded','rejected'])[((o.n-1)%5)+1],
       o.placed_at + interval '5 days', case when o.n % 5 = 1 then null else o.placed_at + interval '9 days' end
from (select id, row_number() over (order by order_number) n, placed_at from public.demo_orders where order_number like 'ORD-X%' and status in ('paid','shipped')) o
where o.n % 4 = 0
on conflict (return_number) do nothing;

insert into public.demo_return_items (return_id, product_id, quantity, refund_amount)
select r.id, oi.product_id, 1, oi.unit_price
from public.demo_returns r
join public.demo_order_items oi on oi.order_id = r.order_id
where oi.product_id = (select min(x.product_id) from public.demo_order_items x where x.order_id=r.order_id)
on conflict (return_id, product_id) do nothing;

insert into public.demo_support_tickets (ticket_number, customer_id, order_id, subject, category, status, priority, created_at, resolved_at)
select 'TKT-' || lpad(n::text, 5, '0'), c.id, o.id,
       (array['Where is my order?','Question about a product','Payment status check','Return request','Update delivery details'])[((n-1)%5)+1],
       (array['delivery','product','payment','return','account'])[((n-1)%5)+1],
       (array['open','in_progress','waiting_customer','resolved','closed'])[((n-1)%5)+1], 1 + n % 5,
       timestamptz '2026-03-01 08:00:00+00' + n * interval '5 hours',
       case when n % 5 in (0,4) then timestamptz '2026-03-03 08:00:00+00' + n * interval '5 hours' else null end
from generate_series(1, 150) n
join lateral (select id from public.demo_customers order by email offset ((n*5) % (select count(*) from public.demo_customers)) limit 1) c on true
left join lateral (select id from public.demo_orders order by order_number offset ((n*7) % (select count(*) from public.demo_orders)) limit 1) o on true
on conflict (ticket_number) do nothing;

insert into public.demo_carts (cart_ref, customer_id, status, created_at, updated_at)
select 'CART-' || lpad(n::text, 4, '0'), c.id,
       (array['active','converted','abandoned'])[((n-1)%3)+1],
       timestamptz '2026-04-01 08:00:00+00' + n * interval '1 day',
       timestamptz '2026-04-01 08:00:00+00' + n * interval '1 day' + interval '2 hours'
from generate_series(1, 90) n
join lateral (select id from public.demo_customers order by email offset ((n*3) % (select count(*) from public.demo_customers)) limit 1) c on true
on conflict (cart_ref) do nothing;

insert into public.demo_cart_items (cart_id, product_id, quantity, added_at)
select c.id, p.id, 1 + ((c.seq + line_no) % 5), timestamptz '2026-04-01 08:00:00+00' + (c.seq + line_no) * interval '1 day'
from (select id, row_number() over (order by cart_ref) seq from public.demo_carts) c
cross join generate_series(1, 4) line_no
join lateral (select id from public.demo_products order by sku offset ((c.seq*5 + line_no*3) % (select count(*) from public.demo_products)) limit 1) p on true
on conflict (cart_id, product_id) do nothing;

insert into public.demo_shipment_events (shipment_id, event_code, description, location, occurred_at)
select s.id, e.code, e.description, e.location, s.shipped_at + e.hours_after * interval '1 hour'
from public.demo_shipments s
cross join (values
  ('label_created','Shipping label created','Origin facility',-2),
  ('picked_up','Package picked up','Origin facility',0),
  ('in_transit','Package in transit','Regional hub',18),
  ('out_for_delivery','Out for delivery','Destination city',42),
  ('delivered','Package delivered','Destination address',48)
) e(code,description,location,hours_after)
on conflict (shipment_id, event_code) do nothing;

insert into public.demo_loyalty_accounts (customer_id, points_balance, tier, joined_at)
select c.id, (c.id * 137) % 12000,
       (array['bronze','silver','gold','platinum'])[((c.id-1)%4)+1], c.created_at
from public.demo_customers c on conflict (customer_id) do nothing;

insert into public.demo_loyalty_transactions (transaction_ref, customer_id, points_delta, reason, created_at)
select 'LOY-' || lpad(n::text, 5, '0'), c.id, case when n % 4 = 0 then -1 * (10 + n % 200) else 25 + n % 400 end,
       (array['order_reward','welcome_bonus','redemption','review_bonus'])[((n-1)%4)+1],
       timestamptz '2026-01-01 00:00:00+00' + n * interval '9 hours'
from generate_series(1, 600) n
join lateral (select id from public.demo_customers order by email offset ((n*19) % (select count(*) from public.demo_customers)) limit 1) c on true
on conflict (transaction_ref) do nothing;

create or replace view public.demo_customer_lifetime_value with (security_invoker = true) as
select c.id as customer_id, c.full_name, c.city,
       count(distinct o.id)::integer as order_count,
       coalesce(sum(oi.quantity * oi.unit_price), 0)::numeric(12,2) as gross_order_value,
       max(o.placed_at) as last_order_at
from public.demo_customers c
left join public.demo_orders o on o.customer_id = c.id and o.status in ('paid','shipped')
left join public.demo_order_items oi on oi.order_id = o.id
group by c.id, c.full_name, c.city;
revoke all on public.demo_customer_lifetime_value from public, anon, authenticated;
grant select on public.demo_customer_lifetime_value to agentic_inspector;
