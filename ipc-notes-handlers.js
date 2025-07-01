// IPC Handlers for Secure Notes
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// These functions will be specific to this module or could be moved to a shared crypto utility if complex enough
// For now, keeping them here for encapsulation of secure notes logic.
const KEY_ITERATIONS = 100000;
const KEY_LENGTH = 32;
const ALGORITHM = 'aes-256-gcm';
let SECURE_NOTES_DIR; // Will be set by register function
let VAULT_FILE_PATH;
let SALT_FILE_PATH;


// Generate or retrieve salt
function getSalt() {
  try {
    if (fs.existsSync(SALT_FILE_PATH)) {
      return fs.readFileSync(SALT_FILE_PATH);
    } else {
      const salt = crypto.randomBytes(16);
      fs.writeFileSync(SALT_FILE_PATH, salt);
      return salt;
    }
  } catch (error) {
    console.error('Error handling salt:', error);
    throw error;
  }
}

// Derive encryption key from master password
function deriveKey(masterPassword) {
  const salt = getSalt();
  return crypto.pbkdf2Sync(masterPassword, salt, KEY_ITERATIONS, KEY_LENGTH, 'sha256');
}

// Encrypt data using the derived key
function encrypt(data, masterPassword) {
  const key = deriveKey(masterPassword);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted
  };
}

// Decrypt data using the derived key
function decrypt(encryptedData, masterPassword) {
  try {
    if (!encryptedData || typeof encryptedData !== 'object' || !encryptedData.iv || !encryptedData.authTag || !encryptedData.data) {
      console.error('Invalid encrypted data structure or missing fields');
      return null;
    }
    const key = deriveKey(masterPassword);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    if (iv.length !== 16 || authTag.length !== 16) {
        console.error('Invalid IV or authTag length');
        return null;
    }
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message); // Log only message for security
    return null;
  }
}

// Create a hash of the master password for validation (Not strictly needed if decrypt works, but good for quick check)
function hashMasterPassword(password) {
  const salt = getSalt(); // Use the same salt for consistency if comparing hashes
  return crypto.pbkdf2Sync(password, salt, KEY_ITERATIONS, 64, 'sha512').toString('hex');
}

// Check if vault exists
function vaultExists() {
  return fs.existsSync(VAULT_FILE_PATH);
}

// Create a new vault with the master password
function setupVault(masterPassword) {
  try {
    const hash = hashMasterPassword(masterPassword); // Store hash for quick validation if needed
    const encryptedData = encrypt(JSON.stringify({
      passwordHash: hash, // Example of storing a validation hash
      entries: []
    }), masterPassword);
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(encryptedData));
    return true;
  } catch (error) {
    console.error('Error setting up vault:', error);
    return false;
  }
}

// Get all entries
function getEntries(masterPassword) {
  try {
    if (!vaultExists()) return null;
    const vaultContent = fs.readFileSync(VAULT_FILE_PATH, 'utf8');
    if (!vaultContent.trim()) return null;
    let encryptedData;
    try { encryptedData = JSON.parse(vaultContent); }
    catch (e) { console.error('Failed to parse vault file:', e); return null; }

    const decrypted = decrypt(encryptedData, masterPassword);
    if (!decrypted) return null;
    try {
      const data = JSON.parse(decrypted);
      return data.entries;
    } catch (e) { console.error('Failed to parse decrypted vault data:', e); return null; }
  } catch (error) {
    console.error('Error getting entries:', error);
    return null;
  }
}

