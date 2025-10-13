require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'votre_super_secret_jwt_a_remplacer_en_production';

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// Test de connexion
pool.on('connect', () => {
  console.log('✅ Connecté à PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL:', err);
});

// ROLES
const ROLES = {
  ACCUEIL: 'Accueil',
  GESTION: 'Gestion',
  CAISSE: 'Caisse',
  CHEF_DIVISION: 'Chef de Division',
};

// DOSSIER STATUSES
const DossierStatus = {
  EN_ATTENTE_DE_CALCUL: 'En attente de calcul',
  EN_ATTENTE_DE_PAIEMENT: 'En attente de paiement',
  PAYE: 'Payé',
  ANNULE: 'Annulé',
};

// Middleware
const _ = require('lodash');

const snakeCaseKeys = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => snakeCaseKeys(v));
  }
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      result[_.snakeCase(key)] = snakeCaseKeys(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

const snakeCaseMiddleware = (req, res, next) => {
  req.body = snakeCaseKeys(req.body);
  next();
};

app.use(cors());
app.use(express.json());
app.use(snakeCaseMiddleware);

// --- Initialisation de la base de données ---
const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    // Vérifier si des utilisateurs existent
    const result = await client.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(result.rows[0].count);

    if (userCount === 0) {
      console.log('📝 Création des utilisateurs par défaut...');
      const hashedPassword = await bcrypt.hash('password123', 10);

      const users = [
        { id: 'user_accueil', username: 'accueil_user', password: hashedPassword, role: ROLES.ACCUEIL },
        { id: 'user_gestion', username: 'gestion_user', password: hashedPassword, role: ROLES.GESTION },
        { id: 'user_caisse', username: 'caisse_user', password: hashedPassword, role: ROLES.CAISSE },
        { id: 'user_chef_division', username: 'chef_division_user', password: hashedPassword, role: ROLES.CHEF_DIVISION },
      ];

      for (const user of users) {
        await client.query(
          'INSERT INTO users (id, username, password, role) VALUES ($1, $2, $3, $4)',
          [user.id, user.username, user.password, user.role]
        );
      }

      console.log('✅ Utilisateurs par défaut créés');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    client.release();
  }
};

// --- Auth Middleware ---
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès non autorisé: Token manquant ou mal formé' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Accès non autorisé: Token invalide' });
  }
};

// --- Role-Based Access Control Middleware ---
const roleAuth = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès interdit: Rôle insuffisant' });
    }
    next();
  };
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Veuillez fournir un nom d\'utilisateur, un mot de passe et un rôle.' });
  }
  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Ce nom d\'utilisateur existe déjà.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user_${Date.now()}`;
    await pool.query(
      'INSERT INTO users (id, username, password, role) VALUES ($1, $2, $3, $4)',
      [userId, username, hashedPassword, role]
    );
    res.status(201).json({ message: 'Utilisateur créé avec succès.', userId });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de l\'enregistrement.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`[LOGIN ATTEMPT] User: '${username}'`);
  if (!username || !password) {
    return res.status(400).json({ message: 'Veuillez fournir un nom d\'utilisateur et un mot de passe.' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) {
      console.log(`[LOGIN FAILED] User not found: '${username}'`);
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`[LOGIN FAILED] Invalid password for user: '${username}'`);
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    console.log(`[LOGIN SUCCESS] User logged in: '${username}'`);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la connexion.' });
  }
});

// --- Users Routes ---
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, role, created_at FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la récupération des utilisateurs.' });
  }
});

// --- Audit Logs Routes ---
app.get('/api/auditlogs', authMiddleware, roleAuth([ROLES.CHEF_DIVISION]), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la récupération des logs d\'audit.' });
  }
});

// Fonction helper pour ajouter un audit log
const addAuditLog = async (userId, role, action) => {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, role, action) VALUES ($1, $2, $3)',
      [userId, role, action]
    );
  } catch (error) {
    console.error('Erreur lors de l\'ajout du log d\'audit:', error);
  }
};

// --- Dossiers Routes ---
app.get('/api/dossiers', authMiddleware, async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const lim = parseInt(limit) || 1000;
    const off = parseInt(offset) || 0;

    const result = await pool.query(
      'SELECT * FROM dossiers ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [lim, off]
    );
    const countResult = await pool.query('SELECT COUNT(*) FROM dossiers');
    const total = parseInt(countResult.rows[0].count);

    res.json({ items: result.rows, total });
  } catch (error) {
    console.error('Erreur lors de la récupération des dossiers:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la récupération des dossiers.' });
  }
});

