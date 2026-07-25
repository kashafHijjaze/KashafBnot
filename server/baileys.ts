import * as BaileysModule from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { Boom } from '@hapi/boom';
import { getSessions, saveSessions, addLog, Session, getAntiDelete, getFirestoreDb, isFirestoreQuotaExhausted, handleFirestoreError, isUserBanned, addAdminNotification, updateUserProfileInfo } from './db';
import { handleIncomingMessage, handleDeletedMessage, unwrapMessage, getGroupPermissions, cleanJid } from './commands';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';

// Robust resolver for Baileys module to support both ESM and bundled CommonJS environments
const makeWASocket = (() => {
  if (typeof BaileysModule === 'function') return BaileysModule;
  if (BaileysModule.default && typeof BaileysModule.default === 'function') return BaileysModule.default;
  if ((BaileysModule.default as any)?.default && typeof (BaileysModule.default as any).default === 'function') return (BaileysModule.default as any).default;
  if ((BaileysModule as any).makeWASocket) return (BaileysModule as any).makeWASocket;
  return BaileysModule;
})() as any;

const useMultiFileAuthState = BaileysModule.useMultiFileAuthState || (BaileysModule.default as any)?.useMultiFileAuthState;
const DisconnectReason = BaileysModule.DisconnectReason || (BaileysModule.default as any)?.DisconnectReason;
const fetchLatestBaileysVersion = BaileysModule.fetchLatestBaileysVersion || (BaileysModule.default as any)?.fetchLatestBaileysVersion;
const delay = BaileysModule.delay || (BaileysModule.default as any)?.delay;
const jidNormalizedUser = BaileysModule.jidNormalizedUser || (BaileysModule.default as any)?.jidNormalizedUser;
const Browsers = BaileysModule.Browsers || (BaileysModule.default as any)?.Browsers;

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'baileys_sessions');

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

let ioInstance: any = null;
const activeSockets = new Map<string, any>();

export function setIoInstance(io: any) {
  ioInstance = io;
}

// Optimized caching and queueing for Firestore session sync to avoid rate limits and file errors
const lastSyncedContents = new Map<string, Map<string, string>>();
const syncQueues = new Map<string, SessionSyncQueue>();
const reconnectAttempts = new Map<string, number>();
const initializingPromises = new Map<string, Promise<any>>();
const userMessageStores = new Map<string, Map<string, any>>();
const welcomeSentUsers = new Set<string>();

function getOrCreateMessageStore(userId: string): Map<string, any> {
  if (!userMessageStores.has(userId)) {
    userMessageStores.set(userId, new Map());
  }
  return userMessageStores.get(userId)!;
}

class SessionSyncQueue {
  private userId: string;
  private isSyncing = false;
  private hasPending = false;
  private lastSyncTime = 0;
  private timeout: NodeJS.Timeout | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  public trigger() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    const now = Date.now();
    const timeSinceLastSync = now - this.lastSyncTime;
    const minInterval = 5000; // Minimum 5 seconds between full syncs to avoid Firestore write-spam

    if (timeSinceLastSync >= minInterval) {
      this.execute();
    } else {
      const delayTime = minInterval - timeSinceLastSync;
      this.timeout = setTimeout(() => {
        this.execute();
      }, delayTime);
    }
  }

  private async execute() {
    if (this.isSyncing) {
      this.hasPending = true;
      return;
    }

    this.isSyncing = true;
    this.hasPending = false;
    this.lastSyncTime = Date.now();

    try {
      await syncSessionToFirestore(this.userId);
    } catch (err) {
      console.error(`[SessionSyncQueue] Error during sync for ${this.userId}:`, err);
    } finally {
      this.isSyncing = false;
      if (this.hasPending) {
        this.trigger();
      }
    }
  }

  public forceCancel() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

export async function syncSingleFileToFirestore(userId: string, filename: string): Promise<void> {
  const firestoreDb = getFirestoreDb();
  if (!firestoreDb || isFirestoreQuotaExhausted()) return;
  const sessionPath = getSessionPath(userId);
  const filePath = path.join(sessionPath, filename);
  if (!fs.existsSync(filePath)) return;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check in-memory cache to prevent redundant writes
    const userCache = lastSyncedContents.get(userId) || new Map<string, string>();
    if (!lastSyncedContents.has(userId)) {
      lastSyncedContents.set(userId, userCache);
    }
    if (userCache.get(filename) === content) {
      return;
    }

    userCache.set(filename, content);
    
    // Enqueue a bundled sync to firestore which is debounced but reliable
    triggerSessionSyncToFirestore(userId);
    console.log(`[SessionSync] Enqueued debounced bundled sync for critical file ${filename} for ${userId}.`);
  } catch (err) {
    console.error(`[SessionSync] Error queueing file ${filename} for sync for ${userId}:`, err);
  }
}

export async function syncSessionFromFirestore(userId: string): Promise<void> {
  const firestoreDb = getFirestoreDb();
  if (!firestoreDb) {
    console.log(`[SessionSync] Firestore is not active. Skipping cloud restore for ${userId}.`);
    return;
  }
  const sessionPath = getSessionPath(userId);
  try {
    console.log(`[SessionSync] Syncing session files FROM cloud Firestore for user ${userId}...`);
    
    // Get or initialize user cache
    const userCache = lastSyncedContents.get(userId) || new Map<string, string>();
    if (!lastSyncedContents.has(userId)) {
      lastSyncedContents.set(userId, userCache);
    }

    // 1. First, try the bundled/packed format from 'baileys_sessions_v2'
    try {
      const docRef = doc(firestoreDb, 'baileys_sessions_v2', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.files) {
          let count = 0;
          for (const [filename, content] of Object.entries(data.files)) {
            const filePath = path.join(sessionPath, filename);
            fs.writeFileSync(filePath, content as string, 'utf-8');
            userCache.set(filename, content as string);
            count++;
          }
          console.log(`[SessionSync] Restored ${count} session files from bundled Firestore doc for user ${userId}.`);
          return;
        }
      }
    } catch (bundleErr) {
      handleFirestoreError(bundleErr, `syncSessionFromFirestore bundle for ${userId}`);
    }

    // 2. Fallback to individual legacy files if bundled doc is not present
    console.log(`[SessionSync] Bundled session doc not found. Falling back to individual legacy files for ${userId}...`);
    const q = query(collection(firestoreDb, 'baileys_auth_files'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`[SessionSync] No cloud session files found in legacy Firestore for ${userId}.`);
      return;
    }

    let count = 0;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.filename && data.content) {
        const filePath = path.join(sessionPath, data.filename);
        fs.writeFileSync(filePath, data.content, 'utf-8');
        userCache.set(data.filename, data.content);
        count++;
      }
    });
    console.log(`[SessionSync] Restored ${count} individual legacy session files from Firestore for user ${userId}.`);
  } catch (err) {
    handleFirestoreError(err, `syncSessionFromFirestore for ${userId}`);
  }
}

