const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3001;
const dbPath = path.join(__dirname, 'db.json');
const JWT_SECRET = 'votre_super_secret_jwt_a_remplacer_en_production';

// ROLES
const ROLES = {
  ACCUEIL: 'Accueil',
  GESTION: 'Gestion',
  CAISSE: 'Caisse',
  CHEF_DIVISION: 'Chef de Division',
};

// DOSSIER STATUSES (Mirroring frontend types.ts)
const DossierStatus = {
  EN_ATTENTE_DE_CALCUL: 'En attente de calcul',
  EN_ATTENTE_DE_PAIEMENT: 'En attente de paiement',
  PAYE: 'Payé',
  ANNULE: 'Annulé',
};

// --- Database Helper Functions ---
const readDB = async () => {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // Return null if DB doesn't exist
    }
    console.error("Error reading database:", error);
    throw error;
  }
};

const writeDB = async (data) => {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing to database:", error);
    throw error;
  }
};

// --- Seeding Function ---
const initializeDatabase = async () => {
  let db = await readDB();

  if (db === null || db.users.length === 0) { // Check if db is null or empty
    console.log("Database not found or empty. Creating and seeding default users.");
    
    const hashedPassword = await bcrypt.hash('password123', 10);

    db = {
      users: [
        { id: "user_accueil", username: "accueil_user", password: hashedPassword, role: ROLES.ACCUEIL },
        { id: "user_gestion", username: "gestion_user", password: hashedPassword, role: ROLES.GESTION },
        { id: "user_caisse", username: "caisse_user", password: hashedPassword, role: ROLES.CAISSE },
        { id: "user_chef_division", username: "chef_division_user", password: hashedPassword, role: ROLES.CHEF_DIVISION },
      ],
      dossiers: [],
      auditLogs: [],
      messages: []
    };
    
    await writeDB(db);
    console.log("Database seeded successfully with default users.");
  }
  // Ensure new collections exist for existing DBs
  if (db && !Array.isArray(db.messages)) {
    db.messages = [];
    await writeDB(db);
  }
};


// Middleware
app.use(cors());
app.use(express.json());


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
    const db = await readDB();
    if (db.users.find(u => u.username === username)) {
      return res.status(409).json({ message: 'Ce nom d\'utilisateur existe déjà.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: `user_${Date.now()}`, username, password: hashedPassword, role };
    db.users.push(newUser);
    await writeDB(db);
    res.status(201).json({ message: 'Utilisateur créé avec succès.', userId: newUser.id });
  } catch (error) {
    console.error("Server error during registration:", error);
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
    const db = await readDB();
    const user = db.users.find(u => u.username === username);
    if (!user) {
      console.log(`[LOGIN FAILED] User not found: '${username}'`);
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`[LOGIN FAILED] Invalid password for user: '${username}'`);
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }
    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    console.log(`[LOGIN SUCCESS] User logged in: '${username}'`);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error("Server error during login:", error);
    res.status(500).json({ message: 'Erreur du serveur lors de la connexion.' });
  }
});

// --- New Protected Routes ---
app.get('/api/users', authMiddleware, async (req, res) => {
    try {
        const db = await readDB();
        // Return users without their passwords
        const users = db.users.map(({ password, ...user }) => user);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erreur du serveur lors de la récupération des utilisateurs.' });
    }
});

app.get('/api/auditlogs', authMiddleware, roleAuth([ROLES.CHEF_DIVISION]), async (req, res) => {
    try {
        const db = await readDB(); 
        res.json(db.auditLogs);
    } catch (error) {
        res.status(500).json({ message: 'Erreur du serveur lors de la récupération des logs d\'audit.' });
    }
});

// --- Dossiers Routes (Protected with RBAC) ---
app.get('/api/dossiers', authMiddleware, async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.dossiers);
    }  catch (error) {
        res.status(500).json({ message: 'Erreur du serveur lors de la récupération des dossiers.' });
    }
});

app.post('/api/dossiers', authMiddleware, roleAuth([ROLES.ACCUEIL, ROLES.GESTION]), async (req, res) => {
    const { taxpayerName, taxPeriod, status, taxDetails } = req.body;
    const { userId, role } = req.user;
    if (!taxpayerName || !taxPeriod || !status || !taxDetails) {
        return res.status(400).json({ message: 'Le nom du contribuable, la période fiscale, le statut et les détails fiscaux du dossier sont requis.' });
    }
    try {
        const db = await readDB();
        const newDossier = {
            id: `dos_${Date.now()}`,
            taxpayerName,
            taxPeriod,
            status,
            taxDetails: taxDetails || [],
            totalAmount: taxDetails.reduce((sum, detail) => sum + (detail.amount || 0), 0),
            createdBy: userId,
            createdAt: new Date().toISOString()
        };
        db.dossiers.push(newDossier);
        db.auditLogs.push({ user: userId, role, action: `Dossier ${newDossier.id} created`, timestamp: new Date().toISOString() });
        await writeDB(db);
        res.status(201).json(newDossier);
    } catch (error) {
        console.error("Error creating dossier:", error);
        res.status(500).json({ message: 'Erreur du serveur lors de la création du dossier.' });
    }
});

