import {
  CameraIcon,
  CloudRainIcon,
  DatabaseIcon,
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
    | "runAnimation"
    | "openDatasetMenu"
    | "openReservoirDashboard"
    | "openPiezometerMenu"
    | "openPiezometerDashboard"
    | "answerPiezometerPressure"
    | "openInclinometerMenu"
    | "openInclinometerDashboard"
    | "changeInclinometerProfile"
    | "openDroneCaptures";
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
    | "timeline-playback"
    | "open-reservoir-dashboard"
    | "piezometer-pressure-challenge"
    | "inclinometer-filter-challenge"
    | "open-drone-captures";
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
    title: "Open the selected sensor dashboard",
    description:
      "With a sensor selected, use its Data button or click the highlighted marker in the 3D scene to open the dashboard window.",
    calloutTitle: "Open the sensor data",
    calloutText:
      "Click Data on the selected sensor card, or click its highlighted marker in the model.",
    icon: MousePointer2Icon,
    objectives: [
      {
        id: "openGraph",
        label: "Open the sensor dashboard",
        helper: "Use the Data button or the selected sensor marker.",
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
    title: "Show the classification layer",
    description:
      "Turn on the classified tiles layer and review the classification legend that appears in the same right-side panel.",
    calloutTitle: "Show classification",
    calloutText:
      "Use the Show classification button in the right panel to add the classified layer and reveal its legend.",
    icon: Layers3Icon,
    objectives: [
      {
        id: "showTwoTiles",
        label: "Show classification",
        helper: "Click Show classification in the rain and classification panel.",
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
  {
    id: "open-reservoir-dashboard",
    eyebrow: "Step 9",
    title: "Open a monitoring dashboard",
    description:
      "Use the top data menu to open the Hourly Reservoir Level dashboard and explore its visualizations.",
    calloutTitle: "Use the top data menu",
    calloutText:
      "Expand the top menu, then choose Reservoir to open its dashboard.",
    icon: DatabaseIcon,
    objectives: [
      {
        id: "openDatasetMenu",
        label: "Expand the top data menu",
        helper: "Use the round toggle at the top of the scene.",
      },
      {
        id: "openReservoirDashboard",
        label: "Open the reservoir dashboard",
        helper: "Choose Reservoir from the expanded data menu.",
      },
    ],
  },
  {
    id: "piezometer-pressure-challenge",
    eyebrow: "Step 10",
    title: "Check the PP5 pore pressure",
    description:
      "Open the top data menu, select Piezometers, and find PP5 in the Latest pore pressure by instrument chart. Enter its value below to two decimal places.",
    calloutTitle: "Use the piezometer dashboard",
    calloutText:
      "Choose Piezometers from the top menu, then locate PP5 in the latest pore pressure chart.",
    icon: DatabaseIcon,
    objectives: [
      {
        id: "openPiezometerMenu",
        label: "Expand the top data menu again",
        helper: "Use the round toggle at the top of the scene.",
      },
      {
        id: "openPiezometerDashboard",
        label: "Open the piezometer dashboard",
        helper: "Choose Piezometers from the expanded data menu.",
      },
      {
        id: "answerPiezometerPressure",
        label: "Enter the PP5 pore pressure",
        helper: "Enter the latest PP5 reading in kPa to two decimal places.",
      },
    ],
  },
  {
    id: "inclinometer-filter-challenge",
    eyebrow: "Step 11",
    title: "Compare inclinometer profiles",
    description:
      "Return to the top data menu, open Inclinometer History, and change its profile filter to All MJ profiles.",
    calloutTitle: "Use the inclinometer filters",
    calloutText:
      "Open Inclinometer History from the top menu, then choose All MJ profiles in the filter row.",
    icon: SlidersHorizontalIcon,
    objectives: [
      {
        id: "openInclinometerMenu",
        label: "Expand the top data menu again",
        helper: "Use the top toggle after completing the piezometer challenge.",
      },
      {
        id: "openInclinometerDashboard",
        label: "Open Inclinometer History",
        helper: "Choose the historical inclinometer profiles dashboard.",
      },
      {
        id: "changeInclinometerProfile",
        label: "Show all MJ profiles",
        helper: "Change the profile filter from Selected profile to All MJ profiles.",
      },
    ],
  },
  {
    id: "open-drone-captures",
    eyebrow: "Step 12",
    title: "Open Drone Captures",
    description:
      "Use the Drone Captures button at the top of the right-side panel. It will open the drone interface and finish the guide.",
    calloutTitle: "Open the drone interface",
    calloutText:
      "Click Drone Captures at the top of the right-side panel to continue to the drone page.",
    icon: CameraIcon,
    objectives: [
      {
        id: "openDroneCaptures",
        label: "Open Drone Captures",
        helper: "Use the button in the right-side controls to open /droneui.",
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
    title: "Abra o painel do sensor selecionado",
    description:
      "Com um sensor selecionado, use o botão Dados ou clique no marcador destacado na cena 3D para abrir o painel.",
    calloutTitle: "Abra os dados do sensor",
    calloutText:
      "Clique em Dados no cartão do sensor selecionado ou clique no respetivo marcador destacado no modelo.",
    objectives: {
      openGraph: {
        label: "Abrir o painel do sensor",
        helper: "Use o botão Dados ou o marcador do sensor selecionado.",
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
    title: "Mostre a camada de classificação",
    description:
      "Ative a camada de tiles classificados e consulte a legenda que aparece no mesmo painel lateral direito.",
    calloutTitle: "Mostre a classificação",
    calloutText:
      "Use o botão Mostrar classificação no painel da direita para adicionar a camada classificada e revelar a legenda.",
    objectives: {
      showTwoTiles: {
        label: "Mostrar classificação",
        helper: "Clique em Mostrar classificação no painel de chuva e classificação.",
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
  "open-reservoir-dashboard": {
    eyebrow: "Passo 9",
    title: "Abra um painel de monitorização",
    description:
      "Use o menu de dados superior para abrir o painel Nível Horário da Albufeira e explorar as visualizações.",
    calloutTitle: "Use o menu de dados superior",
    calloutText:
      "Expanda o menu superior e escolha Albufeira para abrir o respetivo painel.",
    objectives: {
      openDatasetMenu: {
        label: "Expandir o menu de dados superior",
        helper: "Use o botão redondo no topo da cena.",
      },
      openReservoirDashboard: {
        label: "Abrir o painel da albufeira",
        helper: "Escolha Albufeira no menu de dados expandido.",
      },
    },
  },
  "piezometer-pressure-challenge": {
    eyebrow: "Passo 10",
    title: "Consulte a pressão intersticial do piezómetro PP5",
    description:
      "Abra o menu de dados superior, selecione Piezómetros e, no gráfico Pressão intersticial mais recente por instrumento, identifique o valor do PP5. Introduza-o no desafio abaixo com duas casas decimais.",
    calloutTitle: "Consulte o painel dos piezómetros",
    calloutText:
      "No menu superior, escolha Piezómetros. Depois, localize o PP5 no gráfico da pressão intersticial mais recente.",
    objectives: {
      openPiezometerMenu: {
        label: "Abrir novamente o menu de dados superior",
        helper: "Use o botão redondo no topo da cena.",
      },
      openPiezometerDashboard: {
        label: "Abrir o painel dos piezómetros",
        helper: "Escolha Piezómetros no menu de dados expandido.",
      },
      answerPiezometerPressure: {
        label: "Introduzir a pressão intersticial do PP5",
        helper:
          "Introduza a leitura mais recente do PP5 em kPa, com duas casas decimais.",
      },
    },
  },
  "inclinometer-filter-challenge": {
    eyebrow: "Passo 11",
    title: "Compare os perfis dos inclinómetros",
    description:
      "Volte ao menu de dados superior, abra Histórico dos Inclinómetros e altere o filtro de perfil para Todos os perfis MJ.",
    calloutTitle: "Use os filtros dos inclinómetros",
    calloutText:
      "Abra Histórico dos Inclinómetros no menu superior e escolha Todos os perfis MJ na linha de filtros.",
    objectives: {
      openInclinometerMenu: {
        label: "Expandir novamente o menu de dados superior",
        helper: "Use o botão superior depois de concluir o desafio dos piezómetros.",
      },
      openInclinometerDashboard: {
        label: "Abrir Histórico dos Inclinómetros",
        helper: "Escolha o painel dos perfis históricos dos inclinómetros.",
      },
      changeInclinometerProfile: {
        label: "Mostrar todos os perfis MJ",
        helper: "Altere o filtro de Perfil selecionado para Todos os perfis MJ.",
      },
    },
  },
  "open-drone-captures": {
    eyebrow: "Passo 12",
    title: "Abra as Capturas de Drone",
    description:
      "Use o botão Capturas de Drone no topo do painel da direita. Este abre a interface do drone e conclui o guia.",
    calloutTitle: "Abra a interface do drone",
    calloutText:
      "Clique em Capturas de Drone no topo do painel da direita para avançar para a página do drone.",
    objectives: {
      openDroneCaptures: {
        label: "Abrir Capturas de Drone",
        helper: "Use o botão nos controlos da direita para abrir /droneui.",
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
    skip: string;
    complete: string;
    completed: string;
    active: string;
    locked: string;
    languageLabel: string;
    minimizeGuide: string;
    restoreGuide: string;
  }
> = {
  en: {
    guideName: "Montesinho guide",
    heading: "Practical first steps",
    selectedSensor: "Selected sensor",
    continue: "Continue",
    skip: "Skip step",
    complete: "Guide complete",
    completed: "completed",
    active: "active",
    locked: "locked",
    languageLabel: "Language",
    minimizeGuide: "Minimize guide",
    restoreGuide: "Restore guide",
  },
  pt: {
    guideName: "Guia de Montesinho",
    heading: "Primeiros passos práticos",
    selectedSensor: "Sensor selecionado",
    continue: "Continuar",
    skip: "Ignorar passo",
    complete: "Guia concluído",
    completed: "concluído",
    active: "ativo",
    locked: "bloqueado",
    languageLabel: "Idioma",
    minimizeGuide: "Minimizar guia",
    restoreGuide: "Restaurar guia",
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
