import {
  CloudRainIcon,
  Layers3Icon,
  MousePointer2Icon,
  PlusCircleIcon,
  Rotate3DIcon,
  SlidersHorizontalIcon,
  ScanSearchIcon,
} from "lucide-react";

export type GuideObjective = {
  id:
    | "rotate"
    | "zoom"
    | "selectSensor"
    | "openGraph"
    | "changeRain"
    | "showTwoTiles"
    | "addSensor"
    | "useGizmos"
    | "openTimeline"
    | "chooseDateInterval"
    | "runAnimation";
  label: string;
  helper: string;
};

export type GuideLanguage = "en" | "pt";

export type GuideStep = {
  id:
    | "explore-scene"
    | "select-sensor"
    | "open-sensor-graphs"
    | "change-rain"
    | "show-two-tiles"
    | "add-sensor"
    | "sensor-gizmos"
    | "timeline-playback";
  eyebrow: string;
  title: string;
  description: string;
  calloutTitle: string;
  calloutText: string;
  objectives: GuideObjective[];
  icon: typeof Rotate3DIcon;
};

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: "explore-scene",
    eyebrow: "Step 1",
    title: "Explore the 3D dam scene",
    description:
      "Start by getting comfortable with the viewport. Rotate the terrain and change the zoom level before moving on.",
    calloutTitle: "Use the scene controls",
    calloutText:
      "Drag inside the 3D view to rotate. Scroll or pinch to zoom closer and farther from the dam.",
    icon: Rotate3DIcon,
    objectives: [
      {
        id: "rotate",
        label: "Rotate the scene",
        helper: "Drag left, right, up, or down inside the 3D viewport.",
      },
      {
        id: "zoom",
        label: "Zoom the scene",
        helper: "Use the mouse wheel, trackpad pinch, or two-finger scroll.",
      },
    ],
  },
  {
    id: "select-sensor",
    eyebrow: "Step 2",
    title: "Select a monitoring sensor",
    description:
      "Pick one sensor from the left panel. The camera will move toward it and the marker will highlight in the terrain.",
    calloutTitle: "Choose any sensor card",
    calloutText:
      "Click Select on a card in the sensor list to focus that instrument in the 3D scene.",
    icon: ScanSearchIcon,
    objectives: [
      {
        id: "selectSensor",
        label: "Select one sensor",
        helper: "Use any sensor card in the left sidebar.",
      },
    ],
  },
  {
    id: "open-sensor-graphs",
    eyebrow: "Step 3",
    title: "Open the selected sensor graphs",
    description:
      "With a sensor selected, click its highlighted marker in the 3D scene to open the graph and dashboard window.",
    calloutTitle: "Click the highlighted marker",
    calloutText:
      "The sensor marker in the model opens the analysis panel with the existing chart layout.",
    icon: MousePointer2Icon,
    objectives: [
      {
        id: "openGraph",
        label: "Open the graph menu",
        helper: "Click the selected sensor marker in the terrain.",
      },
    ],
  },
  {
    id: "add-sensor",
    eyebrow: "Step 4",
    title: "Add a new sensor",
    description:
      "Create a sensor from the guide. You can place it from real longitude and latitude inside the two-tile bounds, or let the system place it automatically.",
    calloutTitle: "Create a guide sensor",
    calloutText:
      "Use the Add sensor button in the guide panel, choose a type, name it, and decide whether to use coordinates.",
    icon: PlusCircleIcon,
    objectives: [
      {
        id: "addSensor",
        label: "Create one sensor",
        helper:
          "The new sensor will appear in the scene using the geometry for its selected type.",
      },
    ],
  },
  {
    id: "sensor-gizmos",
    eyebrow: "Step 5",
    title: "Use sensor gizmos",
    description:
      "Open the guide sensor menu, activate gizmos for a sensor, then switch between move and rotate controls.",
    calloutTitle: "Activate a sensor gizmo",
    calloutText:
      "Use the Gizmos button beside Select in the sensor menu to attach transform controls to that sensor.",
    icon: SlidersHorizontalIcon,
    objectives: [
      {
        id: "useGizmos",
        label: "Activate sensor gizmos",
        helper:
          "Click Gizmos on any sensor card, then use Move or Rotate in the guide.",
      },
    ],
  },
  {
    id: "change-rain",
    eyebrow: "Step 6",
    title: "Change the rain intensity",
    description:
      "Use the rain test panel to change the rainfall level and observe how the simulated rainfall responds in the scene.",
    calloutTitle: "Use the rain intensity control",
    calloutText:
      "The rain panel is open on the right. Move the slider or use the rain button to change the intensity.",
    icon: CloudRainIcon,
    objectives: [
      {
        id: "changeRain",
        label: "Change rain intensity",
        helper: "Move the rain slider or stop/start the rain from the right panel.",
      },
    ],
  },
  {
    id: "show-two-tiles",
    eyebrow: "Step 7",
    title: "Add the two categorization tiles",
    description:
      "Turn on the categorized tiles layer and review the classification legend that appears in the same right-side panel.",
    calloutTitle: "Show the categorized tiles",
    calloutText:
      "Use the Show 2 tiles button in the right panel to add the categorized layer and reveal its legend.",
    icon: Layers3Icon,
    objectives: [
      {
        id: "showTwoTiles",
        label: "Show 2 tiles",
        helper: "Click Show 2 tiles in the rain and classification panel.",
      },
    ],
  },
  {
    id: "timeline-playback",
    eyebrow: "Step 8",
    title: "Run the water level animation",
    description:
      "Use the bottom timeline menu to choose a date interval, then run the water level animation to finish the guide.",
    calloutTitle: "Use the bottom timeline",
    calloutText:
      "Open the bottom timeline, narrow the selected date range, then press Play in the animation panel.",
    icon: Layers3Icon,
    objectives: [
      {
        id: "openTimeline",
        label: "Open the timeline menu",
        helper: "Use the bottom collapsible timeline control.",
      },
      {
        id: "chooseDateInterval",
        label: "Choose a date interval",
        helper: "Move the timeline range handles to narrow the selected interval.",
      },
      {
        id: "runAnimation",
        label: "Run the animation",
        helper: "Press Play in the water level timelapse panel.",
      },
    ],
  },
];

