-- Rename fuel_cost → diesel_cost (run once if your table still has fuel_cost)
alter table trips rename column fuel_cost to diesel_cost;
