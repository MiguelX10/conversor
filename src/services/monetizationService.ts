interface UserUsage {
  conversions: number;
  lastReset: Date;
  adWatches: number;
}

interface MonetizationState {
  hasReachedLimit: boolean;
  canWatchAd: boolean;
  remainingConversions: number;
  remainingAdWatches: number;
}

export class MonetizationService {
  private static readonly DAILY_FREE_LIMIT = 3;
  private static readonly MAX_AD_WATCHES = 2;
  private static readonly STORAGE_KEY = 'convertpro_usage';

  static getUserUsage(): UserUsage {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!stored) {
      const newUsage: UserUsage = {
        conversions: 0,
        lastReset: today,
        adWatches: 0
      };
      this.saveUserUsage(newUsage);
      return newUsage;
    }

    const usage: UserUsage = JSON.parse(stored);
    usage.lastReset = new Date(usage.lastReset);

    // Reset daily counters if it's a new day
    if (usage.lastReset < today) {
      usage.conversions = 0;
      usage.adWatches = 0;
      usage.lastReset = today;
      this.saveUserUsage(usage);
    }

    return usage;
  }

  static getMonetizationState(): MonetizationState {
    const usage = this.getUserUsage();

    const totalAllowed = this.DAILY_FREE_LIMIT + usage.adWatches;
    const hasReachedLimit = usage.conversions >= totalAllowed;
    const canWatchAd = usage.adWatches < this.MAX_AD_WATCHES && hasReachedLimit;

    return {
      hasReachedLimit,
      canWatchAd,
      remainingConversions: Math.max(0, totalAllowed - usage.conversions),
      remainingAdWatches: Math.max(0, this.MAX_AD_WATCHES - usage.adWatches)
    };
  }

  static canConvert(): boolean {
    const state = this.getMonetizationState();
    return !state.hasReachedLimit;
  }

  static incrementConversion(): boolean {
    if (!this.canConvert()) {
      return false;
    }

    const usage = this.getUserUsage();
    usage.conversions++;
    this.saveUserUsage(usage);
    return true;
  }

  static rewardAdWatch(): boolean {
    const usage = this.getUserUsage();

    if (usage.adWatches >= this.MAX_AD_WATCHES) {
      return false;
    }

    usage.adWatches++;
    this.saveUserUsage(usage);
    return true;
  }


  private static saveUserUsage(usage: UserUsage): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));
  }

  static getUsageText(): string {
    const state = this.getMonetizationState();
    return `${state.remainingConversions} conversiones restantes hoy`;
  }
}