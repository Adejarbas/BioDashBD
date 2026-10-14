export type CriticalityLevel = 'info' | 'low' | 'medium' | 'critical';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type SensorType = 'temperatura' | 'pressao' | 'ph' | 'h2s' | 'biogas' | string;

export interface ClassificationResult {
  isAnomaly: boolean;
  alertLevel: CriticalityLevel;
  suggestedPriority: MaintenancePriority;
  threshold: number;
  unit: string;
  label: string;
  description: string;
}

/**
 * Classifica uma leitura de sensor determinando seu nível de criticidade
 * e prioridade de intervenção/manutenção de acordo com regras operacionais.
 */
export function classifySensorReading(sensorType: SensorType, value: number): ClassificationResult {
  const normType = (sensorType || '').toLowerCase().trim();
  const numValue = Number(value);

  // 1. TEMPERATURA (°C)
  if (normType.includes('temp') || normType === 'temperatura') {
    const unit = '°C';
    if (numValue > 40.0) {
      return {
        isAnomaly: true,
        alertLevel: 'critical',
        suggestedPriority: 'urgent',
        threshold: 40.0,
        unit,
        label: 'Crítico',
        description: `Temperatura perigosa de ${numValue.toFixed(1)}°C detectada. Risco imediato ao processo biológico e pressão interna.`,
      };
    }
    if (numValue < 31.0) {
      return {
        isAnomaly: true,
        alertLevel: 'critical',
        suggestedPriority: 'urgent',
        threshold: 31.0,
        unit,
        label: 'Crítico',
        description: `Queda severa de temperatura (${numValue.toFixed(1)}°C). Risco de choque térmico e inibição das bactérias metanogênicas.`,
      };
    }
    if (numValue > 38.5) {
      return {
        isAnomaly: true,
        alertLevel: 'medium',
        suggestedPriority: 'high',
        threshold: 38.5,
        unit,
        label: 'Alerta Médio',
        description: `Temperatura acima do limite seguro (${numValue.toFixed(1)}°C). Necessário acionar resfriamento ou ventilação.`,
      };
    }
    if (numValue < 33.0) {
      return {
        isAnomaly: true,
        alertLevel: 'medium',
        suggestedPriority: 'high',
        threshold: 33.0,
        unit,
        label: 'Alerta Médio',
        description: `Temperatura abaixo da faixa ideal (${numValue.toFixed(1)}°C). Verifique o isolamento térmico do digestor.`,
      };
    }
    if (numValue > 37.5 || numValue < 34.5) {
      return {
        isAnomaly: true,
        alertLevel: 'low',
        suggestedPriority: 'medium',
        threshold: numValue > 37.5 ? 37.5 : 34.5,
        unit,
        label: 'Atenção',
        description: `Temperatura em leve oscilação (${numValue.toFixed(1)}°C). Mantenha monitoramento preventivo.`,
      };
    }
    return {
      isAnomaly: false,
      alertLevel: 'info',
      suggestedPriority: 'low',
      threshold: 37.0,
      unit,
      label: 'Normal',
      description: `Temperatura operacional estável (${numValue.toFixed(1)}°C).`,
    };
  }

  // 2. PRESSÃO (bar)
  if (normType.includes('press') || normType === 'pressao') {
    const unit = 'bar';
    if (numValue > 1.90) {
      return {
        isAnomaly: true,
        alertLevel: 'critical',
        suggestedPriority: 'urgent',
        threshold: 1.90,
        unit,
        label: 'Crítico',
        description: `Sobrepressão crítica de ${numValue.toFixed(2)} bar. Risco grave de ruptura de gasômetro ou válvulas de alívio.`,
      };
    }
    if (numValue < 0.90) {
      return {
        isAnomaly: true,
        alertLevel: 'critical',
        suggestedPriority: 'urgent',
        threshold: 0.90,
        unit,
        label: 'Crítico',
        description: `Queda drástica de pressão (${numValue.toFixed(2)} bar). Suspeita de vazamento severo de biogás na linha principal.`,
      };
    }
    if (numValue > 1.75) {
      return {
        isAnomaly: true,
        alertLevel: 'medium',
        suggestedPriority: 'high',
        threshold: 1.75,
        unit,
        label: 'Alerta Médio',
        description: `Pressão elevada (${numValue.toFixed(2)} bar). Recomenda-se alívio gradual ou aumento da queima/geração.`,
      };
    }
    if (numValue < 1.10) {
      return {
        isAnomaly: true,
        alertLevel: 'medium',
        suggestedPriority: 'high',
        threshold: 1.10,
        unit,
        label: 'Alerta Médio',
        description: `Baixa pressão (${numValue.toFixed(2)} bar). Produção abaixo do normal ou microvazamento detectado.`,
      };
    }
    if (numValue > 1.60 || numValue < 1.20) {
      return {
        isAnomaly: true,
        alertLevel: 'low',
        suggestedPriority: 'medium',
        threshold: numValue > 1.60 ? 1.60 : 1.20,
        unit,
        label: 'Atenção',
        description: `Pressão com leve desvio operacional (${numValue.toFixed(2)} bar).`,
      };
    }
    return {
      isAnomaly: false,
      alertLevel: 'info',
      suggestedPriority: 'low',
      threshold: 1.50,
      unit,
      label: 'Normal',
      description: `Pressão operacional estável (${numValue.toFixed(2)} bar).`,
    };
  }

  // 3. pH
  if (normType === 'ph' || normType.includes('ph')) {
    const unit = 'pH';
    if (numValue < 6.2) {
      return {
        isAnomaly: true,
        alertLevel: 'critical',
        suggestedPriority: 'urgent',
        threshold: 6.2,
        unit,
        label: 'Crítico',
        description: `Acidificação severa detectada (${numValue.toFixed(1)} pH). Risco iminente de colapso da digestão anaeróbia.`,
      };
    }
    if (numValue > 8.0) {
      return {
        isAnomaly: true,
        alertLevel: 'critical',
        suggestedPriority: 'urgent',
        threshold: 8.0,
        unit,
        label: 'Crítico',
        description: `Alcalinização excessiva (${numValue.toFixed(1)} pH). Risco de toxicidade por amônia no reator.`,
      };
    }
    if (numValue < 6.5) {
      return {
        isAnomaly: true,
        alertLevel: 'medium',
        suggestedPriority: 'high',
        threshold: 6.5,
        unit,
        label: 'Alerta Médio',
        description: `pH em queda (${numValue.toFixed(1)} pH). Interrompa alimentação ácida e monitore alcalinidade.`,
      };
    }
    if (numValue > 7.7) {
      return {
        isAnomaly: true,
        alertLevel: 'medium',
        suggestedPriority: 'high',
        threshold: 7.7,
        unit,
        label: 'Alerta Médio',
        description: `pH elevado (${numValue.toFixed(1)} pH). Ajuste a taxa de carga orgânica.`,
      };
    }
    if (numValue < 6.8 || numValue > 7.4) {
      return {
        isAnomaly: true,
        alertLevel: 'low',
        suggestedPriority: 'medium',
        threshold: numValue < 6.8 ? 6.8 : 7.4,
        unit,
        label: 'Atenção',
        description: `pH oscilando levemente (${numValue.toFixed(1)} pH). Faixa ideal: 6.8 a 7.4.`,
      };
    }
    return {
      isAnomaly: false,
      alertLevel: 'info',
      suggestedPriority: 'low',
      threshold: 7.1,
      unit,
      label: 'Normal',
      description: `pH ideal para metanogênese (${numValue.toFixed(1)} pH).`,
    };
  }

  // 4. H2S (ppm)
  if (normType.includes('h2s')) {
    const unit = 'ppm';
    if (numValue > 700) {
      return {
        isAnomaly: true,
        alertLevel: 'critical',
        suggestedPriority: 'urgent',
        threshold: 700,
        unit,
        label: 'Crítico',
        description: `Nível perigoso de H2S (${numValue} ppm). Risco extremo de corrosão nos geradores e perigo à saúde.`,
      };
    }
    if (numValue > 400) {
      return {
        isAnomaly: true,
        alertLevel: 'medium',
        suggestedPriority: 'high',
        threshold: 400,
        unit,
        label: 'Alerta Médio',
        description: `Concentração de H2S elevada (${numValue} ppm). Filtro biológico ou químico precisa de regeneração.`,
      };
    }
    if (numValue > 200) {
      return {
        isAnomaly: true,
        alertLevel: 'low',
        suggestedPriority: 'medium',
        threshold: 200,
        unit,
        label: 'Atenção',
        description: `H2S moderado (${numValue} ppm). Monitore a capacidade de desulfurização.`,
      };
    }
    return {
      isAnomaly: false,
      alertLevel: 'info',
      suggestedPriority: 'low',
      threshold: 150,
      unit,
      label: 'Normal',
      description: `H2S dentro da faixa segura (${numValue} ppm).`,
    };
  }

  // Fallback padrão
  return {
    isAnomaly: false,
    alertLevel: 'info',
    suggestedPriority: 'low',
    threshold: 0,
    unit: '',
    label: 'Informativo',
    description: `Leitura registrada: ${numValue}`,
  };
}
