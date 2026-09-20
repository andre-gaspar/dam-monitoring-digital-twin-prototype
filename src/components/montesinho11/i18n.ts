import type { MonitoringSensorItem } from "./types";

export type MontesinhoLanguage = "pt" | "en";

export function localeForLanguage(language: MontesinhoLanguage) {
  return language === "pt" ? "pt-PT" : "en-GB";
}

export const montesinhoCopy = {
  pt: {
    languageButton: "EN",
    languageAria: "Mudar idioma para inglês",
    close: "Fechar",
    select: "Selecionar",
    data: "Dados",
    rows: "Linhas",
    range: "Intervalo",
    dataQuality: "Qualidade dos dados",
    latest: "Último",
    min: "Mín.",
    avg: "Média",
    max: "Máx.",
    metric: "Métrica",
    datasets: "Conjuntos de dados",
    metricsPlural: "Métricas",
    noFlags: "Sem sinalizações",
    noFlaggedRows: "Sem linhas sinalizadas",
    allRowsOk: "Todas as linhas OK",
    flaggedRows: "linhas sinalizadas",
    timelineRange: "Intervalo da cronologia",
    rowsInCurrentDashboardRange:
      "linhas no intervalo atual do painel de controlo",
    openBottomTimeline: "Abrir cronologia inferior",
    hideCsvVisualizations: "Ocultar visualizações CSV",
    showCsvVisualizations: "Mostrar visualizações CSV",
    loadingDataset: "A carregar",
    noRowsSelectedRange:
      "Não foram encontradas linhas no intervalo selecionado da cronologia.",
    failedToLoadDataset: "Falha ao carregar o conjunto de dados",
    unknownError: "Erro desconhecido",
    noDataForSensor:
      "Não existem dados para este sensor nos conjuntos de dados CSV atuais.",
    csvInstrument: "Instrumento CSV",
    metadata: "Metadados",
    readings: "Leituras",
    rain: {
      hideControls: "Ocultar controlos de chuva",
      showControls: "Mostrar controlos de chuva",
      droneCaptures: "Capturas de drone",
      title: "Teste de chuva",
      stop: "Parar chuva",
      start: "Iniciar chuva",
      hideTiles: "Ocultar classificação",
      showTiles: "Mostrar classificação",
      classification: "Classificação",
      classes: {
        ground: "Terreno",
        vegetationDark: "Vegetação escura",
        vegetationMedium: "Vegetação média",
        vegetationBright: "Vegetação clara",
        buildings: "Edifícios",
        water: "Água",
        bridge: "Ponte",
      },
    },
    sidebar: {
      hideCards: "Ocultar cartões dos sensores",
      showCards: "Mostrar cartões dos sensores",
    },
    timeline: {
      hide: "Ocultar cronologia de monitorização",
      show: "Mostrar cronologia de monitorização",
      title: "Cronologia de monitorização",
      selected: "Selecionado",
      pickStart: "Escolher data inicial do conjunto de dados",
      pickEnd: "Escolher data final do conjunto de dados",
      startDate: "Data inicial do conjunto de dados",
      endDate: "Data final do conjunto de dados",
      previousMonth: "Mês anterior",
      nextMonth: "Mês seguinte",
      closeCalendar: "Fechar calendário",
      datasetStart: "Início do conjunto de dados",
      datasetEnd: "Fim do conjunto de dados",
    },
    playback: {
      title: "Timelapse do nível de água",
      selectRange: "Selecione um intervalo",
      loading: "A carregar",
      currentReadTime: "Hora da leitura atual do sensor",
      noRowSelected: "Nenhuma linha de reprodução selecionada",
      row: "Linha",
      of: "de",
      play: "Reproduzir",
      pause: "Pausa",
      reset: "Repor",
    },
    metrics: {
      cota: "Cota",
      manualCota: "Cota manual",
      nme: "NME",
      npa: "NPA",
      maxLatestPressure: "Pressão máxima mais recente",
      piezometricCota: "Cota piezométrica",
      temperature: "Temperatura",
      porePressure: "Pressão intersticial",
      flow: "Caudal",
      reservoirCota: "Cota da albufeira",
      computedTotal: "Total calculado",
      cleanFlow: "Caudal limpo",
      sourceFlow: "Caudal de origem",
      cleanSum: "Soma limpa",
      humidity: "Humidade",
      precipitation: "Precipitação",
      maxLatestMj: "MJ máximo mais recente",
      maxLatestMeMd: "ME/MD máximo mais recente",
      maxDepth: "Profundidade máxima",
      observations: "Observações",
      maxAbsMj: "MJ absoluto máximo",
      maxAbsMeMd: "ME/MD absoluto máximo",
      depthAtMaxMj: "Profundidade no MJ máximo",
      depthRows: "Linhas de profundidade",
      mjDisplacement: "Deslocamento MJ",
      meMdDisplacement: "Deslocamento ME/MD",
      depth: "Profundidade",
    },
    charts: {
      hourlyReservoirCota: "Cota horária da albufeira",
      nonOkQualityFlags: "Sinalizações de qualidade não OK",
      manualCotaReferences: "Cota manual face aos níveis de referência",
      weatherNotes: "Notas meteorológicas",
      noPiezometerRows:
        "Não foram encontradas leituras de piezómetros no intervalo selecionado.",
      porePressureNaaEmbankment:
        "Pressão intersticial, NAA e cota do aterro",
      loadingPiezometerHistory:
        "A carregar histórico dos piezómetros",
      failedPiezometerHistory:
        "Falha ao carregar o histórico dos piezómetros",
      latestTemperatures: "Temperaturas mais recentes",
      latestPorePressureByInstrument:
        "Pressão intersticial mais recente por instrumento",
      pressureAndCota: "Pressão e cota",
      temperatureHistory: "Histórico de temperatura",
      seepageNoRows:
        "Não foram encontradas linhas de percolação no intervalo selecionado.",
      caudaisPercolados: "Caudais percolados",
      componentFlowReservoirCota:
        "Caudal do componente e cota da albufeira",
      componentStatusOverview: "Resumo do estado dos componentes",
      selectedComponentStatus: "Estado do componente selecionado",
      totalSeepageOverTime: "Percolação total ao longo do tempo",
      temporaryBicaNoRows:
        "Não foram encontradas linhas de bicas no intervalo selecionado.",
      temporaryBicaOverview: "Resumo das bicas temporárias",
      cleanAndSourceFlow: "Caudal limpo e de origem",
      dailyTemperatureHumidity: "Temperatura e humidade diárias",
      dailyPrecipitation: "Precipitação diária",
      eventsBySourceDataset:
        "Eventos por conjunto de dados de origem",
      metricCoverage: "Cobertura de métricas",
      eventTypes: "Tipos de evento",
      latestMaxDisplacementByInclinometer:
        "Deslocamento máximo mais recente por inclinómetro",
      depthCoverage: "Cobertura em profundidade",
      observationEnvelope: "Envelope de observação",
      observationRoleCoverage: "Cobertura por tipo de observação",
      meMdUnavailable:
        "A direção ME/MD não está disponível para este inclinómetro.",
      mjProfilesByObservation:
        "Perfis de deslocamento MJ por observação",
      meMdProfilesByObservation:
        "Perfis de deslocamento ME/MD por observação",
      geometryMjProfile: "Perfil geométrico MJ",
      geometryMeMdProfile: "Perfil geométrico ME/MD",
      depthProfileDisplacement: "Perfil em profundidade do deslocamento",
      maxDisplacementPerObservation:
        "Deslocamento máximo por observação",
    },
    labels: {
      pressureAxis: "Pressão intersticial (kPa)",
      cotaAxis: "Cota NAA / aterro (m)",
      aterro: "C. ATERRO",
      overview: "Resumo",
      totalFlow: "Caudal total l/s",
      computedTotalFlow: "Total calculado l/s",
      cleanFlowLs: "Caudal limpo l/s",
      sourceFlowLs: "Caudal de origem l/s",
      maxMjMm: "MJ máximo mm",
      maxMeMdMm: "ME/MD máximo mm",
      mjMaxAbsMm: "MJ máximo absoluto mm",
      meMdMaxAbsMm: "ME/MD máximo absoluto mm",
      depthMaxM: "Profundidade máxima m",
      selectedProfile: "Perfil selecionado",
      allMjProfiles: "Todos os perfis MJ",
      allMeMdProfiles: "Todos os perfis ME/MD",
      geometryMj: "Geometria MJ",
      geometryMeMd: "Geometria ME/MD",
      mjDisplacementMm: "Deslocamento MJ mm",
      meMdDisplacementMm: "Deslocamento ME/MD mm",
      inclinometerHeightAxis: "Altura do tubo inclinométrico (m)",
      measurementDateAxis: "Data da medição",
      observationDateAxis: "Data da observação",
      dateAxis: "Data",
      reservoirElevationAxis: "Cota da albufeira (m)",
      elevationAxis: "Cota (m)",
      qualityFlagAxis: "Sinalização de qualidade",
      occurrencesAxis: "Ocorrências",
      weatherConditionAxis: "Condição meteorológica",
      observationsAxis: "Observações",
      piezometerAxis: "Piezómetro",
      temperatureCelsiusAxis: "Temperatura (°C)",
      piezometricElevationAxis: "Cota piezométrica (m)",
      flowLitresPerSecondAxis: "Caudal (l/s)",
      statusAxis: "Estado",
      recordCountAxis: "Número de registos",
      meanDailyTemperatureAxis: "Temperatura média diária (°C)",
      meanDailyHumidityAxis: "Humidade relativa média diária (%)",
      dailyPrecipitationAxis: "Precipitação diária",
      eventCountAxis: "Número de eventos",
      sourceDatasetAxis: "Conjunto de dados de origem",
      metricCategoryAxis: "Métrica",
      eventTypeAxis: "Tipo de evento",
      inclinometerAxis: "Inclinómetro",
      latestMaxAbsDisplacementAxis:
        "Deslocamento absoluto máximo mais recente (mm)",
      maxAbsDisplacementAxis: "Deslocamento absoluto máximo (mm)",
      depthAtMaxAbsMjAxis:
        "Profundidade do deslocamento máximo absoluto MJ (m)",
      observationRoleAxis: "Tipo de observação",
      observationCountAxis: "Número de observações",
      displacementMillimetresAxis: "Deslocamento (mm)",
      rawMjStatisticAxis: "Estatística bruta M-J",
      rawEdStatisticAxis: "Estatística bruta E-D",
    },
  },
  en: {
    languageButton: "PT",
    languageAria: "Switch language to Portuguese",
    close: "Close",
    select: "Select",
    data: "Data",
    rows: "Rows",
    range: "Range",
    dataQuality: "Data quality",
    latest: "Latest",
    min: "Min",
    avg: "Avg",
    max: "Max",
    metric: "Metric",
    datasets: "Datasets",
    metricsPlural: "Metrics",
    noFlags: "No flags",
    noFlaggedRows: "No flagged rows",
    allRowsOk: "All rows OK",
    flaggedRows: "flagged rows",
    timelineRange: "Timeline range",
    rowsInCurrentDashboardRange: "rows in the current dashboard range",
    openBottomTimeline: "Open bottom timeline",
    hideCsvVisualizations: "Hide CSV visualizations",
    showCsvVisualizations: "Show CSV visualizations",
    loadingDataset: "Loading",
    noRowsSelectedRange:
      "No rows found in the selected timeline range.",
    failedToLoadDataset: "Failed to load dataset",
    unknownError: "Unknown error",
    noDataForSensor:
      "No data exists for this sensor in the current CSV datasets.",
    csvInstrument: "CSV instrument",
    metadata: "Metadata",
    readings: "Readings",
    rain: {
      hideControls: "Hide rain controls",
      showControls: "Show rain controls",
      droneCaptures: "Drone Captures",
      title: "Rain test",
      stop: "Stop rain",
      start: "Start rain",
      hideTiles: "Hide classification",
      showTiles: "Show classification",
      classification: "Classification",
      classes: {
        ground: "Ground",
        vegetationDark: "Vegetation dark",
        vegetationMedium: "Vegetation medium",
        vegetationBright: "Vegetation bright",
        buildings: "Buildings",
        water: "Water",
        bridge: "Bridge",
      },
    },
    sidebar: {
      hideCards: "Hide sensor cards",
      showCards: "Show sensor cards",
    },
    timeline: {
      hide: "Hide monitoring timeline",
      show: "Show monitoring timeline",
      title: "Monitoring timeline",
      selected: "Selected",
      pickStart: "Pick dataset start date",
      pickEnd: "Pick dataset end date",
      startDate: "Dataset start date",
      endDate: "Dataset end date",
      previousMonth: "Previous month",
      nextMonth: "Next month",
      closeCalendar: "Close calendar",
      datasetStart: "Dataset start",
      datasetEnd: "Dataset end",
    },
    playback: {
      title: "Water level timelapse",
      selectRange: "Select a range",
      loading: "Loading",
      currentReadTime: "Current sensor read time",
      noRowSelected: "No playback row selected",
      row: "Row",
      of: "of",
      play: "Play",
      pause: "Pause",
      reset: "Reset",
    },
    metrics: {
      cota: "Cota",
      manualCota: "Manual cota",
      nme: "NME",
      npa: "NPA",
      maxLatestPressure: "Max latest pressure",
      piezometricCota: "Piezometric cota",
      temperature: "Temperature",
      porePressure: "Pore pressure",
      flow: "Flow",
      reservoirCota: "Reservoir cota",
      computedTotal: "Computed total",
      cleanFlow: "Clean flow",
      sourceFlow: "Source flow",
      cleanSum: "Clean sum",
      humidity: "Humidity",
      precipitation: "Precipitation",
      maxLatestMj: "Max latest MJ",
      maxLatestMeMd: "Max latest ME/MD",
      maxDepth: "Max depth",
      observations: "Observations",
      maxAbsMj: "Max abs MJ",
      maxAbsMeMd: "Max abs ME/MD",
      depthAtMaxMj: "Depth at max MJ",
      depthRows: "Depth rows",
      mjDisplacement: "MJ displacement",
      meMdDisplacement: "ME/MD displacement",
      depth: "Depth",
    },
    charts: {
      hourlyReservoirCota: "Hourly reservoir cota",
      nonOkQualityFlags: "Non-ok quality flags",
      manualCotaReferences: "Manual cota against references",
      weatherNotes: "Weather notes",
      noPiezometerRows:
        "No piezometer history rows found in the selected timeline range.",
      porePressureNaaEmbankment:
        "Pore pressure, NAA and embankment cota",
      loadingPiezometerHistory: "Loading piezometer history",
      failedPiezometerHistory: "Failed to load piezometer history",
      latestTemperatures: "Latest temperatures",
      latestPorePressureByInstrument:
        "Latest pore pressure by instrument",
      pressureAndCota: "Pressure and cota",
      temperatureHistory: "Temperature history",
      seepageNoRows:
        "No seepage rows found in the selected timeline range.",
      caudaisPercolados: "Percolated flows",
      componentFlowReservoirCota:
        "Component flow and reservoir cota",
      componentStatusOverview: "Component status overview",
      selectedComponentStatus: "Selected component status",
      totalSeepageOverTime: "Total seepage over time",
      temporaryBicaNoRows:
        "No bica rows found in the selected timeline range.",
      temporaryBicaOverview: "Temporary bica overview",
      cleanAndSourceFlow: "Clean and source flow",
      dailyTemperatureHumidity: "Daily temperature and humidity",
      dailyPrecipitation: "Daily precipitation",
      eventsBySourceDataset: "Events by source dataset",
      metricCoverage: "Metric coverage",
      eventTypes: "Event types",
      latestMaxDisplacementByInclinometer:
        "Latest max displacement by inclinometer",
      depthCoverage: "Depth coverage",
      observationEnvelope: "Observation envelope",
      observationRoleCoverage: "Observation role coverage",
      meMdUnavailable:
        "ME/MD direction is not available for this inclinometer.",
      mjProfilesByObservation:
        "MJ displacement profiles by observation",
      meMdProfilesByObservation:
        "ME/MD displacement profiles by observation",
      geometryMjProfile: "Geometry MJ profile",
      geometryMeMdProfile: "Geometry ME/MD profile",
      depthProfileDisplacement: "Depth profile displacement",
      maxDisplacementPerObservation:
        "Max displacement per observation",
    },
    labels: {
      pressureAxis: "Pore pressure (kPa)",
      cotaAxis: "NAA / embankment cota (m)",
      aterro: "C. EMBANKMENT",
      overview: "Overview",
      totalFlow: "Total flow l/s",
      computedTotalFlow: "Computed total l/s",
      cleanFlowLs: "Clean flow l/s",
      sourceFlowLs: "Source flow l/s",
      maxMjMm: "Max MJ mm",
      maxMeMdMm: "Max ME/MD mm",
      mjMaxAbsMm: "MJ max abs mm",
      meMdMaxAbsMm: "ME/MD max abs mm",
      depthMaxM: "Depth max m",
      selectedProfile: "Selected profile",
      allMjProfiles: "All MJ profiles",
      allMeMdProfiles: "All ME/MD profiles",
      geometryMj: "Geometry MJ",
      geometryMeMd: "Geometry ME/MD",
      mjDisplacementMm: "MJ displacement mm",
      meMdDisplacementMm: "ME/MD displacement mm",
      inclinometerHeightAxis: "Inclinometer tube height (m)",
      measurementDateAxis: "Measurement date",
      observationDateAxis: "Observation date",
      dateAxis: "Date",
      reservoirElevationAxis: "Reservoir elevation (m)",
      elevationAxis: "Elevation (m)",
      qualityFlagAxis: "Quality flag",
      occurrencesAxis: "Occurrences",
      weatherConditionAxis: "Weather condition",
      observationsAxis: "Observations",
      piezometerAxis: "Piezometer",
      temperatureCelsiusAxis: "Temperature (°C)",
      piezometricElevationAxis: "Piezometric elevation (m)",
      flowLitresPerSecondAxis: "Flow (l/s)",
      statusAxis: "Status",
      recordCountAxis: "Number of records",
      meanDailyTemperatureAxis: "Mean daily temperature (°C)",
      meanDailyHumidityAxis: "Mean daily relative humidity (%)",
      dailyPrecipitationAxis: "Daily precipitation",
      eventCountAxis: "Number of events",
      sourceDatasetAxis: "Source dataset",
      metricCategoryAxis: "Metric",
      eventTypeAxis: "Event type",
      inclinometerAxis: "Inclinometer",
      latestMaxAbsDisplacementAxis:
        "Latest maximum absolute displacement (mm)",
      maxAbsDisplacementAxis: "Maximum absolute displacement (mm)",
      depthAtMaxAbsMjAxis:
        "Depth at maximum absolute MJ displacement (m)",
      observationRoleAxis: "Observation role",
      observationCountAxis: "Observation count",
      displacementMillimetresAxis: "Displacement (mm)",
      rawMjStatisticAxis: "Raw M-J statistic",
      rawEdStatisticAxis: "Raw E-D statistic",
    },
  },
} as const;

