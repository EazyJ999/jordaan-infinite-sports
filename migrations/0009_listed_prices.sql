update products
set price = case
      when category = 'retro' then 850
      when category = 'f1' then 850
      when category = 'training' then 800
      else 800
    end,
    fan_price = case
      when category = 'retro' then 850
      when category = 'f1' then 850
      when category = 'training' then 800
      else 800
    end,
    box_price = null,
    box_fan_price = null;