type ObjectiveCopy = Pick<GuideObjective, "label" | "helper">;

type GuideStepTranslation = Pick<
  GuideStep,
  "eyebrow" | "title" | "description" | "calloutTitle" | "calloutText"
> & {
  objectives: Partial<Record<GuideObjective["id"], ObjectiveCopy>>;
};

const PORTUGUESE_GUIDE_STEPS: Record<GuideStep["id"], GuideStepTranslation> = {
  "explore-scene": {
    eyebrow: "Passo 1",
    title: "Explore a cena 3D da barragem",
    description:
      "Comece por se familiarizar com a vista. Rode o terreno e altere o nível de zoom antes de avançar.",
    calloutTitle: "Use os controlos da cena",
    calloutText:
      "Arraste dentro da vista 3D para rodar. Use a roda do rato ou o gesto de pinça para aproximar e afastar.",
    objectives: {
      rotate: {
        label: "Rodar a cena",
        helper: "Arraste para a esquerda, direita, cima ou baixo dentro da vista 3D.",
      },
      zoom: {
        label: "Aproximar ou afastar",
        helper: "Use a roda do rato, o gesto de pinça ou o scroll com dois dedos.",
      },
    },
  },
  "select-sensor": {
    eyebrow: "Passo 2",
    title: "Selecione um sensor de monitorização",
    description:
      "Escolha um sensor no painel da esquerda. A câmara aproxima-se dele e o marcador fica destacado no terreno.",
    calloutTitle: "Escolha qualquer cartão de sensor",
    calloutText:
      "Clique em Selecionar num cartão da lista de sensores para focar esse instrumento na cena 3D.",
    objectives: {
      selectSensor: {
        label: "Selecionar um sensor",
        helper: "Use qualquer cartão de sensor na barra lateral esquerda.",
      },
    },
  },
  "open-sensor-graphs": {
    eyebrow: "Passo 3",
    title: "Abra os gráficos do sensor selecionado",
    description:
      "Com um sensor selecionado, clique no marcador destacado na cena 3D para abrir a janela de gráficos e painel de análise.",
    calloutTitle: "Clique no marcador destacado",
    calloutText:
      "O marcador do sensor no modelo abre o painel de análise com o layout de gráficos existente.",
    objectives: {
      openGraph: {
        label: "Abrir o menu de gráficos",
        helper: "Clique no marcador do sensor selecionado no terreno.",
      },
    },
  },
  "add-sensor": {
    eyebrow: "Passo 4",
    title: "Adicione um novo sensor",
    description:
      "Crie um sensor a partir do guia. Pode colocá-lo com longitude e latitude reais dentro dos limites dos dois tiles, ou deixar o sistema posicioná-lo automaticamente.",
    calloutTitle: "Crie um sensor do guia",
    calloutText:
      "Use o botão Adicionar sensor no painel do guia, escolha o tipo, dê-lhe um nome e decida se quer usar coordenadas.",
    objectives: {
      addSensor: {
        label: "Criar um sensor",
        helper:
          "O novo sensor aparece na cena com a geometria correspondente ao tipo selecionado.",
      },
    },
  },
  "sensor-gizmos": {
    eyebrow: "Passo 5",
    title: "Use os gizmos dos sensores",
    description:
      "Abra o menu de sensores do guia, ative os gizmos para um sensor e alterne entre mover e rodar.",
    calloutTitle: "Ative um gizmo de sensor",
    calloutText:
      "Use o botão Gizmos junto a Selecionar no menu de sensores para ligar os controlos de transformação a esse sensor.",
    objectives: {
      useGizmos: {
        label: "Ativar gizmos do sensor",
        helper:
          "Clique em Gizmos num cartão de sensor e depois use Mover ou Rodar no guia.",
      },
    },
  },
  "change-rain": {
    eyebrow: "Passo 6",
    title: "Altere a intensidade da chuva",
    description:
      "Use o painel de teste de chuva para alterar o nível de precipitação e observe a resposta da simulação na cena.",
    calloutTitle: "Use o controlo de intensidade da chuva",
    calloutText:
      "O painel de chuva está aberto à direita. Mova o seletor ou use o botão de chuva para alterar a intensidade.",
    objectives: {
      changeRain: {
        label: "Alterar a intensidade da chuva",
        helper: "Mova o seletor da chuva ou pare/inicie a chuva no painel da direita.",
      },
    },
  },
  "show-two-tiles": {
    eyebrow: "Passo 7",
    title: "Adicione os dois tiles de categorização",
    description:
      "Ative a camada de tiles categorizados e consulte a legenda de classificação que aparece no mesmo painel lateral direito.",
    calloutTitle: "Mostre os tiles categorizados",
    calloutText:
      "Use o botão Mostrar 2 tiles no painel da direita para adicionar a camada categorizada e revelar a legenda.",
    objectives: {
      showTwoTiles: {
        label: "Mostrar 2 tiles",
        helper: "Clique em Mostrar 2 tiles no painel de chuva e classificação.",
      },
    },
  },
  "timeline-playback": {
    eyebrow: "Passo 8",
    title: "Execute a animação do nível da água",
    description:
      "Use o menu inferior da linha temporal para escolher um intervalo de datas e execute a animação do nível da água para concluir o guia.",
    calloutTitle: "Use a linha temporal inferior",
    calloutText:
      "Abra a linha temporal inferior, reduza o intervalo de datas selecionado e carregue em Reproduzir no painel de animação.",
    objectives: {
      openTimeline: {
        label: "Abrir o menu da linha temporal",
        helper: "Use o controlo recolhível da linha temporal inferior.",
      },
      chooseDateInterval: {
        label: "Escolher um intervalo de datas",
        helper: "Mova os manípulos do intervalo para reduzir o período selecionado.",
      },
      runAnimation: {
        label: "Executar a animação",
        helper: "Carregue em Reproduzir no painel de timelapse do nível da água.",
      },
    },
  },
};