const datasetCopy = {
  reservoir: {
    pt: {
      title: "Nível Horário da Albufeira",
      shortTitle: "Albufeira",
      description:
        "Cota horária que controla a reprodução da altura da superfície da água.",
    },
    en: {
      title: "Hourly Reservoir Level",
      shortTitle: "Reservoir",
      description:
        "Hourly cota driving future water-surface height playback.",
    },
  },
  manualCota: {
    pt: {
      title: "Eventos de Cota Manual",
      shortTitle: "Cota manual",
      description:
        "Observações manuais, notas meteorológicas e níveis de referência.",
    },
    en: {
      title: "Manual Cota Events",
      shortTitle: "Manual cota",
      description: "Manual observations, weather notes and reference levels.",
    },
  },
  piezometerMetadata: {
    pt: {
      title: "Metadados dos Piezómetros",
      shortTitle: "Piezómetros",
      description:
        "Metadados mais recentes dos instrumentos para marcadores 3D dos sensores.",
    },
    en: {
      title: "Piezometer Metadata",
      shortTitle: "Piezometers",
      description: "Latest instrument metadata for future 3D sensor markers.",
    },
  },
  piezometerHistory: {
    pt: {
      title: "Histórico dos Piezómetros",
      shortTitle: "Hist. piezos",
      description:
        "Históricos de pressão, nível piezométrico e temperatura.",
    },
    en: {
      title: "Piezometer History",
      shortTitle: "Piezo history",
      description: "Pressure, piezometric level and temperature histories.",
    },
  },
  seepage: {
    pt: {
      title: "Percolação e Ressurgências",
      shortTitle: "Percolação",
      description: "Leituras de caudal por componente e totais calculados.",
    },
    en: {
      title: "Seepage And Percolation",
      shortTitle: "Seepage",
      description: "Component flow readings and computed totals.",
    },
  },
  temporaryBica: {
    pt: {
      title: "Caudais Temporários das Bicas",
      shortTitle: "Bicas",
      description:
        "Estado dos caudais provisórios das bicas, totais e sinalizações de qualidade.",
    },
    en: {
      title: "Temporary Bica Flows",
      shortTitle: "Bicas",
      description: "Provisional bica flow status, totals and quality flags.",
    },
  },
  weather: {
    pt: {
      title: "Meteorologia Horária",
      shortTitle: "Meteorologia",
      description: "Contexto de temperatura, humidade e precipitação.",
    },
    en: {
      title: "Weather Hourly",
      shortTitle: "Weather",
      description: "Temperature, humidity and precipitation context.",
    },
  },
  timeline: {
    pt: {
      title: "Cronologia Unificada",
      shortTitle: "Cronologia",
      description:
        "Camada global de sincronização para medições e sinalizações.",
    },
    en: {
      title: "Unified Timeline",
      shortTitle: "Timeline",
      description: "Global synchronization layer for measurements and flags.",
    },
  },
  inclinometerMetadata: {
    pt: {
      title: "Metadados dos Inclinómetros",
      shortTitle: "Metad. inc.",
      description:
        "Inventário dos instrumentos, cobertura em profundidade e extremos de deslocamento mais recentes.",
    },
    en: {
      title: "Inclinometer Metadata",
      shortTitle: "Inc. metadata",
      description:
        "Instrument inventory, depth coverage and latest displacement extremes.",
    },
  },
  inclinometerSummary: {
    pt: {
      title: "Resumo das Observações dos Inclinómetros",
      shortTitle: "Resumo inc.",
      description:
        "Envelopes de deslocamento por observação, tipos de observação e sinais de qualidade.",
    },
    en: {
      title: "Inclinometer Observation Summary",
      shortTitle: "Inc. summary",
      description:
        "Observation-level displacement envelopes, roles and quality signals.",
    },
  },
  inclinometerHistory: {
    pt: {
      title: "Histórico dos Inclinómetros",
      shortTitle: "Hist. inc.",
      description:
        "Perfis históricos de deslocamento profundidade a profundidade para cada inclinómetro.",
    },
    en: {
      title: "Inclinometer History",
      shortTitle: "Inc. history",
      description:
        "Depth-by-depth historical displacement profiles for each inclinometer.",
    },
  },
} as const;

