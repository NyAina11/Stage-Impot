-- Script d'initialisation de la base de données PostgreSQL
-- ASCF - Application de Suivi des Contributions Fiscales

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des dossiers fiscaux
CREATE TABLE IF NOT EXISTS dossiers (
    id VARCHAR(100) PRIMARY KEY,
    taxpayer_name VARCHAR(255) NOT NULL,
    tax_period VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    tax_details JSONB DEFAULT '[]'::jsonb,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    created_by VARCHAR(100) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    managed_by VARCHAR(100) REFERENCES users(id),
    payment_method VARCHAR(50),
    payment_details JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des logs d'audit
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES users(id),
    role VARCHAR(50) NOT NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des messages (legacy - peut être conservée pour historique)
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(100) PRIMARY KEY,
    from_user_id VARCHAR(100) REFERENCES users(id),
    from_role VARCHAR(50) NOT NULL,
    to_role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed BOOLEAN DEFAULT FALSE,
    confirmed_by VARCHAR(100) REFERENCES users(id),
    confirmed_at TIMESTAMP
);

-- Table des commandes de ressources
CREATE TABLE IF NOT EXISTS resource_orders (
    id VARCHAR(100) PRIMARY KEY,
    resource_type VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    requested_by VARCHAR(100) REFERENCES users(id),
    requested_by_role VARCHAR(50) NOT NULL,
    target_division VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'En attente',
    delivered_by VARCHAR(100) REFERENCES users(id),
    delivered_at TIMESTAMP,
    received_by VARCHAR(100) REFERENCES users(id),
    received_at TIMESTAMP,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table du personnel
CREATE TABLE IF NOT EXISTS personnel (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    division VARCHAR(100) NOT NULL,
    affectation VARCHAR(255) NOT NULL,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX idx_dossiers_status ON dossiers(status);
CREATE INDEX idx_dossiers_created_by ON dossiers(created_by);
CREATE INDEX idx_dossiers_created_at ON dossiers(created_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_resource_orders_target ON resource_orders(target_division);
CREATE INDEX idx_resource_orders_status ON resource_orders(status);
CREATE INDEX idx_resource_orders_requested_by ON resource_orders(requested_by);
CREATE INDEX idx_personnel_division ON personnel(division);

-- Fonction de mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dossiers_updated_at BEFORE UPDATE ON dossiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_orders_updated_at BEFORE UPDATE ON resource_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personnel_updated_at BEFORE UPDATE ON personnel
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion des utilisateurs par défaut (les mots de passe seront hashés par l'application)
-- Note: Ces insertions seront gérées par l'application au démarrage