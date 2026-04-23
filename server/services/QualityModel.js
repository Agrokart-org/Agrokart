const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

/**
 * Quality Model (Weighted KNN)
 * Implements a custom K-Nearest Neighbors algorithm for offline regression.
 * Strict Constraint: Zero external API dependencies, lightweight.
 */
class QualityModel {
  constructor() {
    this.dataset = [];
    this.isTrained = false;
    this.k = 3; // Number of neighbors
  }

  /**
   * Loads the CSV dataset into memory
   */
  async trainModel() {
    try {
      console.log("Loading Training Dataset...");
      const csvPath = path.join(
        __dirname,
        "../data/knowledgeBase/training_dataset.csv",
      );

      // Check if file exists, if not create dummy for now (Safety)
      if (!fs.existsSync(csvPath)) {
        console.warn("Training dataset missing. ML Validation disabled.");
        return;
      }

      const fileContent = fs.readFileSync(csvPath, "utf8");

      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });

      // Normalize and store features
      this.dataset = records.map((row) => ({
        features: [
          parseFloat(row.ph),
          parseFloat(row.nitrogen),
          parseFloat(row.phosphorus),
          parseFloat(row.potassium),
          parseFloat(row.organic_carbon),
        ],
        label: parseFloat(row.dosage_kg_ha),
      }));

      this.isTrained = true;
      console.log(`Quality Model Trained (KNN, n=${this.dataset.length}).`);
    } catch (error) {
      console.error("Failed to load Quality Model data:", error);
    }
  }

  /**
   * Validates the Expert System's recommendation using KNN
   * @param {Object} soilData
   * @param {number} expertTotalDosage
   * @returns {Object} { isConsistent: boolean, deviation: number }
   */
  validate(soilData, expertTotalDosage) {
    if (!this.isTrained || this.dataset.length < this.k) {
      return { isConsistent: true, message: "ML Model not active" };
    }

    const inputFeatures = [
      soilData.ph,
      soilData.nitrogen,
      soilData.phosphorus,
      soilData.potassium,
      soilData.organic_carbon || 0.5,
    ];

    // 1. Calculate Distances
    const neighbors = this.dataset.map((point) => ({
      dist: this.euclideanDistance(inputFeatures, point.features),
      label: point.label,
    }));

    // 2. Sort by Distance
    neighbors.sort((a, b) => a.dist - b.dist);

    // 3. Average of Top K
    const kNeighbors = neighbors.slice(0, this.k);
    const predictedDosage =
      kNeighbors.reduce((sum, n) => sum + n.label, 0) / this.k;

    // 4. Calculate Deviation
    const safeDosage = expertTotalDosage === 0 ? 1 : expertTotalDosage;
    const deviation =
      Math.abs((predictedDosage - expertTotalDosage) / safeDosage) * 100;

    console.log(
      `ML Validation (KNN): Expert=${expertTotalDosage}kg, ML=${predictedDosage.toFixed(1)}kg, Deviation=${deviation.toFixed(1)}%`,
    );

    if (deviation > 50) {
      return {
        isConsistent: false,
        deviation: deviation,
        message: `Dosage appears unusual for this soil profile.`,
      };
    }

    return { isConsistent: true };
  }

  euclideanDistance(a, b) {
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0),
    );
  }
}

module.exports = new QualityModel();