export async function syncSessionToFirestore(userId: string): Promise<void> {
  const firestoreDb = getFirestoreDb();
  if (!firestoreDb || isFirestoreQuotaExhausted()) return;
  const sessionPath = getSessionPath(userId);
  try {
    if (!fs.existsSync(sessionPath)) return;
    const credsPath = path.join(sessionPath, 'creds.json');
    if (!fs.existsSync(credsPath)) {
      console.log(`[SessionSync] creds.json does not exist locally for ${userId}. Skipping Firestore sync to protect cloud backup.`);
      return;
    }
    const credsContent = fs.readFileSync(credsPath, 'utf-8');
    if (!credsContent || credsContent.trim().length < 20) {
      console.log(`[SessionSync] creds.json is empty or corrupted locally for ${userId}. Skipping Firestore sync to protect cloud backup.`);
      return;
    }

    const localFiles = fs.readdirSync(sessionPath).filter(f => f.endsWith('.json'));
    
    console.log(`[SessionSync] Bundling up to ${localFiles.length} session files to Firestore for ${userId}...`);

    // Get or initialize user cache
    const userCache = lastSyncedContents.get(userId) || new Map<string, string>();
    if (!lastSyncedContents.has(userId)) {
      lastSyncedContents.set(userId, userCache);
    }

    const filesMap: { [filename: string]: string } = {};
    let hasChanges = false;

    for (const filename of localFiles) {
      const filePath = path.join(sessionPath, filename);
      if (!fs.existsSync(filePath)) continue;
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        filesMap[filename] = content;
        
        if (userCache.get(filename) !== content) {
          hasChanges = true;
          userCache.set(filename, content);
        }
      } catch (readErr: any) {
        if (readErr.code !== 'ENOENT') {
          console.error(`[SessionSync] Failed to read session file ${filename}:`, readErr);
        }
      }
    }

    // Check if any file in the user cache was deleted locally
    for (const cachedFilename of Array.from(userCache.keys())) {
      if (!filesMap[cachedFilename]) {
        hasChanges = true;
        userCache.delete(cachedFilename);
      }
    }

    if (!hasChanges) {
      console.log(`[SessionSync] No changes in session files detected for ${userId}. Skipping Firestore write.`);
      return;
    }

    // Save all files bundled as a single doc
    await setDoc(doc(firestoreDb, 'baileys_sessions_v2', userId), {
      userId,
      updatedAt: Date.now(),
      files: filesMap
    });
    
    console.log(`[SessionSync] Successfully synced bundled session files to Firestore for ${userId} (1 write operation).`);
  } catch (err) {
    handleFirestoreError(err, `syncSessionToFirestore for ${userId}`);
  }
}