// Save an entry to the vault
function saveEntry(entry, masterPassword) {
  try {
    if (!vaultExists()) return false;
    const vaultContent = fs.readFileSync(VAULT_FILE_PATH, 'utf8');
    if (!vaultContent.trim()) { console.error('Vault empty'); return false;}
    let encryptedData;
    try { encryptedData = JSON.parse(vaultContent); }
    catch (e) { console.error('Failed to parse vault file for save:', e); return false; }

    const decrypted = decrypt(encryptedData, masterPassword);
    if (!decrypted) return false;

    let data;
    try { data = JSON.parse(decrypted); }
    catch (e) { console.error('Failed to parse decrypted data for save:', e); return false; }

    const index = data.entries.findIndex(e => e.id === entry.id);
    if (index !== -1) data.entries[index] = entry;
    else data.entries.push(entry);

    const updatedEncrypted = encrypt(JSON.stringify(data), masterPassword);
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(updatedEncrypted));
    return true;
  } catch (error) {
    console.error('Error saving entry:', error);
    return false;
  }
}

// Delete an entry from the vault
function deleteEntry(entryId, masterPassword) {
  try {
    if (!vaultExists()) return false;
    const encryptedData = JSON.parse(fs.readFileSync(VAULT_FILE_PATH, 'utf8'));
    const decrypted = decrypt(encryptedData, masterPassword);
    if (!decrypted) return false;
    const data = JSON.parse(decrypted);
    data.entries = data.entries.filter(entry => entry.id !== entryId);
    const updatedEncrypted = encrypt(JSON.stringify(data), masterPassword);
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(updatedEncrypted));
    return true;
  } catch (error) {
    console.error('Error deleting entry:', error);
    return false;
  }
}

// Validate the master password
function validateMasterPassword(password) {
  try {
    if (!vaultExists()) {
      return { valid: false, newUser: true };
    }
    const vaultContent = fs.readFileSync(VAULT_FILE_PATH, 'utf8');
    if (!vaultContent.trim()) {
        // If vault is empty or uninitialized properly, treat as new user or corrupted.
        // Forcing re-setup might be safer.
        try { fs.unlinkSync(VAULT_FILE_PATH); } catch(e){} // Attempt to clean up
        return { valid: false, newUser: true };
    }
    let encryptedData;
    try { encryptedData = JSON.parse(vaultContent); }
    catch (e) {
        console.error('Corrupted vault file (not JSON):', e);
        try { fs.unlinkSync(VAULT_FILE_PATH); } catch(eUnlink){}
        return { valid: false, newUser: true };
    }

    const decrypted = decrypt(encryptedData, password);
    if (!decrypted) {
      return { valid: false, newUser: false }; // Password incorrect or data corrupted
    }
    // Optionally, check the passwordHash here if you stored one during setupVault
    // const data = JSON.parse(decrypted);
    // const expectedHash = hashMasterPassword(password);
    // if(data.passwordHash !== expectedHash) return { valid: false, newUser: false };

    return { valid: true, newUser: false };
  } catch (error) {
    console.error('Error validating password:', error);
    return { valid: false, newUser: false };
  }
}


function registerSecureNotesHandlers(ipcMain, appElectron) {
  SECURE_NOTES_DIR = path.join(appElectron.getPath('userData'), 'secureNotes');
  VAULT_FILE_PATH = path.join(SECURE_NOTES_DIR, 'vault.enc');
  SALT_FILE_PATH = path.join(SECURE_NOTES_DIR, 'salt');

  if (!fs.existsSync(SECURE_NOTES_DIR)) {
    fs.mkdirSync(SECURE_NOTES_DIR, { recursive: true });
  }

  ipcMain.handle('secure-notes:validate-master-password', async (event, password) => {
    try {
      const result = validateMasterPassword(password);
      return { success: result.valid, newUser: result.newUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('secure-notes:setup-vault', async (event, password) => {
    try {
      const result = setupVault(password);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('secure-notes:get-entries', async (event, password) => {
    try {
      const entries = getEntries(password);
      if (entries === null) {
        return { success: false, error: 'Failed to decrypt vault or vault not found/corrupt.' };
      }
      return { success: true, entries };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('secure-notes:save-entry', async (event, { entry, password }) => {
    try {
      const result = saveEntry(entry, password);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('secure-notes:delete-entry', async (event, { entryId, password }) => {
    try {
      const result = deleteEntry(entryId, password);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerSecureNotesHandlers };
