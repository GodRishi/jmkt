-- Supabase Database Schema for Jai Maa Kamakhya Traders
-- Wholesale Footwear Billing & Ledger

-- 1. Table: saved_parties (Party / Customer Directory)
create table if not exists public.saved_parties (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    phone text,
    address text,
    gstin text default 'Unregistered',
    account_no text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_saved_parties_name on public.saved_parties (name);
create index if not exists idx_saved_parties_phone on public.saved_parties (phone);

-- 2. Table: saved_articles (Footwear Article / Soles Catalog)
create table if not exists public.saved_articles (
    id uuid default gen_random_uuid() primary key,
    article_code text not null,
    color_spec text,
    hsn_code text default '64041990',
    default_mrp numeric default 0,
    default_rate numeric default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_saved_articles_code on public.saved_articles (article_code);

-- 3. Table: invoices_ledger (Main Accounts Ledger)
create table if not exists public.invoices_ledger (
    id uuid default gen_random_uuid() primary key,
    invoice_no text not null,
    invoice_date date,
    buyer_name text not null,
    buyer_address text,
    buyer_gstin text default 'Unregistered',
    account_no text,
    party_phone text,
    place_of_supply text default 'West Bengal (19)',
    dispatch_mode text default 'Local Road Transport',
    terms text default 'Immediate / Against Delivery',
    copy_badge text default 'ORIGINAL FOR RECIPIENT',
    items jsonb not null default '[]'::jsonb,
    total_pairs numeric not null default 0,
    taxable_value numeric not null default 0,
    packing_charge numeric not null default 0,
    cgst numeric not null default 0,
    sgst numeric not null default 0,
    round_off text default '0.00',
    grand_total numeric not null default 0,
    amount_paid numeric not null default 0,
    balance_due numeric not null default 0,
    payment_status text not null default 'pending' check (payment_status in ('pending', 'partial', 'paid')),
    payment_date timestamp with time zone,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Schema Migrations / Additions for existing invoices_ledger tables:
alter table public.invoices_ledger add column if not exists party_phone text;
alter table public.invoices_ledger add column if not exists amount_paid numeric not null default 0;
alter table public.invoices_ledger add column if not exists balance_due numeric not null default 0;

-- Drop and recreate check constraint to allow 'partial' payment status
alter table public.invoices_ledger drop constraint if exists invoices_ledger_payment_status_check;
alter table public.invoices_ledger add constraint invoices_ledger_payment_status_check check (payment_status in ('pending', 'partial', 'paid'));

-- Indexes for speedy party search and invoice lookups
create index if not exists idx_invoices_ledger_invoice_no on public.invoices_ledger (invoice_no);
create index if not exists idx_invoices_ledger_buyer_name on public.invoices_ledger (buyer_name);
create index if not exists idx_invoices_ledger_party_phone on public.invoices_ledger (party_phone);
create index if not exists idx_invoices_ledger_payment_status on public.invoices_ledger (payment_status);
create index if not exists idx_invoices_ledger_created_at on public.invoices_ledger (created_at desc);

-- 4. Table: payment_transactions (Partial & Full Payment History)
create table if not exists public.payment_transactions (
    id uuid default gen_random_uuid() primary key,
    invoice_id uuid not null references public.invoices_ledger(id) on delete cascade,
    payment_date date default current_date not null,
    amount numeric not null,
    payment_mode text default 'Cash' not null check (payment_mode in ('Cash', 'UPI', 'Bank / RTGS', 'Cheque')),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_payment_transactions_invoice_id on public.payment_transactions (invoice_id);
create index if not exists idx_payment_transactions_date on public.payment_transactions (payment_date desc);

-- Trigger to auto-update updated_at timestamp on invoices_ledger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.invoices_ledger;
create trigger set_updated_at
    before update on public.invoices_ledger
    for each row
    execute function public.handle_updated_at();

-- Enable Row Level Security (RLS) on all tables
alter table public.saved_parties enable row level security;
alter table public.saved_articles enable row level security;
alter table public.invoices_ledger enable row level security;
alter table public.payment_transactions enable row level security;

-- Policies: Allow authenticated / anon operations for this internal merchant application
drop policy if exists "Allow all access to saved_parties" on public.saved_parties;
create policy "Allow all access to saved_parties" on public.saved_parties for all using (true) with check (true);

drop policy if exists "Allow all access to saved_articles" on public.saved_articles;
create policy "Allow all access to saved_articles" on public.saved_articles for all using (true) with check (true);

drop policy if exists "Allow all access to invoices_ledger" on public.invoices_ledger;
create policy "Allow all access to invoices_ledger" on public.invoices_ledger for all using (true) with check (true);

drop policy if exists "Allow all access to payment_transactions" on public.payment_transactions;
create policy "Allow all access to payment_transactions" on public.payment_transactions for all using (true) with check (true);