// Check if a valid session credentials file exists locally or in cloud storage
export async function hasSavedSession(userId: string): Promise<boolean> {
  // 1. Check local filesystem
  const sessionPath = path.join(SESSIONS_DIR, `session_${userId}`);
  const credsPath = path.join(sessionPath, 'creds.json');
  if (fs.existsSync(credsPath)) {
    try {
      const stats = fs.statSync(credsPath);
      if (stats.size > 20) return true;
    } catch (e) {}
  }

  // 2. Check Firestore
  const firestoreDb = getFirestoreDb();
  if (firestoreDb && !isFirestoreQuotaExhausted()) {
    try {
      const docRef = doc(firestoreDb, 'baileys_sessions_v2', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data()?.files?.['creds.json']) {
        return true;
      }
    } catch (e) {}

    try {
      const q = query(collection(firestoreDb, 'baileys_auth_files'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return true;
      }
    } catch (e) {}
  }

  return false;
}

export function triggerSessionSyncToFirestore(userId: string) {
  let queue = syncQueues.get(userId);
  if (!queue) {
    queue = new SessionSyncQueue(userId);
    syncQueues.set(userId, queue);
  }
  queue.trigger();
}

// Helper to get session directory
function getSessionPath(userId: string): string {
  const dir = path.join(SESSIONS_DIR, `session_${userId}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// Read creds.json content for a user session
export function getCredsJson(userId: string): string {
  const credsPath = path.join(SESSIONS_DIR, `session_${userId}`, 'creds.json');
  if (!fs.existsSync(credsPath)) {
    throw new Error('No WhatsApp credentials file found for this session.');
  }
  return fs.readFileSync(credsPath, 'utf-8');
}

// Import and save custom creds.json content
export async function importCredsJson(userId: string, email: string, credsContent: string): Promise<any> {
  let parsed: any;
  try {
    parsed = JSON.parse(credsContent);
  } catch (e) {
    throw new Error('Invalid JSON format. Please ensure the file is valid JSON.');
  }

  if (!parsed || !parsed.noiseKey || !parsed.signedIdentityKey) {
    throw new Error('Invalid Baileys credentials file. Must contain "noiseKey" and "signedIdentityKey" attributes.');
  }

  // Create session directory and write creds.json
  const sessionPath = getSessionPath(userId);
  const credsPath = path.join(sessionPath, 'creds.json');
  fs.writeFileSync(credsPath, JSON.stringify(parsed, null, 2), 'utf-8');

  // Immediately push the newly imported credential file to Firestore to prevent overwrites
  await syncSessionToFirestore(userId);

  // Update session entry in database
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex(s => s.userId === userId);
  
  // Try to pre-extract phone number if registered
  let phone = sessionIndex !== -1 ? sessions[sessionIndex].phone : undefined;
  if (parsed.me && parsed.me.id) {
    phone = parsed.me.id.split(':')[0];
  }

  const updatedSession: Session = {
    userId,
    email,
    status: 'connecting',
    phone
  };

  if (sessionIndex === -1) {
    sessions.push(updatedSession);
  } else {
    sessions[sessionIndex] = updatedSession;
  }
  saveSessions(sessions);

  addLog(userId, email, 'import_creds', `Imported creds.json successfully${phone ? ` (Phone: +${phone})` : ''}. Restoring session...`);
  if (ioInstance) {
    ioInstance.to(userId).emit('wa-status', updatedSession);
    ioInstance.to('admin').emit('admin-session-update', { userId, email, status: 'connecting', phone });
    ioInstance.to('admin').emit('admin-log-update', {
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      userId,
      email,
      action: 'import_creds',
      message: `Imported creds.json successfully${phone ? ` (Phone: +${phone})` : ''}. Restoring session...`,
      timestamp: new Date().toISOString()
    });
  }

  // Asynchronously initialize the WhatsApp session from the newly written credentials
  setTimeout(() => {
    initWhatsAppSession(userId, email, false).catch(err => {
      console.error('Failed to initialize imported Baileys session:', err);
    });
  }, 500);

  return { success: true, phone };
}

// Disconnect and delete session state
export async function disconnectWhatsApp(userId: string, email: string) {
  addLog(userId, email, 'disconnect_attempt', 'Attempting to disconnect WhatsApp session...');
  welcomeSentUsers.delete(userId);
  
  const sock = activeSockets.get(userId);
  if (sock) {
    try {
      sock.ev.removeAllListeners('connection.update');
      sock.ev.removeAllListeners('creds.update');
      sock.end(undefined);
    } catch (e) {
      console.error('Error ending socket:', e);
    }
    activeSockets.delete(userId);
  }

  // Delete session folder
  const sessionPath = path.join(SESSIONS_DIR, `session_${userId}`);
  if (fs.existsSync(sessionPath)) {
    try {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    } catch (e) {
      console.error('Error deleting session path:', e);
    }
  }

  // Clear any pending sync queues
  const existingQueue = syncQueues.get(userId);
  if (existingQueue) {
    existingQueue.forceCancel();
    syncQueues.delete(userId);
  }

  // Delete session files from Firestore
  const firestoreDb = getFirestoreDb();
  if (firestoreDb && !isFirestoreQuotaExhausted()) {
    try {
      const q = query(collection(firestoreDb, 'baileys_auth_files'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      for (const docSnap of querySnapshot.docs) {
        await deleteDoc(docSnap.ref);
      }
      
      // Also delete bundled sessions doc
      try {
        await deleteDoc(doc(firestoreDb, 'baileys_sessions_v2', userId));
      } catch (bundleDelErr) {}
      
      console.log(`[SessionSync] Cleared Firestore session files for disconnected user: ${userId}`);
    } catch (err) {
      handleFirestoreError(err, `clearFirestoreSessionFiles for ${userId}`);
    }
  }

  // Update session entry in database
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.userId === userId);
  if (index !== -1) {
    sessions[index].status = 'disconnected';
    sessions[index].phone = undefined;
    sessions[index].pairedAt = undefined;
    saveSessions(sessions);
  }

  if (ioInstance) {
    ioInstance.to(userId).emit('wa-status', { status: 'disconnected' });
    ioInstance.to('admin').emit('admin-session-update', { userId, status: 'disconnected' });
  }

  addLog(userId, email, 'disconnect', 'WhatsApp session disconnected and files cleared.');
  const notif = addAdminNotification({
    type: 'session_disconnect',
    title: 'Session Disconnected',
    message: `WhatsApp session disconnected for ${email}`,
    userEmail: email,
    userId
  });
  if (ioInstance) {
    ioInstance.to('admin').emit('admin-notification', notif);
    ioInstance.to('admin').emit('admin-log-update', {
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      userId,
      email,
      action: 'disconnect',
      message: 'WhatsApp session disconnected and files cleared.',
      timestamp: new Date().toISOString()
    });
  }
}

// Main logic to initialize WhatsApp socket
export async function initWhatsAppSession(
  userId: string,
  email: string,
  useQr: boolean = false,
  phoneToPair?: string,
  forceRestoreFromCloud: boolean = false
): Promise<any> {
  if (initializingPromises.has(userId)) {
    console.log(`[Baileys] Socket initialization already in progress for user ${userId}. Awaiting active initialization promise...`);
    return await initializingPromises.get(userId);
  }

  const initPromise = (async () => {
    const sessionPath = getSessionPath(userId);
    const credsPath = path.join(sessionPath, 'creds.json');
    
    // Restore pre-existing files from cloud Firestore only if local credentials do not exist OR forceRestoreFromCloud is true
    if (!fs.existsSync(credsPath) || forceRestoreFromCloud) {
      console.log(`[Session Load] Local creds.json missing or cloud sync forced for user ${userId} (${email}). Syncing from cloud storage...`);
      await syncSessionFromFirestore(userId);
    } else {
      console.log(`[Session Load] Loaded valid multi-file auth state for user ${userId} (${email}). creds.json verified locally.`);
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    // Intercept credentials and key updates to synchronize with Firestore immediately
    const customSaveCreds = async () => {
      await saveCreds();
      console.log(`[Session Save] Authentication state updated and saved to creds.json for user ${userId} (${email}).`);
      await syncSingleFileToFirestore(userId, 'creds.json');
      triggerSessionSyncToFirestore(userId);
    };

    const originalSetKeys = state.keys.set;
    state.keys.set = async (data: any) => {
      await originalSetKeys(data);
      triggerSessionSyncToFirestore(userId);
    };

    let version: any = [2, 3000, 1017004407]; // Modern stable Baileys version fallback
    try {
      const latest = await fetchLatestBaileysVersion();
      if (latest && latest.version) {
        version = latest.version;
      }
    } catch (err) {
      console.warn('[Baileys] Failed to fetch latest version, using fallback:', err);
    }

    // If there's an existing socket, clean it up first and remove all listeners to prevent ghost reconnection loops
    const existingSock = activeSockets.get(userId);
    if (existingSock) {
      try {
        existingSock.ev.removeAllListeners('connection.update');
        existingSock.ev.removeAllListeners('creds.update');
        existingSock.end(undefined);
      } catch (e) {}
      activeSockets.delete(userId);
    }

    const browserConfig = Browsers?.macOS 
      ? Browsers.macOS('Chrome') 
      : ['macOS', 'Chrome', '10.15.7'];

    const userMsgStore = getOrCreateMessageStore(userId);

    const sock = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: state,
      logger: pino({ level: 'silent' }) as any,
      browser: browserConfig,
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      markOnlineOnConnect: true,
      badSessionRetryCount: 3,
      retryRequestDelayMs: 2000,
      getMessage: async (key) => {
        if (key.id && userMsgStore.has(key.id)) {
          return userMsgStore.get(key.id);
        }
        return undefined;
      }
    });

    activeSockets.set(userId, sock);

    // Update database status to connecting
    const sessions = getSessions();
    const sessionIndex = sessions.findIndex(s => s.userId === userId);
    const updatedSession: Session = {
      userId,
      email,
      status: 'connecting',
      phone: phoneToPair || (sessionIndex !== -1 ? sessions[sessionIndex].phone : undefined)
    };

    if (sessionIndex === -1) {
      sessions.push(updatedSession);
    } else {
      sessions[sessionIndex] = updatedSession;
    }
    saveSessions(sessions);

    if (ioInstance) {
      ioInstance.to(userId).emit('wa-status', { status: 'connecting' });
      ioInstance.to('admin').emit('admin-session-update', { userId, status: 'connecting', email });
    }

    sock.ev.on('creds.update', customSaveCreds);

    sock.ev.on('messages.upsert', async (m) => {
      for (const msg of m.messages) {
        if (msg.key?.id && msg.message) {
          userMsgStore.set(msg.key.id, msg.message);
          if (userMsgStore.size > 2000) {
            const firstKey = userMsgStore.keys().next().value;
            if (firstKey) userMsgStore.delete(firstKey);
          }
        }
        handleIncomingMessage(sock, msg, userId, email).catch(err => {
          const errStr = err?.message || String(err);
          if (!errStr.includes('Bad MAC') && !errStr.includes('Failed to decrypt')) {
            console.error('Error handling incoming WhatsApp message:', err);
          }
        });
      }
    });

    sock.ev.on('messages.update', async (updates) => {
      const antiDeleteEnabled = getAntiDelete(userId);
      if (!antiDeleteEnabled) return;

      for (const update of updates) {
        // 1. Check for protocolMessage revoke inside update or update.update
        const messageContent = (update as any).message || update.update?.message;
        const unwrappedUpdate = unwrapMessage(messageContent);
        const proto = unwrappedUpdate?.protocolMessage;
        const isProtoRevoke = proto && (proto.type === 3 || proto.type === 'REVOKE');

        // 2. Check for messageStubType revoke inside update.update
        const stubType = update.update?.messageStubType as any;
        const isStubRevoke = stubType === 1 || stubType === 'REVOKE' || stubType === 28 || stubType === 68 || stubType === 118;

        if (isProtoRevoke || isStubRevoke) {
          const deletedId = isProtoRevoke ? proto.key?.id : update.key?.id;
          const chatJid = isProtoRevoke ? (proto.key?.remoteJid || update.key?.remoteJid) : update.key?.remoteJid;
          const deletedByOwner = isProtoRevoke ? !!proto.key?.fromMe : !!update.key?.fromMe;

          if (deletedId && chatJid) {
            console.log(`[AntiDelete] Revocation detected in messages.update. Deleted ID: ${deletedId}, Chat ID: ${chatJid}, Proto: ${!!isProtoRevoke}, Stub: ${!!isStubRevoke}, Owner: ${deletedByOwner}`);
            handleDeletedMessage(sock, userId, deletedId, email, chatJid, deletedByOwner).catch(err => {
              console.error('Error handling delete in messages.update:', err);
            });
          }
        }
      }
    });

    sock.ev.on('group-participants.update', async (update) => {
      const { id, participants, action } = update;
      if (action === 'add') {
        for (const p of participants) {
          const pJid = cleanJid(p);
          if (isUserBanned(id, pJid)) {
            console.log(`[Ban Enforcement] Banned user ${pJid} joined or was added to group ${id}. Enforcing ban...`);
            try {
              const ownerJid = cleanJid(sock.user?.id || '');
              const perm = await getGroupPermissions(sock, id, ownerJid, true);
              if (perm.isBotAdmin) {
                await sock.groupParticipantsUpdate(id, [pJid], 'remove');
                await sock.sendMessage(id, {
                  text: `🚨 *AUTOMATIC BAN ENFORCEMENT*\n\nUser @${pJid.split('@')[0]} is banned from this group and was automatically removed.`,
                  mentions: [pJid]
                });
              }
            } catch (err) {
              console.error('[Ban Enforcement Event Error]', err);
            }
          }
        }
      }
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && useQr) {
        console.log(`QR generated for ${userId}`);
        if (ioInstance) {
          ioInstance.to(userId).emit('wa-status', { status: 'qr', qr });
          ioInstance.to('admin').emit('admin-session-update', { userId, status: 'qr', qr, email });
        }
      }

      if (connection === 'close') {
        // Check if this socket has been superseded or removed from activeSockets.
        // If activeSockets.get(userId) is not this exact socket, we should ignore this event.
        const currentSock = activeSockets.get(userId);
        if (currentSock !== sock) {
          console.log(`Ignoring close event for non-active or superseded socket of user ${userId}`);
          return;
        }

        const err = lastDisconnect?.error;
        const errStr = err ? (err.message || String(err)) : '';
        const causeStr = (err as any)?.cause ? ((err as any).cause.message || String((err as any).cause)) : '';
        let isQrTimeout = errStr.includes('QR refs attempts ended') || causeStr.includes('QR refs attempts ended');
        
        if (!isQrTimeout && err) {
          try {
            const jsonStr = JSON.stringify(err);
            if (jsonStr.includes('QR refs attempts ended')) {
              isQrTimeout = true;
            }
          } catch (e) {}
        }
        
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const cleanReason = (errStr || causeStr || `Status code ${statusCode}` || 'Disconnected').replace(/^Error:\s*/i, '');
        console.log(`[Connection Disconnect] Connection closed for user ${userId} (${email}). Reason: ${cleanReason}, statusCode: ${statusCode}, isQrTimeout: ${isQrTimeout}`);
        
        if (activeSockets.get(userId) === sock) {
          activeSockets.delete(userId);
        }

        if (isQrTimeout) {
          console.log(`[Connection] QR pairing timed out for ${userId}. Setting status to disconnected (credentials preserved).`);
          const currentSessions = getSessions();
          const index = currentSessions.findIndex(s => s.userId === userId);
          if (index !== -1 && currentSessions[index].status === 'connecting') {
            currentSessions[index].status = 'disconnected';
            saveSessions(currentSessions);
          }
          if (ioInstance) {
            const baseUserId = userId.split('_')[0];
            ioInstance.to(userId).emit('wa-status', { status: 'disconnected', message: 'QR pairing expired.' });
            if (baseUserId !== userId) {
              ioInstance.to(baseUserId).emit('wa-status', { status: 'disconnected', message: 'QR pairing expired.' });
            }
            ioInstance.to('admin').emit('admin-session-update', { userId, status: 'disconnected', email });
          }
          addLog(userId, email, 'qr_timeout', 'WhatsApp pairing code expired.');
          return;
        }

        // Handle explicit device logouts / unlinking (StatusCode 401 / DisconnectReason.loggedOut or 403)
        if (statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 403) {
          console.log(`[Logged Out] User ${userId} (${email}) logged out or unlinked from WhatsApp device. StatusCode: ${statusCode}.`);
          addLog(userId, email, 'logged_out', 'WhatsApp account logged out or unlinked from mobile device. Disconnecting session.');
          await disconnectWhatsApp(userId, email);
          return;
        }

        const isRestartRequired = statusCode === DisconnectReason.restartRequired ||
                                  statusCode === 515 ||
                                  cleanReason.toLowerCase().includes('restart required') ||
                                  cleanReason.toLowerCase().includes('stream errored');

        // CRITICAL: NEVER DELETE SESSION FILES ON TEMPORARY CONNECTION DROPS!
        // Schedule automatic reconnection retry loop
        let delayMs: number;
        if (isRestartRequired) {
          reconnectAttempts.set(userId, 0);
          delayMs = 500;
          console.log(`[Stream Restart] Stream Errored / restart required (515) for ${userId} (${email}). Reconnecting immediately in 500ms...`);
        } else {
          const attempts = reconnectAttempts.get(userId) || 0;
          reconnectAttempts.set(userId, attempts + 1);
          delayMs = Math.min(3000 * Math.pow(1.3, Math.min(attempts, 10)), 30000);
          console.log(`[Reconnection] Scheduling automatic reconnect attempt ${attempts + 1} for ${userId} (${email}) in ${Math.round(delayMs)}ms...`);
        }

        if (ioInstance) {
          const baseUserId = userId.split('_')[0];
          const attemptsVal = reconnectAttempts.get(userId) || 1;
          const statusPayload = { status: 'connecting', message: isRestartRequired ? 'Reconnecting WhatsApp stream...' : `Reconnecting to WhatsApp (Attempt ${attemptsVal})...` };
          ioInstance.to(userId).emit('wa-status', statusPayload);
          if (baseUserId !== userId) {
            ioInstance.to(baseUserId).emit('wa-status', statusPayload);
          }
          ioInstance.to('admin').emit('admin-session-update', { userId, status: 'connecting', message: isRestartRequired ? 'Reconnecting stream...' : 'Reconnecting...', email });
        }

        await delay(delayMs);

        // Verify if a newer socket session was established during the delay
        if (activeSockets.has(userId) && activeSockets.get(userId) !== sock) {
          console.log(`A newer active session exists for user ${userId} during reconnect delay. Aborting older reconnect loop.`);
          return;
        }

        initWhatsAppSession(userId, email, useQr).catch(reconnectErr => {
          console.error(`[Reconnection Error] Failed to re-initialize session for ${userId}:`, reconnectErr);
        });
      } else if (connection === 'open') {
        reconnectAttempts.delete(userId);
        let connectedPhone = '';
        if (sock.user?.id) {
          const normalized = jidNormalizedUser(sock.user.id);
          if (normalized.endsWith('@s.whatsapp.net')) {
            connectedPhone = normalized.split('@')[0];
          } else {
            // If it is a LID or other JID, check if session already has a phone number
            const currentSessions = getSessions();
            const existingSess = currentSessions.find(s => s.userId === userId);
            if (existingSess && existingSess.phone) {
              connectedPhone = existingSess.phone;
            } else {
              connectedPhone = normalized.split('@')[0];
            }
          }
        }
        console.log(`[Successful Connection] WhatsApp connected successfully for ${userId} (${email}): +${connectedPhone}`);

      // Update Session DB
      const currentSessions = getSessions();
      let idx = currentSessions.findIndex(s => s.userId === userId);
      if (idx === -1 && email) {
        idx = currentSessions.findIndex(s => s.email && s.email.toLowerCase() === email.toLowerCase());
      }

      if (idx !== -1) {
        currentSessions[idx].status = 'connected';
        if (connectedPhone) currentSessions[idx].phone = connectedPhone;
        currentSessions[idx].pairedAt = new Date().toISOString();
        saveSessions(currentSessions);
      } else {
        const newSess: Session = {
          userId,
          email,
          status: 'connected',
          phone: connectedPhone,
          pairedAt: new Date().toISOString()
        };
        currentSessions.push(newSess);
        saveSessions(currentSessions);
      }

      // Sync User Profile info for dashboard
      if (connectedPhone) {
        const waName = sock.user?.name || sock.user?.notify;
        updateUserProfileInfo(userId, { whatsappPhone: connectedPhone, whatsappName: waName });
        const baseUserId = userId.split('_')[0];
        if (baseUserId !== userId) {
          updateUserProfileInfo(baseUserId, { whatsappPhone: connectedPhone, whatsappName: waName });
        }
      }

      if (ioInstance) {
        const baseUserId = userId.split('_')[0];
        const payload = { 
          status: 'connected', 
          phone: connectedPhone,
          pairedAt: new Date().toISOString()
        };
        ioInstance.to(userId).emit('wa-status', payload);
        if (baseUserId !== userId) {
          ioInstance.to(baseUserId).emit('wa-status', payload);
        }
        ioInstance.to('admin').emit('admin-session-update', { 
          userId,
          email,
          status: 'connected', 
          phone: connectedPhone,
          pairedAt: new Date().toISOString()
        });
      }

      addLog(userId, email, 'connect', `WhatsApp successfully linked and online: +${connectedPhone}`);
      const connectNotif = addAdminNotification({
        type: 'session_connect',
        title: 'Session Connected',
        message: `WhatsApp session connected for ${email}${connectedPhone ? ` (+${connectedPhone})` : ''}`,
        userEmail: email,
        userId
      });
      
      // Force sync session state to Firestore on successful connection open to ensure we have valid credentials backed up
      await syncSessionToFirestore(userId);
      if (ioInstance) {
        ioInstance.to('admin').emit('admin-notification', connectNotif);
        ioInstance.to('admin').emit('admin-log-update', {
          id: 'log_' + Math.random().toString(36).substr(2, 9),
          userId,
          email,
          action: 'connect',
          message: `WhatsApp successfully linked and online: +${connectedPhone}`,
          timestamp: new Date().toISOString()
        });
      }

      // AUTO SEND MESSAGE TO OWN NUMBER (Only once per active paired session)
      if (!welcomeSentUsers.has(userId)) {
        welcomeSentUsers.add(userId);
        try {
          let ownJid = '';
          if (sock.user?.id) {
            ownJid = jidNormalizedUser(sock.user.id);
          }

          // Only send if it's a valid phone JID (s.whatsapp.net) to avoid protocol errors with LIDs
          if (ownJid && ownJid.endsWith('@s.whatsapp.net')) {
            console.log(`Auto sending connection message to own JID: ${ownJid}`);
            
            // Message 1: Bot Connected
            await sock.sendMessage(ownJid, { text: '✅ Hijjaze Bot Connected' });
            
            // Message 2: Channel Invite
            const channelInviteText = '📢 View our WhatsApp Channel for more information.\n\nLink: https://whatsapp.com/channel/0029Vb7wo6O5a23w6LJo2K1y';
            await sock.sendMessage(ownJid, { text: channelInviteText });
            
            addLog(userId, email, 'auto_message', 'Successfully sent auto-connect notifications and Channel invitation to own WhatsApp number.');
            if (ioInstance) {
              ioInstance.to('admin').emit('admin-log-update', {
                id: 'log_' + Math.random().toString(36).substr(2, 9),
                userId,
                email,
                action: 'auto_message',
                message: 'Successfully sent auto-connect notifications and Channel invitation to own WhatsApp number.',
                timestamp: new Date().toISOString()
              });
            }
          } else {
            console.log(`Skipping auto-message for LID or non-phone JID: ${ownJid}`);
            addLog(userId, email, 'auto_message_skip', `Skipped auto-connect message for companion/LID JID: ${ownJid}`);
          }
        } catch (err: any) {
          console.error('Failed to send auto connection message:', err);
          addLog(userId, email, 'auto_message_error', `Failed auto-connect message: ${err.message}`);
          if (ioInstance) {
            ioInstance.to('admin').emit('admin-log-update', {
              id: 'log_' + Math.random().toString(36).substr(2, 9),
              userId,
              email,
              action: 'auto_message_error',
              message: `Failed auto-connect message: ${err.message}`,
              timestamp: new Date().toISOString()
            });
          }
        }
      } else {
        console.log(`[Auto Message] Welcome message already sent for session ${userId}. Skipping on reconnect.`);
      }
    }
  });

  return sock;
  })();

  initializingPromises.set(userId, initPromise);
  try {
    return await initPromise;
  } finally {
    initializingPromises.delete(userId);
  }
}

// Generate pairing code for phone number
export async function generatePairingCode(userId: string, email: string, phone: string): Promise<string> {
  // Format phone number (digits only)
  let formattedPhone = phone.replace(/\D/g, '');
  if (formattedPhone.startsWith('00')) {
    formattedPhone = formattedPhone.substring(2);
  }

  // Handle local numbers starting with 0
  if (formattedPhone.startsWith('0')) {
    throw new Error('Please include your full Country Code without leading 0 (e.g. 923001234567 for Pakistan, 919876543210 for India, 14155552671 for USA). Do not start with 0.');
  }

  if (!formattedPhone || formattedPhone.length < 8) {
    throw new Error('Please enter a valid phone number with country code (e.g., 923001234567 or 14155552671).');
  }

  addLog(userId, email, 'pairing_request', `Generating WhatsApp pairing code for +${formattedPhone}`);

  // Disconnect any existing session files/sockets to ensure clean state
  await disconnectWhatsApp(userId, email);

  const sock = await initWhatsAppSession(userId, email, false, formattedPhone);
  
  try {
    let rawCode = '';
    let lastError: any = null;

    // Retry requestPairingCode up to 3 times to allow WebSocket handshake completion
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (sock.authState?.creds?.registered) {
          throw new Error('Device is already linked. Disconnect first to pair a new number.');
        }

        // Wait 3s on first attempt, 2s on subsequent attempts
        await delay(attempt === 1 ? 3000 : 2000);

        console.log(`[Baileys] Requesting pairing code for +${formattedPhone} (Attempt ${attempt}/3)...`);
        rawCode = await sock.requestPairingCode(formattedPhone);
        if (rawCode) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Baileys] Pairing code attempt ${attempt} failed:`, err?.message || err);
        if (err?.message?.includes('already linked')) throw err;
      }
    }

    if (!rawCode) {
      throw new Error(lastError?.message || 'WhatsApp servers did not return a pairing code. Please check your phone number and try again.');
    }

    // Format 8-character code as XXXX-XXXX for legibility
    const cleanRaw = rawCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const formattedCode = (cleanRaw.length === 8 && !cleanRaw.includes('-')) 
      ? `${cleanRaw.slice(0, 4)}-${cleanRaw.slice(4)}` 
      : cleanRaw;

    addLog(userId, email, 'pairing_code_generated', `Pairing code successfully generated: ${formattedCode}`);
    return formattedCode;
  } catch (err: any) {
    console.error('[Baileys] Pairing code error:', err);
    addLog(userId, email, 'pairing_code_failed', `Pairing code failed: ${err.message || err}`);
    throw new Error(err.message || 'Failed to request pairing code from WhatsApp. Please verify the phone number.');
  }
}

