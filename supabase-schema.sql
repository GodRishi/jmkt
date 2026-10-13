-- Supabase Database Schema for Jai Maa Kamakhya Traders
-- Table: invoices_ledger

create table if not exists public.invoices_ledger (
    id uuid default gen_random_uuid() primary key,
    invoice_no text not null,
    invoice_date date,
    buyer_name text not null,
    buyer_address text,
    buyer_gstin text default 'Unregistered',
    account_no text,
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
    payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
    payment_date timestamp with time zone,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for speedy party search and invoice lookups
create index if not exists idx_invoices_ledger_invoice_no on public.invoices_ledger (invoice_no);
create index if not exists idx_invoices_ledger_buyer_name on public.invoices_ledger (buyer_name);
create index if not exists idx_invoices_ledger_payment_status on public.invoices_ledger (payment_status);
create index if not exists idx_invoices_ledger_created_at on public.invoices_ledger (created_at desc);

-- Trigger to auto-update updated_at timestamp
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

-- Enable Row Level Security (RLS)
alter table public.invoices_ledger enable row level security;

-- Policy: Allow authenticated / anon operations for this internal app
create policy "Allow all access to invoices_ledger"
    on public.invoices_ledger
    for all
    using (true)
    with check (true);
