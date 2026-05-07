-- Viajax — Dados iniciais de demonstração (idempotentes)

INSERT IGNORE INTO users (id, email, name, is_creator, bio) VALUES
('demo-creator-001', 'demo@viajax.es', 'Creator Demo', TRUE, 'Creator de demonstração do Viajax');

INSERT IGNORE INTO products (id, title, description, price, category, published, creator_id) VALUES
('demo-product-001', 'Guia Completo de Lisboa', 'Descobre Lisboa como um local — roteiros, restaurantes secretos e dicas exclusivas.', 9.99, 'Viagem', TRUE, 'demo-creator-001'),
('demo-product-002', 'Como Monetizar o Teu Conteúdo', 'O guia completo para creators que querem viver do seu conteúdo digital.', 14.99, 'Negócios', TRUE, 'demo-creator-001');
