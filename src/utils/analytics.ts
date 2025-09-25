// Google Analytics 4 utilities
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// Track conversion events
export const trackConversionStarted = (inputFormat: string, outputFormat: string, tool: string) => {
  trackEvent('conversion_started', {
    input_format: inputFormat,
    output_format: outputFormat,
    tool_name: tool,
    event_category: 'conversions'
  });
};

export const trackConversionCompleted = (inputFormat: string, outputFormat: string, tool: string, duration: number) => {
  trackEvent('conversion_completed', {
    input_format: inputFormat,
    output_format: outputFormat,
    tool_name: tool,
    duration_seconds: Math.round(duration / 1000),
    event_category: 'conversions',
    value: 1
  });
};

export const trackConversionError = (inputFormat: string, outputFormat: string, tool: string, error: string) => {
  trackEvent('conversion_error', {
    input_format: inputFormat,
    output_format: outputFormat,
    tool_name: tool,
    error_message: error,
    event_category: 'errors'
  });
};

// Track user engagement
export const trackToolSelection = (toolName: string, category: string) => {
  trackEvent('tool_selected', {
    tool_name: toolName,
    tool_category: category,
    event_category: 'engagement'
  });
};

export const trackFileUploaded = (fileType: string, fileSize: number) => {
  trackEvent('file_uploaded', {
    file_type: fileType,
    file_size_mb: Math.round(fileSize / (1024 * 1024) * 100) / 100,
    event_category: 'uploads'
  });
};

export const trackDarkModeToggle = (mode: 'dark' | 'light') => {
  trackEvent('dark_mode_toggle', {
    theme: mode,
    event_category: 'ui_interaction'
  });
};

// Track monetization events
export const trackAdClick = (adPosition: string) => {
  trackEvent('ad_click', {
    ad_position: adPosition,
    event_category: 'monetization',
    value: 1
  });
};

export const trackAdImpression = (adPosition: string, adSlot: string) => {
  trackEvent('ad_impression', {
    ad_position: adPosition,
    ad_slot: adSlot,
    event_category: 'monetization'
  });
};

export const trackRewardedVideoStart = () => {
  trackEvent('rewarded_video_start', {
    event_category: 'monetization'
  });
};

export const trackRewardedVideoComplete = () => {
  trackEvent('rewarded_video_complete', {
    event_category: 'monetization',
    value: 1
  });
};

export const trackRewardedVideoSkip = (secondsWatched: number) => {
  trackEvent('rewarded_video_skip', {
    seconds_watched: secondsWatched,
    event_category: 'monetization'
  });
};

export const trackPremiumInterest = (feature: string) => {
  trackEvent('premium_interest', {
    feature: feature,
    event_category: 'monetization'
  });
};

// Track page views
export const trackPageView = (pageName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_title: pageName,
      page_location: window.location.href
    });
  }
};

// Custom events for business intelligence
export const trackPopularityMetrics = (toolId: string, category: string) => {
  trackEvent('tool_popularity', {
    tool_id: toolId,
    category: category,
    timestamp: Date.now(),
    event_category: 'analytics'
  });
};