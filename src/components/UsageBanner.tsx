import { Gift, AlertCircle, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { MonetizationService } from '../services/monetizationService';

interface UsageBannerProps {
  onShowRewardedVideo: () => void;
  onShowPremium: () => void;
  isRegistered: boolean;
  userUid?: string;
}

export default function UsageBanner({ onShowRewardedVideo, onShowPremium, isRegistered, userUid }: UsageBannerProps) {
  const state = MonetizationService.getMonetizationState(isRegistered, userUid);
  const usageText = MonetizationService.getUsageText(isRegistered, userUid);

  // Debug log
  console.log('UsageBanner state:', state);


  if (state.remainingConversions === 0) {
    // No conversions left
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 border-2 border-red-300 dark:border-red-600 px-4 py-3 rounded-xl shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-900 dark:text-red-100 font-semibold">
              Conversiones agotadas por hoy
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onShowRewardedVideo}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              Ver Anuncio
            </button>
            <button
              onClick={onShowPremium}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md hover:shadow-lg flex items-center gap-1"
            >
              <Crown className="w-4 h-4" />
              Premium
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (state.remainingConversions <= 1) {
    // Low on conversions - encourage upgrade
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-yellow-400 dark:border-yellow-600 px-4 py-3 rounded-xl shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-900 dark:text-amber-100 font-semibold">
              {usageText}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onShowRewardedVideo}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              Ver Anuncio
            </button>
            <button
              onClick={onShowPremium}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md hover:shadow-lg flex items-center gap-1"
            >
              <Crown className="w-4 h-4" />
              Premium
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // No mostrar nada cuando hay conversiones normales disponibles
  return null;
}