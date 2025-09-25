import { motion } from 'framer-motion';
import GoogleAd from './GoogleAd';

interface AdBannerProps {
  position: 'header' | 'sidebar' | 'footer' | 'between-tools';
  className?: string;
}

export default function AdBanner({ position, className = '' }: AdBannerProps) {
  // Configuraciones diferentes para cada posición
  const adConfigs = {
    header: {
      adSlot: 'HEADER_AD_SLOT', // Reemplazar con tu slot real
      style: { display: 'block', width: '728px', height: '90px' },
      adFormat: 'horizontal' as const
    },
    sidebar: {
      adSlot: 'SIDEBAR_AD_SLOT', // Reemplazar con tu slot real
      style: { display: 'block', width: '300px', height: '250px' },
      adFormat: 'rectangle' as const
    },
    footer: {
      adSlot: 'FOOTER_AD_SLOT', // Reemplazar con tu slot real
      style: { display: 'block', width: '728px', height: '90px' },
      adFormat: 'horizontal' as const
    },
    'between-tools': {
      adSlot: 'TOOLS_AD_SLOT', // Reemplazar con tu slot real
      style: { display: 'block', width: '320px', height: '100px' },
      adFormat: 'auto' as const
    }
  };

  const config = adConfigs[position];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`ad-banner ad-banner-${position} ${className}`}
    >
      <div className="flex justify-center items-center">
        <div className="relative">
          {/* Label opcional para debugging */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute -top-4 left-0 text-xs text-gray-400 uppercase tracking-wide">
              Ad - {position}
            </div>
          )}

          <GoogleAd
            adSlot={config.adSlot}
            adFormat={config.adFormat}
            style={config.style}
            className="mx-auto"
          />
        </div>
      </div>
    </motion.div>
  );
}