app.post('/api/dossiers', authMiddleware, roleAuth([ROLES.ACCUEIL, ROLES.GESTION]), async (req, res) => {
  const { taxpayer_name, tax_period, status, tax_details } = req.body;
  const { userId, role } = req.user;

  if (!taxpayer_name || !tax_period || !status || !tax_details) {
    return res.status(400).json({ message: 'Informations du dossier incomplètes.' });
  }

  try {
    const dossierId = `dos_${Date.now()}`;
    const totalAmount = tax_details.reduce((sum, detail) => sum + (detail.amount || 0), 0);

    const result = await pool.query(
      `INSERT INTO dossiers (id, taxpayer_name, tax_period, status, tax_details, total_amount, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [dossierId, taxpayer_name, tax_period, status, JSON.stringify(tax_details), totalAmount, userId]
    );

    await addAuditLog(userId, role, `Dossier ${dossierId} created`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création du dossier:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la création du dossier.' });
  }
});

app.put('/api/dossiers/:id', authMiddleware, roleAuth([ROLES.GESTION, ROLES.CAISSE, ROLES.CHEF_DIVISION]), async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const { userId, role } = req.user;

  try {
    const dossierResult = await pool.query('SELECT * FROM dossiers WHERE id = $1', [id]);
    if (dossierResult.rows.length === 0) {
      return res.status(404).json({ message: 'Dossier non trouvé.' });
    }

    const originalDossier = dossierResult.rows[0];
    let managedBy = originalDossier.managed_by;

    // Update managedBy when status changes
    if (originalDossier.status === DossierStatus.EN_ATTENTE_DE_CALCUL &&
        updateData.status === DossierStatus.EN_ATTENTE_DE_PAIEMENT) {
      managedBy = userId;
    }

    // Recalculate totalAmount if taxDetails are updated
    let totalAmount = originalDossier.total_amount;
    if (updateData.taxDetails) {
      totalAmount = updateData.taxDetails.reduce((sum, detail) => sum + (detail.amount || 0), 0);
    }

    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;

    if (updateData.taxpayerName !== undefined) {
      fieldsToUpdate.push(`taxpayer_name = $${paramIndex++}`);
      values.push(updateData.taxpayerName);
    }
    if (updateData.taxPeriod !== undefined) {
      fieldsToUpdate.push(`tax_period = $${paramIndex++}`);
      values.push(updateData.taxPeriod);
    }
    if (updateData.status !== undefined) {
      fieldsToUpdate.push(`status = $${paramIndex++}`);
      values.push(updateData.status);
    }
    if (updateData.taxDetails !== undefined) {
      fieldsToUpdate.push(`tax_details = $${paramIndex++}`);
      values.push(JSON.stringify(updateData.taxDetails));
      fieldsToUpdate.push(`total_amount = $${paramIndex++}`);
      values.push(totalAmount);
    }
    if (managedBy !== originalDossier.managed_by) {
      fieldsToUpdate.push(`managed_by = $${paramIndex++}`);
      values.push(managedBy);
    }
    if (updateData.paymentMethod !== undefined) {
      fieldsToUpdate.push(`payment_method = $${paramIndex++}`);
      values.push(updateData.paymentMethod);
    }
    if (updateData.paymentDetails !== undefined) {
      fieldsToUpdate.push(`payment_details = $${paramIndex++}`);
      values.push(JSON.stringify(updateData.paymentDetails));
    }

    values.push(id);
    const query = `UPDATE dossiers SET ${fieldsToUpdate.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);

    await addAuditLog(userId, role, `Dossier ${id} updated`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du dossier:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la mise à jour du dossier.' });
  }
});

app.delete('/api/dossiers/:id', authMiddleware, roleAuth([ROLES.CHEF_DIVISION]), async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;

  try {
    const result = await pool.query('DELETE FROM dossiers WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Dossier non trouvé.' });
    }
    await addAuditLog(userId, role, `Dossier ${id} deleted`);
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression du dossier:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la suppression du dossier.' });
  }
});

// --- Resource Orders Routes ---
app.post('/api/resource-orders', authMiddleware, roleAuth([ROLES.ACCUEIL]), async (req, res) => {
  const { resource_type, quantity, unit, target_division, description, notes } = req.body;
  const { userId, role } = req.user;

  if (!resource_type || !quantity || !unit || !target_division) {
    return res.status(400).json({ message: 'Informations de ressource incomplètes.' });
  }

  try {
    const orderId = `res_${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO resource_orders (id, resource_type, quantity, unit, description, requested_by, 
       requested_by_role, target_division, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [orderId, resource_type, quantity, unit, description || '', userId, role, target_division, notes || '']
    );

    await addAuditLog(userId, role, `Resource order ${orderId} created for ${target_division}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la création de la commande de ressources.' });
  }
});

app.get('/api/resource-orders', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { limit, offset } = req.query;
    const lim = parseInt(limit) || 1000;
    const off = parseInt(offset) || 0;

    let query, countQuery, params;
    if (role === ROLES.ACCUEIL) {
      query = 'SELECT * FROM resource_orders WHERE requested_by = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      countQuery = 'SELECT COUNT(*) FROM resource_orders WHERE requested_by = $1';
      params = [userId, lim, off];
    } else {
      query = 'SELECT * FROM resource_orders WHERE target_division = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      countQuery = 'SELECT COUNT(*) FROM resource_orders WHERE target_division = $1';
      params = [role, lim, off];
    }

    const result = await pool.query(query, params);
    const countResult = await pool.query(countQuery, [role === ROLES.ACCUEIL ? userId : role]);
    const total = parseInt(countResult.rows[0].count);

    res.json({ items: result.rows, total });
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la récupération des commandes de ressources.' });
  }
});

