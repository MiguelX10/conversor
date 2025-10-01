import { useState } from 'react';
import { Crown, X, Check, Zap, Infinity, Shield, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: 'conversions_exhausted' | 'premium_feature' | 'manual';
}

export default function PremiumModal({ isOpen, onClose, trigger }: PremiumModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');


  const plans = {
    monthly: {
      price: '$7.99',
      period: 'mes',
      savings: null
    },
    yearly: {
      price: '$79.99',
      period: 'año',
      savings: 'Ahorra $16 (17%)'
    }
  };

  const features = [
    { icon: Infinity, text: 'Conversiones ilimitadas', highlight: true },
    { icon: Zap, text: 'Conversión 3x más rápida', highlight: true },
    { icon: Shield, text: 'Sin anuncios', highlight: false },
    { icon: Crown, text: 'Herramientas avanzadas', highlight: false },
    { icon: Star, text: 'Soporte prioritario', highlight: false },
    { icon: Check, text: 'Formatos premium', highlight: false }
  ];

  const getTriggerContent = () => {
    switch (trigger) {
      case 'conversions_exhausted':
        return {
          title: '¡Conversiones agotadas!',
          subtitle: 'Actualiza a Premium para conversiones ilimitadas',
          highlight: 'Sin límites diarios'
        };
      case 'premium_feature':
        return {
          title: 'Función Premium',
          subtitle: 'Esta herramienta está disponible solo para usuarios Premium',
          highlight: 'Desbloquea todas las herramientas'
        };
      default:
        return {
          title: 'Actualiza a Premium',
          subtitle: 'Obtén acceso completo a todas las funciones',
          highlight: 'La mejor experiencia'
        };
    }
  };

  const content = getTriggerContent();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-2 sm:p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm md:max-w-md relative max-h-[90vh] overflow-y-auto mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header con gradiente */}
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 md:p-6 rounded-t-xl relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                <div className="text-center text-white">
                  <Crown className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3" />
                  <h2 className="text-xl md:text-2xl font-bold mb-1">{content.title}</h2>
                  <p className="text-sm md:text-base text-yellow-100">{content.subtitle}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 md:p-6">
                {/* Plan Selector */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4 md:mb-6">
                  <button
                    onClick={() => setSelectedPlan('monthly')}
                    className={`flex-1 py-2 px-2 md:px-4 rounded-md text-sm font-medium transition-colors ${
                      selectedPlan === 'monthly'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Mensual
                  </button>
                  <button
                    onClick={() => setSelectedPlan('yearly')}
                    className={`flex-1 py-2 px-2 md:px-4 rounded-md text-sm font-medium transition-colors relative ${
                      selectedPlan === 'yearly'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Anual
                    {plans.yearly.savings && (
                      <span className="absolute -top-2 -right-1 bg-green-500 text-white text-xs px-1 rounded">
                        -17%
                      </span>
                    )}
                  </button>
                </div>

                {/* Price */}
                <div className="text-center mb-4 md:mb-6">
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {plans[selectedPlan].price}
                    <span className="text-base md:text-lg font-normal text-gray-500">/{plans[selectedPlan].period}</span>
                  </div>
                  {plans[selectedPlan].savings && (
                    <p className="text-green-600 text-sm mt-1">{plans[selectedPlan].savings}</p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 md:gap-3">
                      <div className={`p-1 rounded ${feature.highlight ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
                        <feature.icon className={`w-4 h-4 ${feature.highlight ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`} />
                      </div>
                      <span className={`text-sm ${feature.highlight ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>


                {/* CTA Button */}
                <button
                  onClick={() => {
                    // TODO: Implementar Stripe/PayPal checkout
                    alert('Redirigiendo a checkout...');
                    onClose();
                  }}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-3 md:py-4 px-4 md:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm md:text-base"
                >
                  Actualizar a Premium
                </button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 md:mt-3">
                  Cancela en cualquier momento. Sin compromisos.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}