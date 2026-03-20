create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  order_item_id uuid references public.order_items(id) on delete set null,
  customer_email text not null,
  customer_name text,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists product_reviews_product_email_unique
  on public.product_reviews (product_id, lower(customer_email));

create index if not exists product_reviews_product_status_created_idx
  on public.product_reviews (product_id, status, created_at desc);

create index if not exists product_reviews_customer_email_idx
  on public.product_reviews (lower(customer_email));