app.put('/api/resource-orders/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  const updateData = req.body;

  try {
    const orderResult = await pool.query('SELECT * FROM resource_orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Commande de ressources non trouvée.' });
    }

    const order = orderResult.rows[0];

    // Check permissions
    if (role === ROLES.ACCUEIL && order.requested_by !== userId) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres commandes.' });
    } else if (role !== ROLES.ACCUEIL && order.target_division !== role) {
      return res.status(403).json({ message: 'Vous ne pouvez confirmer que les commandes adressées à votre division.' });
    }

    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fieldsToUpdate.push(`${key} = $${paramIndex++}`);
        values.push(updateData[key]);
      }
    });

    values.push(id);
    const query = `UPDATE resource_orders SET ${fieldsToUpdate.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);

    const action = updateData.status === 'Livré' ? 'delivered' :
                   updateData.status === 'Reçu' ? 'confirmed receipt of' : 'updated';
    await addAuditLog(userId, role, `Resource order ${id} ${action}`);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la commande:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la mise à jour de la commande de ressources.' });
  }
});

// --- Personnel Routes ---
app.get('/api/personnel', authMiddleware, roleAuth([ROLES.CHEF_DIVISION]), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM personnel ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération du personnel:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la récupération du personnel.' });
  }
});

app.post('/api/personnel', authMiddleware, roleAuth([ROLES.CHEF_DIVISION]), async (req, res) => {
  const { name, division, affectation } = req.body;
  const { userId, role } = req.user;

  if (!name || !division || !affectation) {
    return res.status(400).json({ message: 'Informations du personnel incomplètes.' });
  }

  try {
    const personnelId = `pers_${Date.now()}`;
    const history = [{
      division,
      affectation,
      startDate: new Date().toISOString(),
      endDate: null
    }];

    const result = await pool.query(
      `INSERT INTO personnel (id, name, division, affectation, history)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [personnelId, name, division, affectation, JSON.stringify(history)]
    );

    await addAuditLog(userId, role, `Personnel ${personnelId} created`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création du personnel:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la création du personnel.' });
  }
});

app.put('/api/personnel/:id', authMiddleware, roleAuth([ROLES.CHEF_DIVISION]), async (req, res) => {
  const { id } = req.params;
  const { name, division, affectation, history } = req.body;
  const { userId, role } = req.user;

  if (!name || !division || !affectation) {
    return res.status(400).json({ message: 'Informations du personnel incomplètes.' });
  }

  try {
    const personnelResult = await pool.query('SELECT * FROM personnel WHERE id = $1', [id]);
    if (personnelResult.rows.length === 0) {
      return res.status(404).json({ message: 'Personnel non trouvé.' });
    }

    const currentPersonnel = personnelResult.rows[0];
    let updatedHistory = history ? history : JSON.parse(currentPersonnel.history || '[]');

    // Si pas d'historique fourni, gérer automatiquement
    if (!history) {
      const currentHistory = JSON.parse(currentPersonnel.history || '[]');
      const latestHistory = currentHistory.length > 0 ? currentHistory[currentHistory.length - 1] : null;

      const isNewAssignment = !latestHistory ||
        latestHistory.division !== division ||
        latestHistory.affectation !== affectation;

      if (isNewAssignment) {
        updatedHistory = [...currentHistory];
        if (latestHistory && !latestHistory.endDate) {
          updatedHistory[updatedHistory.length - 1] = { ...latestHistory, endDate: new Date().toISOString() };
        }
        updatedHistory.push({
          division,
          affectation,
          startDate: new Date().toISOString(),
          endDate: null
        });
      }
    }

    const result = await pool.query(
      `UPDATE personnel SET name = $1, division = $2, affectation = $3, history = $4
       WHERE id = $5 RETURNING *`,
      [name, division, affectation, JSON.stringify(updatedHistory), id]
    );

    await addAuditLog(userId, role, `Personnel ${id} updated`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du personnel:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la mise à jour du personnel.' });
  }
});

app.delete('/api/personnel/:id', authMiddleware, roleAuth([ROLES.CHEF_DIVISION]), async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;

  try {
    const result = await pool.query('DELETE FROM personnel WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Personnel non trouvé.' });
    }
    await addAuditLog(userId, role, `Personnel ${id} deleted`);
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression du personnel:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la suppression du personnel.' });
  }
});

// --- Server Startup ---
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(port, '0.0.0.0', () => {
      console.log(`✅ Le serveur backend est en écoute sur http://0.0.0.0:${port}`);
      console.log(`🔒 Mode: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();