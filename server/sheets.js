const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

class SheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = process.env.SPREADSHEET_ID;
  }

  async init() {
    try {
      const credentialsPath = path.join(__dirname, process.env.GOOGLE_SHEETS_CREDENTIALS || 'credentials.json');
      
      if (!fs.existsSync(credentialsPath)) {
        console.warn(`Credentials file not found at ${credentialsPath}. Sheets API will not work until this is provided.`);
        return;
      }

      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: SCOPES,
      });

      const client = await auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: client });
      console.log('Google Sheets API initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize Google Sheets API:', error);
    }
  }

  async getRows(range) {
    if (!this.sheets) throw new Error('Sheets API not initialized');
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
      });
      return response.data.values || [];
    } catch (error) {
      console.error(`Error fetching rows for range ${range}:`, error);
      throw error;
    }
  }

  async appendRow(range, values) {
    if (!this.sheets) throw new Error('Sheets API not initialized');
    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
      });
      return response.data;
    } catch (error) {
      console.error(`Error appending row to range ${range}:`, error);
      throw error;
    }
  }

  async updateRow(range, values) {
    if (!this.sheets) throw new Error('Sheets API not initialized');
    try {
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating row in range ${range}:`, error);
      throw error;
    }
  }
}

module.exports = new SheetsService();