export const GUIDE_UI_COPY: Record<
  GuideLanguage,
  {
    guideName: string;
    heading: string;
    selectedSensor: string;
    continue: string;
    complete: string;
    completed: string;
    active: string;
    locked: string;
    languageLabel: string;
  }
> = {
  en: {
    guideName: "Montesinho guide",
    heading: "Practical first steps",
    selectedSensor: "Selected sensor",
    continue: "Continue",
    complete: "Guide complete",
    completed: "completed",
    active: "active",
    locked: "locked",
    languageLabel: "Language",
  },
  pt: {
    guideName: "Guia de Montesinho",
    heading: "Primeiros passos práticos",
    selectedSensor: "Sensor selecionado",
    continue: "Continuar",
    complete: "Guia concluído",
    completed: "concluído",
    active: "ativo",
    locked: "bloqueado",
    languageLabel: "Idioma",
  },
};

export function getGuideStepText(step: GuideStep, language: GuideLanguage) {
  if (language === "en") {
    return step;
  }

  return {
    ...step,
    ...PORTUGUESE_GUIDE_STEPS[step.id],
  };
}

export function getGuideObjectiveText(
  step: GuideStep,
  objective: GuideObjective,
  language: GuideLanguage
) {
  if (language === "en") {
    return objective;
  }

  return {
    ...objective,
    ...PORTUGUESE_GUIDE_STEPS[step.id].objectives[objective.id],
  };
}
