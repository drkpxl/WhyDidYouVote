// src/middleware/ipCheck.js
export async function checkIpLocation(req) {
    try {
      // Development environment check
      if (process.env.NODE_ENV === 'development' || 
          process.env.NODE_ENV !== 'production') {
        console.log('Development environment detected, allowing access');
        return true;
      }
  
      // In production, use Cloudflare's country code header
      const countryCode = req.headers['cf-ipcountry'];
      console.log('Cloudflare country code:', countryCode);
  
      if (!countryCode) {
        console.warn('No CF-IPCountry header found - ensure this is running behind Cloudflare');
        return false;
      }
  
      return countryCode === 'US';
  
    } catch (error) {
      console.error('Error checking location:', error);
      return false; // In production, fail closed for security
    }
  }