export function localizeDataset<
  T extends {
    key: string;
    title: string;
    shortTitle: string;
    description: string;
  },
>(dataset: T, language: MontesinhoLanguage): T {
  const copy = datasetCopy[dataset.key as keyof typeof datasetCopy]?.[language];
  if (!copy) return dataset;

  return {
    ...dataset,
    title: copy.title,
    shortTitle: copy.shortTitle,
    description: copy.description,
  };
}

const sensorText = {
  "Leveling mark on the dam crest.": {
    pt: "Marca de nivelamento no coroamento da barragem.",
    en: "Leveling mark on the dam crest.",
  },
  "Pneumatic piezometer in the foundation.": {
    pt: "Piezómetro pneumático na fundação.",
    en: "Pneumatic piezometer in the foundation.",
  },
  "Vertical inclinometer in the embankment.": {
    pt: "Inclinómetro vertical no aterro.",
    en: "Vertical inclinometer in the embankment.",
  },
  "Inclined inclinometer in the waterproofing slab.": {
    pt: "Inclinómetro inclinado na laje de impermeabilização.",
    en: "Inclined inclinometer in the waterproofing slab.",
  },
  "Downstream flow meter.": {
    pt: "Medidor de caudal a jusante.",
    en: "Downstream flow meter.",
  },
  "Staff gauge / water level.": {
    pt: "Escala limnimétrica / nível de água.",
    en: "Staff gauge / water level.",
  },
  "Reference leveling mark anchored in the rock mass.": {
    pt: "Marca de nivelamento de referência ancorada no maciço rochoso.",
    en: "Reference leveling mark anchored in the rock mass.",
  },
} as const;

const sensorBadges = {
  Settlement: { pt: "Assentamento", en: "Settlement" },
  Piezometer: { pt: "Piezómetro", en: "Piezometer" },
  Inclinometer: { pt: "Inclinómetro", en: "Inclinometer" },
  Slab: { pt: "Laje", en: "Slab" },
  Flow: { pt: "Caudal", en: "Flow" },
  "Water level": { pt: "Nível de água", en: "Water level" },
  Reference: { pt: "Referência", en: "Reference" },
} as const;

export function localizeSensors(
  sensors: MonitoringSensorItem[],
  language: MontesinhoLanguage
): MonitoringSensorItem[] {
  return sensors.map((sensor) => ({
    ...sensor,
    description:
      sensorText[sensor.description as keyof typeof sensorText]?.[language] ??
      sensor.description,
    badge: sensor.badge
      ? sensorBadges[sensor.badge as keyof typeof sensorBadges]?.[language] ??
        sensor.badge
      : sensor.badge,
  }));
}