// Helper to get active socket for user, base user ID, or fallback
export function getActiveSocket(userId: string): any {
  if (!userId) {
    if (activeSockets.size > 0) return activeSockets.values().next().value;
    return undefined;
  }

  if (activeSockets.has(userId)) {
    return activeSockets.get(userId);
  }

  const baseUserId = userId.split('_')[0];
  if (baseUserId && activeSockets.has(baseUserId)) {
    return activeSockets.get(baseUserId);
  }

  for (const [key, sock] of activeSockets.entries()) {
    if (key.startsWith(userId) || (baseUserId && key.startsWith(baseUserId))) {
      return sock;
    }
  }

  // Session list lookup by email or user ID
  try {
    const sessions = getSessions();
    const sess = sessions.find(s => s.userId === userId || s.userId === baseUserId);
    if (sess && sess.email) {
      const emailLower = sess.email.toLowerCase();
      for (const [key, sock] of activeSockets.entries()) {
        const matchSess = sessions.find(s => s.userId === key);
        if (matchSess && matchSess.email && matchSess.email.toLowerCase() === emailLower) {
          return sock;
        }
      }
    }
  } catch (e) {}

  // System fallback: if activeSockets has connected sockets, return the first active socket
  if (activeSockets.size > 0) {
    return activeSockets.values().next().value;
  }

  return undefined;
}

