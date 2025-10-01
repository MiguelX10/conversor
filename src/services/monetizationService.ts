import { getBrowserFingerprint } from '../utils/browserFingerprint';

interface UserUsage {
  conversions: number;
  lastReset: Date;
  adWatches: number;
  isRegistered: boolean;
  userUid?: string; // UID del usuario registrado
}

interface MonetizationState {
  hasReachedLimit: boolean;
  canWatchAd: boolean;
  remainingConversions: number;
  remainingAdWatches: number;
  showLoginPrompt: boolean;
}

export class MonetizationService {
  private static readonly DAILY_FREE_LIMIT_ANONYMOUS = 1; // Usuario anónimo: solo 1 conversión
  private static readonly DAILY_FREE_LIMIT_REGISTERED = 3; // Usuario registrado: 3 conversiones
  private static readonly MAX_AD_WATCHES = 2;
  private static readonly STORAGE_KEY_ANONYMOUS = 'convertpro_usage';

  // Generar clave de storage específica para usuarios registrados
  private static getStorageKey(userUid?: string): string {
    if (!userUid) {
      return this.STORAGE_KEY_ANONYMOUS; // Usuario anónimo: solo por navegador
    }

    // Usuario registrado: uid + fingerprint (anti-abuse)
    const fingerprint = getBrowserFingerprint();
    return `convertpro_usage_${userUid}_${fingerprint}`;
  }

  static getUserUsage(userUid?: string): UserUsage {
    const storageKey = this.getStorageKey(userUid);
    const stored = localStorage.getItem(storageKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!stored) {
      const newUsage: UserUsage = {
        conversions: 0,
        lastReset: today,
        adWatches: 0,
        isRegistered: !!userUid,
        userUid: userUid
      };
      this.saveUserUsage(newUsage, userUid);
      return newUsage;
    }

    const usage: UserUsage = JSON.parse(stored);
    const lastResetDate = new Date(usage.lastReset);
    lastResetDate.setHours(0, 0, 0, 0); // Normalizar a medianoche

    // Reset daily counters if it's a new day
    if (lastResetDate.getTime() < today.getTime()) {
      usage.conversions = 0;
      usage.adWatches = 0;
      usage.lastReset = today;
      usage.userUid = userUid; // Actualizar UID si cambió
      this.saveUserUsage(usage, userUid);
    } else {
      usage.lastReset = lastResetDate;
      usage.userUid = userUid; // Asegurar UID actualizado
    }

    return usage;
  }

  static getMonetizationState(isUserRegistered: boolean = false, userUid?: string): MonetizationState {
    const usage = this.getUserUsage(userUid);

    // Determinar límite base según el estado del usuario
    const baseLimit = isUserRegistered ? this.DAILY_FREE_LIMIT_REGISTERED : this.DAILY_FREE_LIMIT_ANONYMOUS;
    const totalAllowed = baseLimit + usage.adWatches;
    const hasReachedLimit = usage.conversions >= totalAllowed;
    const canWatchAd = usage.adWatches < this.MAX_AD_WATCHES && hasReachedLimit;

    // Para usuarios anónimos, mostrar prompt de login cuando alcancen el límite
    const showLoginPrompt = !isUserRegistered && usage.conversions >= this.DAILY_FREE_LIMIT_ANONYMOUS;

    return {
      hasReachedLimit,
      canWatchAd,
      remainingConversions: Math.max(0, totalAllowed - usage.conversions),
      remainingAdWatches: Math.max(0, this.MAX_AD_WATCHES - usage.adWatches),
      showLoginPrompt
    };
  }

  static canConvert(isUserRegistered: boolean = false, userUid?: string): boolean {
    const state = this.getMonetizationState(isUserRegistered, userUid);
    return !state.hasReachedLimit;
  }

  static incrementConversion(isUserRegistered: boolean = false, userUid?: string): boolean {
    if (!this.canConvert(isUserRegistered, userUid)) {
      return false;
    }

    const usage = this.getUserUsage(userUid);
    usage.conversions++;
    this.saveUserUsage(usage, userUid);
    return true;
  }

  static rewardAdWatch(userUid?: string): boolean {
    const usage = this.getUserUsage(userUid);

    if (usage.adWatches >= this.MAX_AD_WATCHES) {
      return false;
    }

    usage.adWatches++;
    this.saveUserUsage(usage, userUid);
    return true;
  }


  private static saveUserUsage(usage: UserUsage, userUid?: string): void {
    const storageKey = this.getStorageKey(userUid);
    localStorage.setItem(storageKey, JSON.stringify(usage));
  }

  static setUserRegistered(isRegistered: boolean, userUid?: string): void {
    const usage = this.getUserUsage(userUid);
    usage.isRegistered = isRegistered;
    usage.userUid = userUid;
    this.saveUserUsage(usage, userUid);
  }

  static getUsageText(isUserRegistered: boolean = false, userUid?: string): string {
    const state = this.getMonetizationState(isUserRegistered, userUid);

    if (!isUserRegistered && state.showLoginPrompt) {
      return "¡Regístrate para obtener 3 conversiones diarias!";
    }

    return `${state.remainingConversions} conversiones restantes hoy`;
  }
}