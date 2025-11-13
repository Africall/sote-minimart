create or replace function public.get_stock_movement_report(
  start_date date,
  end_date   date
)
returns table (
  product_id       uuid,
  product_name     text,
  category         text,
  total_purchased  numeric,
  total_sold       numeric,
  remaining_stock  integer,
  unit_cost        numeric,
  selling_price    numeric,
  stock_value      numeric
)
language plpgsql
as $$
begin
  return query
  select
    p.id                                          as product_id,
    p.name                                        as product_name,
    p.category                                    as category,
    coalesce(pu.total_purchased, 0)::numeric      as total_purchased,
    coalesce(s.total_sold, 0)::numeric            as total_sold,
    p.stock_quantity                              as remaining_stock,
    p.cost                                        as unit_cost,
    p.price                                       as selling_price,
    (p.stock_quantity * p.cost)::numeric          as stock_value
  from products p
  -- PURCHASES (invoice_line_items)
  left join (
    select
      ili.product_id,
      sum(ili.quantity)::numeric as total_purchased
    from invoice_line_items ili
      join invoices i on i.id = ili.invoice_id
    where
      i.issue_date::date >= start_date
      and i.issue_date::date <= end_date
    group by ili.product_id
  ) pu on pu.product_id = p.id
  -- SALES (sale_items + sales)
  left join (
    select
      si.product_id,
      sum(si.quantity)::numeric as total_sold
    from sale_items si
      join sales s on s.id = si.sale_id
    where
      s.created_at::date >= start_date
      and s.created_at::date <= end_date
    group by si.product_id
  ) s on s.product_id = p.id
  order by p.name;
end;
$$;
