import { Gift, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { MonetizationService } from '../services/monetizationService';

interface UsageBannerProps {
  onShowRewardedVideo: () => void;
}

export default function UsageBanner({ onShowRewardedVideo }: UsageBannerProps) {
  const state = MonetizationService.getMonetizationState();
  const usageText = MonetizationService.getUsageText();


  if (state.remainingConversions === 0) {
    // No conversions left
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 px-4 py-3 rounded-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-orange-800 dark:text-orange-200 font-medium">
              Conversiones agotadas por hoy
            </span>
          </div>
          {state.canWatchAd && (
            <button
              onClick={onShowRewardedVideo}
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              Ver Anuncio
            </button>
          )}
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
        className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-3 rounded-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-yellow-800 dark:text-yellow-200">
              {usageText}
            </span>
          </div>
          {state.canWatchAd && (
            <button
              onClick={onShowRewardedVideo}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              Ver Anuncio
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // No mostrar nada cuando hay conversiones normales disponibles
  return null;
}