/**
 * SettingsService - Manages company branding, logo, and white-labeling configurations
 */

let branding = {
  companyName: 'flex_analytics',
  subtitle: 'Business Intelligence & Multi-Dimensional Pivot',
  logoUrl: null, // base64 or URL
  primaryColor: '#2563eb'
};

class SettingsService {
  static getBranding() {
    return branding;
  }

  static updateBranding(newConfig = {}) {
    branding = {
      ...branding,
      ...newConfig
    };
    return branding;
  }
}

module.exports = SettingsService;