export function getAllActiveSockets(): Map<string, any> {
  return activeSockets;
}

// Helper to safely send message with timeout
async function sendMessageWithTimeout(sock: any, recipientJid: string, payload: any, timeoutMs = 20000): Promise<any> {
  let timeoutId: any;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('WhatsApp send request timed out (20s). Please ensure your connected phone has internet connection.'));
    }, timeoutMs);
  });

  try {
    const res = await Promise.race([
      sock.sendMessage(recipientJid, payload),
      timeoutPromise
    ]);
    return res;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// Helper to resolve media buffer from URL or base64 with 15s timeout
async function fetchMediaBuffer(url: string): Promise<Buffer> {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
    throw new Error('Invalid URL format. Please provide a direct link starting with http:// or https://');
  }

  if (trimmed.startsWith('data:')) {
    const base64Data = trimmed.split(',')[1];
    if (!base64Data) throw new Error('Invalid Data URI format.');
    return Buffer.from(base64Data, 'base64');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(trimmed, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Media fetch returned HTTP status ${response.status}: ${response.statusText}`);
    }
    const arrayBuf = await response.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Media download timed out (15s limit). Please use a faster direct link.');
    }
    throw new Error(`Failed to download media: ${err.message || String(err)}`);
  } finally {
    clearTimeout(timeout);
  }
}

// Send Custom message via active WhatsApp session or broadcast across all sessions
export async function sendWhatsAppMessage(
  userId: string, 
  targetPhone: string, 
  messageType: string, 
  content: string, 
  fileName?: string,
  broadcastAll: boolean = false
): Promise<any> {
  if (!targetPhone || !targetPhone.trim()) {
    throw new Error('Recipient phone number or JID is required.');
  }

  // Format JID properly preserving @newsletter, @g.us, or appending @s.whatsapp.net
  let jid = targetPhone.trim();
  if (!jid.includes('@')) {
    const digits = jid.replace(/\D/g, '');
    if (!digits) {
      throw new Error('Invalid phone number format. Please provide phone digits (e.g. 923001234567).');
    }
    jid = `${digits}@s.whatsapp.net`;
  }

  let messagePayload: any = {};

  if (messageType === 'text') {
    if (!content || !content.trim()) {
      throw new Error('Message text content cannot be empty.');
    }
    messagePayload = { text: content };
  } else if (['image', 'video', 'document', 'audio'].includes(messageType)) {
    if (!content || !content.trim()) {
      throw new Error(`Media URL or link is required for ${messageType} sending.`);
    }

    const buffer = await fetchMediaBuffer(content);
    const caption = fileName || `${messageType.toUpperCase()} from Hijjaze Bot`;

    switch (messageType) {
      case 'image':
        messagePayload = { image: buffer, caption };
        break;
      case 'video':
        messagePayload = { video: buffer, caption };
        break;
      case 'document':
        messagePayload = { 
          document: buffer, 
          fileName: fileName || 'document.pdf', 
          mimetype: 'application/pdf' 
        };
        break;
      case 'audio':
        messagePayload = { 
          audio: buffer, 
          mimetype: 'audio/mp4', 
          ptt: true 
        };
        break;
    }
  } else {
    messagePayload = { text: content };
  }

  if (broadcastAll && activeSockets.size > 0) {
    const results: any[] = [];
    for (const [sId, sock] of activeSockets.entries()) {
      try {
        const res = await sendMessageWithTimeout(sock, jid, messagePayload, 20000);
        results.push({ sessionId: sId, success: true, res });
      } catch (err: any) {
        console.error(`Error broadcasting to socket ${sId}:`, err);
        results.push({ sessionId: sId, success: false, error: err?.message || String(err) });
      }
    }
    return results;
  }

  const sock = getActiveSocket(userId);
  if (!sock) {
    throw new Error('WhatsApp is not connected or active for this session. Please link your WhatsApp device via QR or Pairing Code first.');
  }

  const result = await sendMessageWithTimeout(sock, jid, messagePayload, 20000);
  return result;
}

// Fetch participating WhatsApp groups
export async function getWhatsAppGroups(userId: string): Promise<any[]> {
  const sock = getActiveSocket(userId);
  if (!sock) {
    throw new Error('WhatsApp is not connected.');
  }

  const groups = await sock.groupFetchAllParticipating();
  return Object.values(groups).map((g: any) => ({
    id: g.id,
    subject: g.subject,
    owner: g.owner,
    creation: g.creation,
    size: g.participants?.length || 0
  }));
}

// Scan and automatically reconnect any pre-existing active sessions on boot
export async function autoConnectAllSessions() {
  console.log('[AutoConnect] Scanning database and cloud storage for WhatsApp sessions to auto-restore...');
  
  const firestoreDb = getFirestoreDb();
  const allUserIds = new Set<string>();

  // 1. Collect user IDs from local sessions
  const localSessions = getSessions();
  localSessions.forEach(s => allUserIds.add(s.userId));

  // 2. Collect user IDs from local filesystem directories
  if (fs.existsSync(SESSIONS_DIR)) {
    try {
      const dirs = fs.readdirSync(SESSIONS_DIR);
      dirs.forEach(dir => {
        if (dir.startsWith('session_')) {
          allUserIds.add(dir.replace('session_', ''));
        }
      });
    } catch (e) {}
  }

  // 3. Collect user IDs from Firestore bundled sessions collection
  if (firestoreDb && !isFirestoreQuotaExhausted()) {
    try {
      const snap = await getDocs(collection(firestoreDb, 'baileys_sessions_v2'));
      snap.forEach(d => allUserIds.add(d.id));
    } catch (e) {}
  }

  console.log(`[AutoConnect] Discovered ${allUserIds.size} potential session candidate(s). Checking for saved credentials...`);

  for (const userId of Array.from(allUserIds)) {
    try {
      const hasCreds = await hasSavedSession(userId);
      if (hasCreds) {
        const sessionRecord = localSessions.find(s => s.userId === userId);
        const email = sessionRecord?.email || 'user@hijjaze.bot';
        console.log(`[AutoConnect] Auto-restoring and initializing WhatsApp session for user ID: ${userId} (${email})...`);
        
        // Ensure session record is marked connected in local sessions cache
        if (sessionRecord) {
          if (sessionRecord.status !== 'connected') {
            sessionRecord.status = 'connected';
            saveSessions(localSessions);
          }
        } else {
          localSessions.push({
            userId,
            email,
            status: 'connected'
          });
          saveSessions(localSessions);
        }

        // Initialize session and force restore cloud backup if local files are missing
        await initWhatsAppSession(userId, email, false, undefined, true);
      }
    } catch (err) {
      console.error(`[AutoConnect Error] Failed to auto-restore session for user ${userId}:`, err);
    }
  }

  // Start background periodic watchdog to ensure sockets stay alive 24/7 without needing dashboard open
  startSessionWatchdog();
}

// Watchdog service to periodically verify active socket status and reconnect dropped sessions automatically
let watchdogTimer: NodeJS.Timeout | null = null;
export function startSessionWatchdog() {
  if (watchdogTimer) return;
  console.log('[Watchdog Engine] Initializing 24/7 Background Session Monitor (Interval: 3 mins)...');
  
  watchdogTimer = setInterval(async () => {
    try {
      const localSessions = getSessions();
      for (const session of localSessions) {
        if (!session.userId) continue;
        const activeSock = activeSockets.get(session.userId);
        const hasCreds = await hasSavedSession(session.userId);
        
        if (hasCreds && !activeSock) {
          console.log(`[Watchdog Engine] Found disconnected session for ${session.userId} (${session.email}). Reconnecting 24/7 background socket...`);
          try {
            await initWhatsAppSession(session.userId, session.email || 'user@hijjaze.bot', false, undefined, true);
          } catch (e: any) {
            console.error(`[Watchdog Engine] Reconnect error for ${session.userId}:`, e?.message || e);
          }
        }
      }
    } catch (err) {
      console.error('[Watchdog Engine Error]:', err);
    }
  }, 180000); // Check every 3 minutes
}

// Graceful shutdown helpers to flush any pending session updates on exit
async function flushAllSyncQueues() {
  console.log('[Shutdown] Gracefully flushing all pending session syncs to Firestore...');
  const activeUserIds = Array.from(syncQueues.keys());
  for (const userId of activeUserIds) {
    const queue = syncQueues.get(userId);
    if (queue) {
      queue.forceCancel();
      try {
        console.log(`[Shutdown] Force syncing session to Firestore for user: ${userId}`);
        await syncSessionToFirestore(userId);
      } catch (err) {
        console.error(`[Shutdown] Failed to sync session for ${userId} during shutdown:`, err);
      }
    }
  }
  console.log('[Shutdown] All pending syncs completed.');
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Cleaning up...');
  await flushAllSyncQueues();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Cleaning up...');
  await flushAllSyncQueues();
  process.exit(0);
});
