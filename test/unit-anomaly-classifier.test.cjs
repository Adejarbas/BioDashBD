const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
require('./setup-ts.cjs');

const { classifySensorReading } = require('@/lib/anomaly-classifier');

describe('Unit: Classificador de Anomalias e Leituras de Sensores IoT', () => {
  test('classifica temperatura em todas as faixas operacionais e de risco', () => {
    const normal = classifySensorReading('temperatura', 36.2);
    assert.equal(normal.isAnomaly, false);
    assert.equal(normal.alertLevel, 'info');
    assert.equal(normal.suggestedPriority, 'low');
    assert.equal(normal.unit, '°C');
    assert.equal(normal.label, 'Normal');

    const lowHigh = classifySensorReading('temp_digestor', 38.0);
    assert.equal(lowHigh.isAnomaly, true);
    assert.equal(lowHigh.alertLevel, 'low');
    assert.equal(lowHigh.suggestedPriority, 'medium');
    assert.equal(lowHigh.threshold, 37.5);

    const lowCold = classifySensorReading('temperatura', 33.8);
    assert.equal(lowCold.isAnomaly, true);
    assert.equal(lowCold.alertLevel, 'low');
    assert.equal(lowCold.threshold, 34.5);

    const mediumHot = classifySensorReading('temperatura', 39.2);
    assert.equal(mediumHot.isAnomaly, true);
    assert.equal(mediumHot.alertLevel, 'medium');
    assert.equal(mediumHot.suggestedPriority, 'high');
    assert.equal(mediumHot.threshold, 38.5);

    const mediumCold = classifySensorReading('temperatura', 31.8);
    assert.equal(mediumCold.isAnomaly, true);
    assert.equal(mediumCold.alertLevel, 'medium');
    assert.equal(mediumCold.threshold, 33.0);

    const criticalHot = classifySensorReading('TEMPERATURA', 42.5);
    assert.equal(criticalHot.isAnomaly, true);
    assert.equal(criticalHot.alertLevel, 'critical');
    assert.equal(criticalHot.suggestedPriority, 'urgent');
    assert.equal(criticalHot.threshold, 40.0);

    const criticalCold = classifySensorReading('temperatura', 29.4);
    assert.equal(criticalCold.isAnomaly, true);
    assert.equal(criticalCold.alertLevel, 'critical');
    assert.equal(criticalCold.suggestedPriority, 'urgent');
    assert.equal(criticalCold.threshold, 31.0);
  });

  test('classifica pressão em todas as faixas (normal, atenção, médio e crítico)', () => {
    const normal = classifySensorReading('pressao', 1.45);
    assert.equal(normal.isAnomaly, false);
    assert.equal(normal.alertLevel, 'info');
    assert.equal(normal.unit, 'bar');

    const lowDeviationHigh = classifySensorReading('pressao_interna', 1.68);
    assert.equal(lowDeviationHigh.isAnomaly, true);
    assert.equal(lowDeviationHigh.alertLevel, 'low');
    assert.equal(lowDeviationHigh.threshold, 1.60);

    const lowDeviationDrop = classifySensorReading('pressao', 1.15);
    assert.equal(lowDeviationDrop.isAnomaly, true);
    assert.equal(lowDeviationDrop.alertLevel, 'low');
    assert.equal(lowDeviationDrop.threshold, 1.20);

    const mediumHigh = classifySensorReading('pressao', 1.82);
    assert.equal(mediumHigh.isAnomaly, true);
    assert.equal(mediumHigh.alertLevel, 'medium');
    assert.equal(mediumHigh.suggestedPriority, 'high');
    assert.equal(mediumHigh.threshold, 1.75);

    const mediumLow = classifySensorReading('pressao', 0.98);
    assert.equal(mediumLow.isAnomaly, true);
    assert.equal(mediumLow.alertLevel, 'medium');
    assert.equal(mediumLow.threshold, 1.10);

    const criticalOverpressure = classifySensorReading('pressao', 2.05);
    assert.equal(criticalOverpressure.isAnomaly, true);
    assert.equal(criticalOverpressure.alertLevel, 'critical');
    assert.equal(criticalOverpressure.suggestedPriority, 'urgent');
    assert.equal(criticalOverpressure.threshold, 1.90);

    const criticalLeak = classifySensorReading('pressao', 0.75);
    assert.equal(criticalLeak.isAnomaly, true);
    assert.equal(criticalLeak.alertLevel, 'critical');
    assert.equal(criticalLeak.threshold, 0.90);
  });

  test('classifica pH para detecção de acidificação, alcalinização e faixa ideal', () => {
    const normal = classifySensorReading('ph', 7.1);
    assert.equal(normal.isAnomaly, false);
    assert.equal(normal.alertLevel, 'info');
    assert.equal(normal.unit, 'pH');

    const lowAcid = classifySensorReading('sensor_ph', 6.6);
    assert.equal(lowAcid.isAnomaly, true);
    assert.equal(lowAcid.alertLevel, 'low');
    assert.equal(lowAcid.threshold, 6.8);

    const lowAlkaline = classifySensorReading('ph', 7.6);
    assert.equal(lowAlkaline.isAnomaly, true);
    assert.equal(lowAlkaline.alertLevel, 'low');
    assert.equal(lowAlkaline.threshold, 7.4);

    const mediumAcid = classifySensorReading('ph', 6.3);
    assert.equal(mediumAcid.isAnomaly, true);
    assert.equal(mediumAcid.alertLevel, 'medium');
    assert.equal(mediumAcid.threshold, 6.5);

    const mediumAlkaline = classifySensorReading('ph', 7.9);
    assert.equal(mediumAlkaline.isAnomaly, true);
    assert.equal(mediumAlkaline.alertLevel, 'medium');
    assert.equal(mediumAlkaline.threshold, 7.7);

    const criticalAcid = classifySensorReading('ph', 5.8);
    assert.equal(criticalAcid.isAnomaly, true);
    assert.equal(criticalAcid.alertLevel, 'critical');
    assert.equal(criticalAcid.suggestedPriority, 'urgent');
    assert.equal(criticalAcid.threshold, 6.2);

    const criticalAlkaline = classifySensorReading('ph', 8.4);
    assert.equal(criticalAlkaline.isAnomaly, true);
    assert.equal(criticalAlkaline.alertLevel, 'critical');
    assert.equal(criticalAlkaline.threshold, 8.0);
  });

  test('classifica concentração de H2S (ppm) e aplica fallback para sensores desconhecidos', () => {
    const normalH2s = classifySensorReading('h2s', 120);
    assert.equal(normalH2s.isAnomaly, false);
    assert.equal(normalH2s.alertLevel, 'info');
    assert.equal(normalH2s.unit, 'ppm');

    const lowH2s = classifySensorReading('gas_h2s', 280);
    assert.equal(lowH2s.isAnomaly, true);
    assert.equal(lowH2s.alertLevel, 'low');
    assert.equal(lowH2s.threshold, 200);

    const mediumH2s = classifySensorReading('h2s', 550);
    assert.equal(mediumH2s.isAnomaly, true);
    assert.equal(mediumH2s.alertLevel, 'medium');
    assert.equal(mediumH2s.suggestedPriority, 'high');
    assert.equal(mediumH2s.threshold, 400);

    const criticalH2s = classifySensorReading('h2s', 820);
    assert.equal(criticalH2s.isAnomaly, true);
    assert.equal(criticalH2s.alertLevel, 'critical');
    assert.equal(criticalH2s.suggestedPriority, 'urgent');
    assert.equal(criticalH2s.threshold, 700);

    const fallback = classifySensorReading('vazao_biogas', 150);
    assert.equal(fallback.isAnomaly, false);
    assert.equal(fallback.alertLevel, 'info');
    assert.equal(fallback.label, 'Informativo');
    assert.match(fallback.description, /150/);
  });
});
