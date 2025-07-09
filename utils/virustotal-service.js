const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * VirusTotal API integration for file scanning
 */
class VirusTotalService {
  constructor() {
    this.baseUrl = 'https://www.virustotal.com/api/v3';
    this.apiKey = null;
    this.enabled = false;
    this.settings = {
      enabled: false,
      apiKey: '',
      autoScan: false,
      scanOnDownload: true,
      scanOnUpload: false,
      maxFileSize: 32 // MB
    };
  }

  /**
   * Initialize VirusTotal service with settings
   */
  async initialize(settings) {
    this.settings = { ...this.settings, ...settings };
    this.apiKey = this.settings.apiKey;
    this.enabled = this.settings.enabled && this.apiKey;
    
    if (this.enabled) {
      // Validate API key
      const isValid = await this.validateApiKey();
      if (!isValid) {
        this.enabled = false;
        throw new Error('Invalid VirusTotal API key');
      }
    }
  }

  /**
   * Validate API key with VirusTotal
   */
  async validateApiKey() {
    if (!this.apiKey) return false;

    try {
      const response = await axios.get(`${this.baseUrl}/users/me`, {
        headers: {
          'X-Apikey': this.apiKey
        },
        timeout: 10000
      });

      return response.status === 200;
    } catch (error) {
      console.error('VirusTotal API key validation failed:', error.message);
      return false;
    }
  }

  /**
   * Get user information from VirusTotal
   */
  async getUserInfo() {
    if (!this.enabled) return null;

    try {
      const response = await axios.get(`${this.baseUrl}/users/me`, {
        headers: {
          'X-Apikey': this.apiKey
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get VirusTotal user info:', error.message);
      return null;
    }
  }

  /**
   * Upload file to VirusTotal for scanning
   */
  async uploadFile(filePath) {
    if (!this.enabled) {
      throw new Error('VirusTotal service is not enabled');
    }

    try {
      // Check file size
      const stats = fs.statSync(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      if (fileSizeInMB > this.settings.maxFileSize) {
        throw new Error(`File size (${fileSizeInMB.toFixed(2)}MB) exceeds maximum allowed size (${this.settings.maxFileSize}MB)`);
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));

      // Upload file
      const response = await axios.post(`${this.baseUrl}/files`, formData, {
        headers: {
          'X-Apikey': this.apiKey,
          ...formData.getHeaders()
        },
        timeout: 30000, // 30 seconds timeout for file upload
        maxContentLength: this.settings.maxFileSize * 1024 * 1024,
        maxBodyLength: this.settings.maxFileSize * 1024 * 1024
      });

      return {
        success: true,
        data: response.data,
        scanId: response.data.data.id
      };
    } catch (error) {
      console.error('VirusTotal file upload failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get scan results by file hash
   */
  async getScanResults(fileHash) {
    if (!this.enabled) {
      throw new Error('VirusTotal service is not enabled');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/files/${fileHash}`, {
        headers: {
          'X-Apikey': this.apiKey
        },
        timeout: 10000
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return {
          success: false,
          error: 'File not found in VirusTotal database'
        };
      }
      
      console.error('VirusTotal scan results failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get analysis results by analysis ID
   */
  async getAnalysisResults(analysisId) {
    if (!this.enabled) {
      throw new Error('VirusTotal service is not enabled');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/analyses/${analysisId}`, {
        headers: {
          'X-Apikey': this.apiKey
        },
        timeout: 10000
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('VirusTotal analysis results failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Scan file by hash (without uploading)
   */
  async scanByHash(fileHash) {
    if (!this.enabled) {
      throw new Error('VirusTotal service is not enabled');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/files/${fileHash}`, {
        headers: {
          'X-Apikey': this.apiKey
        },
        timeout: 10000
      });

      const data = response.data;
      
      // Parse scan results
      const scanResults = {
        scanned: true,
        scanDate: data.data.attributes.last_analysis_date,
        positives: data.data.attributes.last_analysis_stats.malicious,
        total: Object.keys(data.data.attributes.last_analysis_results).length,
        results: data.data.attributes.last_analysis_results,
        permalink: `https://www.virustotal.com/gui/file/${fileHash}`
      };

      return {
        success: true,
        data: scanResults
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return {
          success: false,
          error: 'File not found in VirusTotal database',
          requiresUpload: true
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate file hash (SHA256)
   */
  calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => {
        hash.update(data);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Scan file (tries hash lookup first, then uploads if necessary)
   */
  async scanFile(filePath) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'VirusTotal service is not enabled'
      };
    }

    try {
      // Calculate file hash
      const fileHash = await this.calculateFileHash(filePath);
      
      // Try to get existing scan results
      const hashResult = await this.scanByHash(fileHash);
      
      if (hashResult.success) {
        return hashResult;
      }

      // If file not found and upload is required, upload it
      if (hashResult.requiresUpload) {
        const uploadResult = await this.uploadFile(filePath);
        
        if (uploadResult.success) {
          return {
            success: true,
            data: {
              scanned: false,
              scanId: uploadResult.scanId,
              message: 'File uploaded for scanning. Results will be available shortly.',
              permalink: `https://www.virustotal.com/gui/file-analysis/${uploadResult.scanId}`
            }
          };
        } else {
          return uploadResult;
        }
      }

      return hashResult;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  async updateSettings(newSettings) {
    const oldSettings = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };

    // Re-initialize if API key or enabled status changed
    if (this.settings.apiKey !== oldSettings.apiKey || this.settings.enabled !== oldSettings.enabled) {
      try {
        await this.initialize(this.settings);
      } catch (error) {
        // Revert settings if initialization failed
        this.settings = oldSettings;
        throw error;
      }
    }

    return {
      success: true,
      data: this.settings
    };
  }

  /**
   * Check if service is enabled and ready
   */
  isEnabled() {
    return this.enabled && this.apiKey;
  }
}

module.exports = VirusTotalService;
