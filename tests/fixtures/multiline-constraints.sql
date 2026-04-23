CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    CONSTRAINT chk_users_status CHECK (
        status IN ('active', 'suspended', 'deleted')
    )
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    qty INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_amount NUMERIC(12,2) GENERATED ALWAYS AS (qty * unit_price) STORED,
    status TEXT NOT NULL,
    CONSTRAINT chk_orders_status CHECK (
        status IN ('pending', 'paid', 'shipped', 'cancelled')
    ),
    CONSTRAINT uq_orders_user_product UNIQUE (user_id, product_id),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_orders_product FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
);