app.put('/api/dossiers/:id', authMiddleware, roleAuth([ROLES.GESTION, ROLES.CAISSE, ROLES.CHEF_DIVISION]), async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const { userId, role } = req.user;
    try {
        const db = await readDB();
        const dossierIndex = db.dossiers.findIndex(d => d.id === id);
        if (dossierIndex === -1) {
            return res.status(404).json({ message: 'Dossier non trouvé.' });
        }
        const originalDossier = { ...db.dossiers[dossierIndex] };
        
        // Update managedBy when status changes to EN_ATTENTE_DE_PAIEMENT
        if (originalDossier.status === DossierStatus.EN_ATTENTE_DE_CALCUL && updateData.status === DossierStatus.EN_ATTENTE_DE_PAIEMENT) {
            updateData.managedBy = userId;
        }

        // Recalculate totalAmount if taxDetails are updated
        if (updateData.taxDetails) {
            updateData.totalAmount = updateData.taxDetails.reduce((sum, detail) => sum + (detail.amount || 0), 0);
        }

        db.dossiers[dossierIndex] = { ...originalDossier, ...updateData };
        db.auditLogs.push({ user: userId, role, action: `Dossier ${id} updated`, timestamp: new Date().toISOString() });
        await writeDB(db);
        res.json(db.dossiers[dossierIndex]);
    } catch (error) {
        console.error("Error updating dossier:", error);
        res.status(500).json({ message: 'Erreur du serveur lors de la mise à jour du dossier.' });
    }
});

app.delete('/api/dossiers/:id', authMiddleware, roleAuth([ROLES.CHEF_DIVISION]), async (req, res) => {
    const { id } = req.params;
    const { userId, role } = req.user;
    try {
        const db = await readDB();
        const initialLength = db.dossiers.length;
        db.dossiers = db.dossiers.filter(d => d.id !== id);
        if (db.dossiers.length === initialLength) {
            return res.status(404).json({ message: 'Dossier non trouvé.' });
        }
        db.auditLogs.push({ user: userId, role, action: `Dossier ${id} deleted`, timestamp: new Date().toISOString() });
        await writeDB(db);
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting dossier:", error);
        res.status(500).json({ message: 'Erreur du serveur lors de la suppression du dossier.' });
    }
});

// --- Messages Routes ---
// Create a message (Accueil can notify divisions). Allow any authenticated user to send, but typical use is Accueil.
app.post('/api/messages', authMiddleware, async (req, res) => {
  const { content } = req.body;
  const { userId, role } = req.user;
  if (!content) {
    return res.status(400).json({ message: 'Contenu requis.' });
  }
  try {
    const db = await readDB();
    const targets = [ROLES.GESTION, ROLES.CHEF_DIVISION, ROLES.CAISSE];
    const now = Date.now();
    const createdAt = new Date().toISOString();
    const createdMessages = targets.map((toRole, idx) => ({
      id: `msg_${now}_${idx}`,
      fromUserId: userId,
      fromRole: role,
      toRole,
      content,
      createdAt,
      confirmed: false,
      confirmedBy: null,
      confirmedAt: null
    }));
    db.messages.push(...createdMessages);
    db.auditLogs.push({ user: userId, role, action: `Broadcast message created to divisions (${targets.join(', ')})`, timestamp: createdAt });
    await writeDB(db);
    res.status(201).json(createdMessages);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la création du message.' });
  }
});

// Get messages. If Accueil (or any non-target role), return messages sent by that user. If role is Gestion/Chef, return messages addressed to that role.
app.get('/api/messages', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const db = await readDB();
    let messages = [];
    if (role === ROLES.GESTION || role === ROLES.CHEF_DIVISION || role === ROLES.CAISSE) {
      messages = db.messages.filter(m => m.toRole === role);
    } else {
      messages = db.messages.filter(m => m.fromUserId === userId);
    }
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la récupération des messages.' });
  }
});

// Confirm a message (only target division roles)
app.put('/api/messages/:id/confirm', authMiddleware, roleAuth([ROLES.GESTION, ROLES.CHEF_DIVISION, ROLES.CAISSE]), async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  try {
    const db = await readDB();
    const index = db.messages.findIndex(m => m.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Message non trouvé.' });
    }
    const msg = db.messages[index];
    if (msg.toRole !== role) {
      return res.status(403).json({ message: 'Vous ne pouvez confirmer que les messages adressés à votre rôle.' });
    }
    db.messages[index] = { ...msg, confirmed: true, confirmedBy: userId, confirmedAt: new Date().toISOString() };
    db.auditLogs.push({ user: userId, role, action: `Message ${id} confirmed`, timestamp: new Date().toISOString() });
    await writeDB(db);
    res.json(db.messages[index]);
  } catch (error) {
    console.error('Error confirming message:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la confirmation du message.' });
  }
});

// --- Server ---
const startServer = async () => {
  await initializeDatabase();
  app.listen(port, '0.0.0.0', () => {
    console.log(`Le serveur backend est en écoute sur http://0.0.0.0:${port}`);
  });
};

startServer();
