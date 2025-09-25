import { useState, useEffect } from 'react';
import { Play, X, Clock, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackRewardedVideoStart, trackRewardedVideoComplete } from '../utils/analytics';

interface RewardedVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoWatched: () => void;
  remainingAdWatches: number;
}

export default function RewardedVideoModal({
  isOpen,
  onClose,
  onVideoWatched,
  remainingAdWatches
}: RewardedVideoModalProps) {
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isWatchingAd && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (isWatchingAd && countdown === 0) {
      // Video completed
      setIsWatchingAd(false);
      setCountdown(30);

      // Track completion
      trackRewardedVideoComplete();

      onVideoWatched();
      onClose();
    }

    return () => clearTimeout(timer);
  }, [isWatchingAd, countdown, onVideoWatched, onClose]);

  const handleWatchAd = () => {
    setIsWatchingAd(true);
    setCountdown(30);

    // Track analytics
    trackRewardedVideoStart();

    // Here you would integrate with actual ad service (Google AdMob, etc.)
    // For demo, we're using a countdown
  };

  const handleSkipAd = () => {
    if (countdown <= 5) { // Allow skip after 25 seconds
      setIsWatchingAd(false);
      setCountdown(30);

      // Track completion
      trackRewardedVideoComplete();

      onVideoWatched();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && !isWatchingAd && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            {!isWatchingAd ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                      <Gift className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        ¡Has agotado tus conversiones!
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        3 conversiones gratuitas usadas hoy
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Options */}
                <div className="space-y-4">
                  {/* Watch Ad Option */}
                  {remainingAdWatches > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleWatchAd}
                      className="w-full p-4 border-2 border-orange-200 dark:border-orange-700 rounded-xl hover:border-orange-300 dark:hover:border-orange-600 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white">
                          <Play className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
                            Ver video (30s) = +1 conversión
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {remainingAdWatches} videos restantes hoy
                          </p>
                        </div>
                        <Clock className="w-5 h-5 text-gray-400 group-hover:text-orange-500" />
                      </div>
                    </motion.button>
                  )}

                  {remainingAdWatches === 0 && (
                    <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Has visto todos los anuncios disponibles por hoy.
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Los anuncios se reinician cada 24 horas.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
                  Los límites se reinician cada 24 horas
                </p>
              </>
            ) : (
              /* Ad Playing State */
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-red-600" />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Reproduciendo anuncio...
                </h3>

                <div className="text-3xl font-bold text-red-600 mb-4">
                  {countdown}s
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
                  <div
                    className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((30 - countdown) / 30) * 100}%` }}
                  />
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  ¡Gracias por ver el anuncio! Obtendrás 1 conversión extra.
                </p>

                {countdown <= 5 && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleSkipAd}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Saltar anuncio
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}