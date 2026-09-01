const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const mlBaseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const mlClient = {
  normalize: async (description) => {
    try {
      const response = await axios.post(`${mlBaseUrl}/normalize`, { description });
      return response.data;
    } catch (err) {
      console.error('ML normalize service error:', err.message);
      throw err;
    }
  },
  
  extract: async (description) => {
    try {
      const response = await axios.post(`${mlBaseUrl}/extract`, { description });
      return response.data;
    } catch (err) {
      console.error('ML extract service error:', err.message);
      throw err;
    }
  },

  embed: async (text) => {
    try {
      const response = await axios.post(`${mlBaseUrl}/embed`, { text });
      return response.data;
    } catch (err) {
      console.error('ML embed service error:', err.message);
      throw err;
    }
  },

  match: async (materialA, materialB) => {
    try {
      const response = await axios.post(`${mlBaseUrl}/match`, { material_a: materialA, material_b: materialB });
      return response.data;
    } catch (err) {
      console.error('ML match service error:', err.message);
      throw err;
    }
  },

  runPipeline: async (materials) => {
    try {
      const response = await axios.post(`${mlBaseUrl}/pipeline/run`, materials);
      return response.data;
    } catch (err) {
      console.error('ML pipeline run error:', err.message);
      throw err;
    }
  },

  cluster: async (materials, approvedMatches) => {
    try {
      const response = await axios.post(`${mlBaseUrl}/pipeline/cluster`, { materials, approved_matches: approvedMatches });
      return response.data;
    } catch (err) {
      console.error('ML clustering error:', err.message);
      throw err;
    }
  }
};

module.exports = mlClient;
