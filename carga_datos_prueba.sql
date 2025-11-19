-- Script DML para cargar datos de ejemplo en Tesorero
-- 3 equipos con varios movimientos cada uno

-- Limpiar datos existentes (opcional, comentar si no se desea)
-- TRUNCATE TABLE movements CASCADE;
-- TRUNCATE TABLE teams CASCADE;

-- ============================================
-- EQUIPOS
-- ============================================

INSERT INTO teams (id, name, currency_default, date_created, date_updated) VALUES
(1, 'Club Deportivo Los Leones', 'ARS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Atlético San Martín', 'ARS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Racing Club del Barrio', 'ARS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Resetear la secuencia si es necesario
SELECT setval('teams_id_seq', GREATEST(3, (SELECT MAX(id) FROM teams)));

-- ============================================
-- MOVIMIENTOS - EQUIPO 1: Club Deportivo Los Leones
-- ============================================

-- Cuotas de socios
INSERT INTO movements (team_id, fecha, tipo, monto_bruto, monto_fee, monto_neto, moneda, metodo_pago, origen_tipo, origen_id, estado, description, payment_provider) VALUES
(1, '2024-01-15 10:30:00', 'cuota', 5000.00, 0.00, 5000.00, 'ARS', 'transferencia', 'member', 1, 'confirmed', 'Cuota mensual enero - Socio #1', 'manual'),
(1, '2024-01-20 14:15:00', 'cuota', 5000.00, 150.00, 4850.00, 'ARS', 'mercadopago', 'member', 2, 'confirmed', 'Cuota mensual enero - Socio #2', 'mercadopago'),
(1, '2024-02-10 09:00:00', 'cuota', 5000.00, 0.00, 5000.00, 'ARS', 'efectivo', 'member', 1, 'confirmed', 'Cuota mensual febrero - Socio #1', 'manual'),
(1, '2024-02-15 11:20:00', 'cuota', 5000.00, 150.00, 4850.00, 'ARS', 'mercadopago', 'member', 2, 'confirmed', 'Cuota mensual febrero - Socio #2', 'mercadopago'),
(1, '2024-03-05 16:45:00', 'cuota', 5000.00, 0.00, 5000.00, 'ARS', 'transferencia', 'member', 3, 'confirmed', 'Cuota mensual marzo - Socio #3', 'manual'),
(1, '2024-03-12 10:00:00', 'cuota', 5000.00, 150.00, 4850.00, 'ARS', 'mercadopago', 'member', 4, 'confirmed', 'Cuota mensual marzo - Socio #4', 'mercadopago');

-- Aportes
INSERT INTO movements (team_id, fecha, tipo, monto_bruto, monto_fee, monto_neto, moneda, metodo_pago, origen_tipo, origen_id, estado, description, payment_provider) VALUES
(1, '2024-01-25 15:30:00', 'aporte', 10000.00, 0.00, 10000.00, 'ARS', 'transferencia', 'member', 5, 'confirmed', 'Aporte extraordinario para compra de equipamiento', 'manual'),
(1, '2024-02-28 12:00:00', 'aporte', 7500.00, 0.00, 7500.00, 'ARS', 'efectivo', 'member', 6, 'confirmed', 'Aporte para mejoras en cancha', 'manual'),
(1, '2024-03-20 14:30:00', 'aporte', 15000.00, 0.00, 15000.00, 'ARS', 'transferencia', 'member', 7, 'confirmed', 'Aporte para torneo regional', 'manual');

-- Colectas
INSERT INTO movements (team_id, fecha, tipo, monto_bruto, monto_fee, monto_neto, moneda, metodo_pago, origen_tipo, origen_id, estado, description, payment_provider) VALUES
(1, '2024-02-01 10:00:00', 'colecta', 25000.00, 750.00, 24250.00, 'ARS', 'mercadopago', 'collecta', 1, 'confirmed', 'Colecta para viaje a torneo nacional', 'mercadopago'),
(1, '2024-02-10 11:00:00', 'colecta', 5000.00, 150.00, 4850.00, 'ARS', 'mercadopago', 'collecta', 1, 'confirmed', 'Donación anónima - Colecta torneo', 'mercadopago'),
(1, '2024-02-15 16:00:00', 'colecta', 3000.00, 90.00, 2910.00, 'ARS', 'mercadopago', 'collecta', 1, 'confirmed', 'Donación familiar - Colecta torneo', 'mercadopago'),
(1, '2024-02-20 09:30:00', 'colecta', 8000.00, 240.00, 7760.00, 'ARS', 'mercadopago', 'collecta', 1, 'confirmed', 'Donación empresa local - Colecta torneo', 'mercadopago');

-- Sponsors
INSERT INTO movements (team_id, fecha, tipo, monto_bruto, monto_fee, monto_neto, moneda, metodo_pago, origen_tipo, origen_id, estado, description, payment_provider) VALUES
(1, '2024-01-01 08:00:00', 'sponsor', 50000.00, 0.00, 50000.00, 'ARS', 'transferencia', 'sponsor', 1, 'confirmed', 'Sponsor principal - Enero', 'manual'),
(1, '2024-02-01 08:00:00', 'sponsor', 50000.00, 0.00, 50000.00, 'ARS', 'transferencia', 'sponsor', 1, 'confirmed', 'Sponsor principal - Febrero', 'manual'),
(1, '2024-03-01 08:00:00', 'sponsor', 50000.00, 0.00, 50000.00, 'ARS', 'transferencia', 'sponsor', 1, 'confirmed', 'Sponsor principal - Marzo', 'manual'),
(1, '2024-01-10 10:00:00', 'sponsor', 20000.00, 0.00, 20000.00, 'ARS', 'transferencia', 'sponsor', 2, 'confirmed', 'Sponsor secundario - Enero', 'manual');

-- Cashout (retiros)
INSERT INTO movements (team_id, fecha, tipo, monto_bruto, monto_fee, monto_neto, moneda, metodo_pago, origen_tipo, origen_id, estado, description, payment_provider) VALUES
(1, '2024-01-30 17:00:00', 'cashout', 15000.00, 0.00, 15000.00, 'ARS', 'transferencia', 'manual', NULL, 'confirmed', 'Pago a proveedor - Equipamiento deportivo', 'manual'),
(1, '2024-02-25 16:00:00', 'cashout', 8000.00, 0.00, 8000.00, 'ARS', 'efectivo', 'manual', NULL, 'confirmed', 'Pago arbitraje - Partido local', 'manual'),
(1, '2024-03-15 12:00:00', 'cashout', 12000.00, 0.00, 12000.00, 'ARS', 'transferencia', 'manual', NULL, 'confirmed', 'Pago alquiler cancha - Marzo', 'manual');

-- ============================================
-- MOVIMIENTOS - EQUIPO 2: Atlético San Martín
-- ============================================

-- Cuotas de socios
INSERT INTO movements (team_id, fecha, tipo, monto_bruto, monto_fee, monto_neto, moneda, metodo_pago, origen_tipo, origen_id, estado, description, payment_provider) VALUES
(2, '2024-01-10 09:00:00', 'cuota', 4500.00, 0.00, 4500.00, 'ARS', 'transferencia', 'member', 10, 'confirmed', 'Cuota mensual enero - Socio #10', 'manual'),
(2, '2024-01-18 14:30:00', 'cuota', 4500.00, 135.00, 4365.00, 'ARS', 'mercadopago', 'member', 11, 'confirmed', 'Cuota mensual enero - Socio #11', 'mercadopago'),
(2, '2024-01-25 10:15:00', 'cuota', 4500.00, 0.00, 4500.00, 'ARS', 'efectivo', 'member', 12, 'confirmed', 'Cuota mensual enero - Socio #12', 'manual'),
(2, '2024-02-08 11:00:00', 'cuota', 4500.00, 0.00, 4500.00, 'ARS', 'transferencia', 'member', 10, 'confirmed', 'Cuota mensual febrero - Socio #10', 'manual'),
(2, '2024-02-15 15:20:00', 'cuota', 4500.00, 135.00, 4365.00, 'ARS', 'mercadopago', 'member', 11, 'confirmed', 'Cuota mensual febrero - Socio #11', 'mercadopago'),
(2, '2024-03-10 09:30:00', 'cuota', 4500.00, 0.00, 4500.00, 'ARS', 'transferencia', 'member', 13, 'confirmed', 'Cuota mensual marzo - Socio #13', 'manual'),
(2, '2024-03-18 16:00:00', 'cuota', 4500.00, 135.00, 4365.00, 'ARS', 'mercadopago', 'member', 14, 'confirmed', 'Cuota mensual marzo - Socio #14', 'mercadopago');

-- Aportes
INSERT INTO movements (team_id, fecha, tipo, monto_bruto, monto_fee, monto_neto, moneda, metodo_pago, origen_tipo, origen_id, estado, description, payment_provider) VALUES
(2, '2024-01-20 13:00:00', 'aporte', 8000.00, 0.00, 8000.00, 'ARS', 'transferencia', 'member', 15, 'confirmed', 'Aporte para compra de pelotas', 'manual'),
(2, '2024-02-22 10:30:00', 'aporte', 12000.00, 0.00, 12000.00, 'ARS', 'transferencia', 'member', 16, 'confirmed', 'Aporte para reparación de arcos', 'manual'),
(2, '2024-03-25 14:00:00', 'aporte', 6000.00, 0.00, 6000.00, 'ARS', 'efectivo', 'member', 17, 'confirmed', 'Aporte para indumentaria', 'manual');

-- Colectas
INSERT INTO movements (team_id, fecha, tipo, monto_bruto, monto_fee, monto_neto, moneda, metodo_pago, origen_tipo, origen_id, estado, description, payment_provider) VALUES
(2, '2024-02-05 10:00:00', 'colecta', 15000.00, 450.00, 14550.00, 'ARS', 'mercadopago', 'collecta', 2, 'confirmed', 'Colecta para viaje a campeonato', 'mercadopago'),
(2, '2024-02-12 11:30:00', 'colecta', 2000.00, 60.00, 1940.00, 'ARS', 'mercadopago', 'collecta', 2, 'confirmed', 'Donación - Colecta campeonato', 'mercadopago'),
(2, '2024-02-18 15:00:00', 'colecta', 5000.00, 150.00, 4850.00, 'ARS', 'mercadopago', 'collecta', 2, 'confirmed', 'Donación familiar - Colecta campeonato', 'mercadopago'),
(2, '2024-02-25 09:00:00', 'colecta', 3000.00, 90.00, 2910.00, 'ARS', 'mercadopago', 'collecta', 2, 'confirmed', 'Donación vecino - Colecta campeonato', 'mercadopago');

-- Sponsors
INSERT INTO movements (team_id, fecha, tipo, monto_bruto, monto_fee, monto_neto, moneda, metodo_pago, origen_tipo, origen_id, estado, description, payment_provider) VALUES
(2, '2024-01-01 08:00:00', 'sponsor', 40000.00, 0.00, 40000.00, 'ARS', 'transferencia', 'sponsor', 3, 'confirmed', 'Sponsor principal - Enero', 'manual'),
(2, '2024-02-01 08:00:00', 'sponsor', 40000.00, 0.00, 40000.00, 'ARS', 'transferencia', 'sponsor', 3, 'confirmed', 'Sponsor principal - Febrero', 'manual'),
(2, '2024-03-01 08:00:00', 'sponsor', 40000.00, 0.00, 40000.00, 'ARS', 'transferencia', 'sponsor', 3, 'confirmed', 'Sponsor principal - Marzo', 'manual');

-- Cashout
INSERT INTO movements (team_id, fecha, tipo, monto_bruto, monto_fee, monto_neto, moneda, metodo_pago, origen_tipo, origen_id, estado, description, payment_provider) VALUES
(2, '2024-01-28 17:30:00', 'cashout', 10000.00, 0.00, 10000.00, 'ARS', 'transferencia', 'manual', NULL, 'confirmed', 'Pago a proveedor - Material deportivo', 'manual'),
(2, '2024-02-20 15:00:00', 'cashout', 6000.00, 0.00, 6000.00, 'ARS', 'efectivo', 'manual', NULL, 'confirmed', 'Pago arbitraje - Partido', 'manual'),
(2, '2024-03-22 13:30:00', 'cashout', 9000.00, 0.00, 9000.00, 'ARS', 'transferencia', 'manual', NULL, 'confirmed', 'Pago alquiler cancha - Marzo', 'manual');

-- ============================================
-- MOVIMIENTOS - EQUIPO 3: Racing Club del Barrio
-- ============================================

-- Cuotas de socios
INSERT INTO movements (team_id, fecha, tipo, monto_bruto, monto_fee, monto_neto, moneda, metodo_pago, origen_tipo, origen_id, estado, description, payment_provider) VALUES
(3, '2024-01-12 10:00:00', 'cuota', 6000.00, 0.00, 6000.00, 'ARS', 'transferencia', 'member', 20, 'confirmed', 'Cuota mensual enero - Socio #20', 'manual'),
(3, '2024-01-20 14:00:00', 'cuota', 6000.00, 180.00, 5820.00, 'ARS', 'mercadopago', 'member', 21, 'confirmed', 'Cuota mensual enero - Socio #21', 'mercadopago'),
(3, '2024-01-28 11:30:00', 'cuota', 6000.00, 0.00, 6000.00, 'ARS', 'efectivo', 'member', 22, 'confirmed', 'Cuota mensual enero - Socio #22', 'manual'),
(3, '2024-02-12 09:15:00', 'cuota', 6000.00, 0.00, 6000.00, 'ARS', 'transferencia', 'member', 20, 'confirmed', 'Cuota mensual febrero - Socio #20', 'manual'),
(3, '2024-02-18 15:45:00', 'cuota', 6000.00, 180.00, 5820.00, 'ARS', 'mercadopago', 'member', 21, 'confirmed', 'Cuota mensual febrero - Socio #21', 'mercadopago'),
(3, '2024-02-25 10:20:00', 'cuota', 6000.00, 0.00, 6000.00, 'ARS', 'transferencia', 'member', 23, 'confirmed', 'Cuota mensual febrero - Socio #23', 'manual'),
(3, '2024-03-08 11:00:00', 'cuota', 6000.00, 0.00, 6000.00, 'ARS', 'transferencia', 'member', 24, 'confirmed', 'Cuota mensual marzo - Socio #24', 'manual'),
(3, '2024-03-15 16:30:00', 'cuota', 6000.00, 180.00, 5820.00, 'ARS', 'mercadopago', 'member', 25, 'confirmed', 'Cuota mensual marzo - Socio #25', 'mercadopago'),
(3, '2024-03-22 09:00:00', 'cuota', 6000.00, 0.00, 6000.00, 'ARS', 'efectivo', 'member', 26, 'confirmed', 'Cuota mensual marzo - Socio #26', 'manual');

-- Aportes
INSERT INTO movements (team_id, fecha, tipo, monto_bruto, monto_fee, monto_neto, moneda, metodo_pago, origen_tipo, origen_id, estado, description, payment_provider) VALUES
(3, '2024-01-22 13:30:00', 'aporte', 15000.00, 0.00, 15000.00, 'ARS', 'transferencia', 'member', 27, 'confirmed', 'Aporte para mejoras en vestuarios', 'manual'),
(3, '2024-02-15 10:00:00', 'aporte', 20000.00, 0.00, 20000.00, 'ARS', 'transferencia', 'member', 28, 'confirmed', 'Aporte para iluminación cancha', 'manual'),
(3, '2024-03-10 14:00:00', 'aporte', 10000.00, 0.00, 10000.00, 'ARS', 'transferencia', 'member', 29, 'confirmed', 'Aporte para sistema de sonido', 'manual'),
(3, '2024-03-28 11:00:00', 'aporte', 8000.00, 0.00, 8000.00, 'ARS', 'efectivo', 'member', 30, 'confirmed', 'Aporte para mantenimiento', 'manual');

-- Colectas
INSERT INTO movements (team_id, fecha, tipo, monto_bruto, monto_fee, monto_neto, moneda, metodo_pago, origen_tipo, origen_id, estado, description, payment_provider) VALUES
(3, '2024-02-08 10:00:00', 'colecta', 30000.00, 900.00, 29100.00, 'ARS', 'mercadopago', 'collecta', 3, 'confirmed', 'Colecta para construcción de tribuna', 'mercadopago'),
(3, '2024-02-14 11:00:00', 'colecta', 5000.00, 150.00, 4850.00, 'ARS', 'mercadopago', 'collecta', 3, 'confirmed', 'Donación - Colecta tribuna', 'mercadopago'),
(3, '2024-02-20 15:00:00', 'colecta', 10000.00, 300.00, 9700.00, 'ARS', 'mercadopago', 'collecta', 3, 'confirmed', 'Donación empresa - Colecta tribuna', 'mercadopago'),
(3, '2024-02-26 09:30:00', 'colecta', 7000.00, 210.00, 6790.00, 'ARS', 'mercadopago', 'collecta', 3, 'confirmed', 'Donación familiar - Colecta tribuna', 'mercadopago'),
(3, '2024-03-05 12:00:00', 'colecta', 4000.00, 120.00, 3880.00, 'ARS', 'mercadopago', 'collecta', 3, 'confirmed', 'Donación vecino - Colecta tribuna', 'mercadopago');

-- Sponsors
INSERT INTO movements (team_id, fecha, tipo, monto_bruto, monto_fee, monto_neto, moneda, metodo_pago, origen_tipo, origen_id, estado, description, payment_provider) VALUES
(3, '2024-01-01 08:00:00', 'sponsor', 60000.00, 0.00, 60000.00, 'ARS', 'transferencia', 'sponsor', 4, 'confirmed', 'Sponsor principal - Enero', 'manual'),
(3, '2024-02-01 08:00:00', 'sponsor', 60000.00, 0.00, 60000.00, 'ARS', 'transferencia', 'sponsor', 4, 'confirmed', 'Sponsor principal - Febrero', 'manual'),
(3, '2024-03-01 08:00:00', 'sponsor', 60000.00, 0.00, 60000.00, 'ARS', 'transferencia', 'sponsor', 4, 'confirmed', 'Sponsor principal - Marzo', 'manual'),
(3, '2024-01-15 10:00:00', 'sponsor', 25000.00, 0.00, 25000.00, 'ARS', 'transferencia', 'sponsor', 5, 'confirmed', 'Sponsor secundario - Enero', 'manual'),
(3, '2024-02-15 10:00:00', 'sponsor', 25000.00, 0.00, 25000.00, 'ARS', 'transferencia', 'sponsor', 5, 'confirmed', 'Sponsor secundario - Febrero', 'manual');

-- Cashout
INSERT INTO movements (team_id, fecha, tipo, monto_bruto, monto_fee, monto_neto, moneda, metodo_pago, origen_tipo, origen_id, estado, description, payment_provider) VALUES
(3, '2024-01-30 17:00:00', 'cashout', 20000.00, 0.00, 20000.00, 'ARS', 'transferencia', 'manual', NULL, 'confirmed', 'Pago a proveedor - Material construcción', 'manual'),
(3, '2024-02-28 16:00:00', 'cashout', 15000.00, 0.00, 15000.00, 'ARS', 'transferencia', 'manual', NULL, 'confirmed', 'Pago albañil - Construcción tribuna', 'manual'),
(3, '2024-03-25 14:00:00', 'cashout', 18000.00, 0.00, 18000.00, 'ARS', 'transferencia', 'manual', NULL, 'confirmed', 'Pago electricista - Instalación iluminación', 'manual'),
(3, '2024-03-30 12:00:00', 'cashout', 10000.00, 0.00, 10000.00, 'ARS', 'efectivo', 'manual', NULL, 'confirmed', 'Pago arbitraje - Partidos marzo', 'manual');

-- ============================================
-- RESUMEN
-- ============================================
-- Equipo 1: 18 movimientos
-- Equipo 2: 17 movimientos  
-- Equipo 3: 25 movimientos
-- Total: 60 movimientos

