CREATE TABLE producto (
  id SERIAL PRIMARY KEY,
  sku TEXT NOT NULL,
  tienda_id INT NOT NULL
);
CREATE UNIQUE INDEX ux_producto_sku_tienda ON producto (sku, tienda_id);
CREATE INDEX ix_producto_sku ON producto (sku);