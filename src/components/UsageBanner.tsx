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



  if (state.remainingConversions === 0) {
    // No conversions left
    if (state.canWatchAd) {
      // Aún tiene anuncios disponibles
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 border-2 border-red-300 dark:border-red-600 px-4 py-3 rounded-xl shadow-sm w-fit"
        >
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-900 dark:text-red-100 font-semibold text-sm sm:text-base whitespace-nowrap">
                Conversiones agotadas
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onShowRewardedVideo}
                className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
              >
                +1 por Anuncio
              </button>
              <button
                onClick={onShowPremium}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-md hover:shadow-lg flex items-center gap-1 whitespace-nowrap"
              >
                <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                Premium
              </button>
            </div>
          </div>
        </motion.div>
      );
    } else {
      // Ya no tiene anuncios disponibles, solo mostrar Premium
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-300 dark:border-purple-600 px-4 py-3 rounded-xl shadow-sm w-fit"
        >
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-purple-900 dark:text-purple-100 font-semibold text-sm sm:text-base whitespace-nowrap">
                Sin conversiones disponibles. ¡Hazte Premium!
              </span>
            </div>
            <button
              onClick={onShowPremium}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md hover:shadow-lg flex items-center gap-1 whitespace-nowrap"
            >
              <Crown className="w-4 h-4" />
              Ver Planes
            </button>
          </div>
        </motion.div>
      );
    }
  }

  if (state.remainingConversions <= 1) {
    // Low on conversions - encourage upgrade
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-yellow-400 dark:border-yellow-600 px-4 py-3 rounded-xl shadow-sm w-fit"
      >
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-900 dark:text-amber-100 font-semibold text-sm sm:text-base whitespace-nowrap">
              {usageText}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onShowRewardedVideo}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
            >
              Ver Anuncio
            </button>
            <button
              onClick={onShowPremium}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-md hover:shadow-lg flex items-center gap-1 whitespace-nowrap"
            >
              <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
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