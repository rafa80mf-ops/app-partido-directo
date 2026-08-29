import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import MatchHeader from './components/MatchHeader';
import ControlPanel from './components/ControlPanel';
import MatchEvents from './components/MatchEvents';
import PitchField, { FORMATION_POSITIONS } from './components/PitchField';
import RosterPanel from './components/RosterPanel';
import SubstitutionModal from './components/SubstitutionModal';
import YellowCardModal from './components/YellowCardModal';
import RedCardModal from './components/RedCardModal';
import PlayerActionModal from './components/PlayerActionModal';
import LineupModal from './components/LineupModal';
import CalendarModal from './components/CalendarModal';
import HistoryModal from './components/HistoryModal';
import HistoryEditModal from './components/HistoryEditModal';
import HistoryDashboard from './components/HistoryDashboard';
import PlayerActionMenuModal from './components/PlayerActionMenuModal';
import StartMatchModal from './components/StartMatchModal';
import PlayerActionsConfigModal from './components/PlayerActionsConfigModal';
import TacticsBoardModal from './components/TacticsBoardModal';
import TrainingDashboard from './components/TrainingDashboard';
import {
  CLUB_NAME,
  createEmptyMatchState,
  DEFAULT_APP_LANGUAGE,
  DEFAULT_LEAGUE_LOGO,
  DEFAULT_TEAM_APPEARANCE,
  loadMatchState,
  normalizeMatchState,
  ROSTER_SIZE,
  saveMatchState,
} from './data/storage';
import { saveMatchSnapshot } from './data/localDb';
import { translateUiText, translateUiTree } from './i18n/uiTranslator';
import { PLAYER_ACTIONS, normalizeEnabledPlayerActions } from './data/actionCatalog';

function buildEvent(type, label, team = 'neutral', players = [], elapsedSeconds = null) {
  const safeElapsedSeconds = Number.isFinite(elapsedSeconds)
    ? Math.max(0, Math.floor(elapsedSeconds))
    : null;

  return {
    id: crypto.randomUUID(),
    type,
    label,
    team,
    minute: safeElapsedSeconds === null ? null : Math.floor(safeElapsedSeconds / 60),
    elapsedSeconds: safeElapsedSeconds,
    players: players.map((player) => ({ id: player.id, name: player.name, number: player.number })),
    createdAt: new Date().toISOString(),
  };
}

function cloneVisitorPlayers(players) {
  return players.map((player) => ({
    ...player,
    id: `visitor-${player.id}`,
    x: 100 - (Number(player.x) || 50),
    y: Number(player.y) || 50,
    injured: false,
    yellowCards: 0,
    redCards: 0,
  }));
}

function cloneVisitorBenchPlayers(players) {
  return players.map((player) => ({
    ...player,
    id: `visitor-${player.id}`,
    x: 0,
    y: 0,
    injured: false,
    yellowCards: 0,
    redCards: 0,
  }));
}

function getMatchSide(rosterTeam, clubSide) {
  if (rosterTeam === 'local') {
    return clubSide === 'visitor' ? 'visitor' : 'local';
  }

  return clubSide === 'visitor' ? 'local' : 'visitor';
}

function formatPlayerEventLabel(player, rosterTeam) {
  return rosterTeam === 'visitor' ? `${player.number}` : player.name;
}

function getLanguageLocale(languageCode) {
  return {
    es: 'es-ES',
    en: 'en-US',
    fr: 'fr-FR',
    pt: 'pt-PT',
    de: 'de-DE',
    it: 'it-IT',
  }[languageCode] || 'es-ES';
}

const DOCUMENT_TITLES = {
  es: 'Partido directo',
  en: 'Live match',
  fr: 'Match en direct',
  pt: 'Partida ao vivo',
  de: 'Live-Spiel',
  it: 'Partita dal vivo',
};

const UI_COPY = {
  es: {
    navBrand: 'Partido directo',
    navLive: 'En directo',
    navTeam: 'Mi equipo',
    navTactics: 'Pizarra tactica',
    navCalendar: 'Calendario',
    navHistory: 'Historial',
    navTraining: 'Entrenos',
    navLanguages: 'Idiomas',
    languagesTitle: 'Idiomas',
    languagesSubtitle: 'Selecciona el idioma base de la aplicacion para despliegue internacional.',
    languagesCurrent: 'Idioma actual',
    languagesRoadmap: 'Esta seleccion deja la app preparada para ampliar traducciones en todos los modulos.',
  },
  en: {
    navBrand: 'Live match',
    navLive: 'Live',
    navTeam: 'My team',
    navTactics: 'Tactics board',
    navCalendar: 'Calendar',
    navHistory: 'History',
    navTraining: 'Training',
    navLanguages: 'Languages',
    languagesTitle: 'Languages',
    languagesSubtitle: 'Select the base app language for international rollout.',
    languagesCurrent: 'Current language',
    languagesRoadmap: 'This setting prepares the app to expand translations across all modules.',
  },
  fr: {
    navBrand: 'Match en direct',
    navLive: 'Direct',
    navTeam: 'Mon equipe',
    navTactics: 'Tableau tactique',
    navCalendar: 'Calendrier',
    navHistory: 'Historique',
    navTraining: 'Entrainements',
    navLanguages: 'Langues',
    languagesTitle: 'Langues',
    languagesSubtitle: "Selectionnez la langue principale de l'application pour le deploiement international.",
    languagesCurrent: 'Langue actuelle',
    languagesRoadmap: 'Ce reglage prepare l application a etendre les traductions dans tous les modules.',
  },
  pt: {
    navBrand: 'Partida ao vivo',
    navLive: 'Ao vivo',
    navTeam: 'Minha equipe',
    navTactics: 'Quadro tatico',
    navCalendar: 'Calendario',
    navHistory: 'Historico',
    navTraining: 'Treinos',
    navLanguages: 'Idiomas',
    languagesTitle: 'Idiomas',
    languagesSubtitle: 'Selecione o idioma base do app para expansao internacional.',
    languagesCurrent: 'Idioma atual',
    languagesRoadmap: 'Esta configuracao prepara o app para ampliar traducoes em todos os modulos.',
  },
  de: {
    navBrand: 'Live-Spiel',
    navLive: 'Live',
    navTeam: 'Mein Team',
    navTactics: 'Taktiktafel',
    navCalendar: 'Kalender',
    navHistory: 'Historie',
    navTraining: 'Training',
    navLanguages: 'Sprachen',
    languagesTitle: 'Sprachen',
    languagesSubtitle: 'Wahle die Basis-App-Sprache fur den internationalen Rollout.',
    languagesCurrent: 'Aktuelle Sprache',
    languagesRoadmap: 'Diese Auswahl bereitet die App auf erweiterte Ubersetzungen in allen Modulen vor.',
  },
  it: {
    navBrand: 'Partita dal vivo',
    navLive: 'Live',
    navTeam: 'La mia squadra',
    navTactics: 'Lavagna tattica',
    navCalendar: 'Calendario',
    navHistory: 'Storico',
    navTraining: 'Allenamenti',
    navLanguages: 'Lingue',
    languagesTitle: 'Lingue',
    languagesSubtitle: 'Seleziona la lingua base dell app per la distribuzione internazionale.',
    languagesCurrent: 'Lingua attuale',
    languagesRoadmap: 'Questa scelta prepara l app ad ampliare le traduzioni in tutti i moduli.',
  },
};

const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'Espanol', nativeLabel: 'Espanol', region: 'Espana y LATAM' },
  { code: 'en', label: 'English', nativeLabel: 'English', region: 'Global' },
  { code: 'fr', label: 'Francais', nativeLabel: 'Francais', region: 'France, Belgique, Canada' },
  { code: 'pt', label: 'Portugues', nativeLabel: 'Portugues', region: 'Portugal y Brasil' },
  { code: 'de', label: 'Deutsch', nativeLabel: 'Deutsch', region: 'Alemania, Austria, Suiza' },
  { code: 'it', label: 'Italiano', nativeLabel: 'Italiano', region: 'Italia' },
];

function playHalfTimeAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.setValueAtTime(660, context.currentTime + 0.12);

    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.36);
    oscillator.onended = () => {
      context.close();
    };
  } catch {
    // Silent fallback: if audio cannot play, we still show the visual alert.
  }
}

function App() {
  const appRootRef = useRef(null);
  const [matchState, setMatchState] = useState(() => loadMatchState());
  const [injuredPlayerModal, setInjuredPlayerModal] = useState(null);
  const [selectingInjured, setSelectingInjured] = useState(false);
  const [yellowCardModal, setYellowCardModal] = useState(false);
  const [redCardModal, setRedCardModal] = useState(null);
  const [playerActionModal, setPlayerActionModal] = useState(null);
  const [lineupSelectionOpen, setLineupSelectionOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeCalendarMatchId, setActiveCalendarMatchId] = useState(null);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [historyEditMatch, setHistoryEditMatch] = useState(null);
  const [playerActionMenu, setPlayerActionMenu] = useState(null);
  const [substitutionModal, setSubstitutionModal] = useState(null);
  const [startMatchOpen, setStartMatchOpen] = useState(false);
  const [startMatchMode, setStartMatchMode] = useState('default');
  const [playerActionsConfigOpen, setPlayerActionsConfigOpen] = useState(false);
  const [tacticsBoardOpen, setTacticsBoardOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('live');
  const [teamSeasonDraft, setTeamSeasonDraft] = useState('');
  const [halfTimeNoticeShown, setHalfTimeNoticeShown] = useState(false);
  const [firstHalfAddedMinutes, setFirstHalfAddedMinutes] = useState(0);
  const [firstHalfAddedConfigured, setFirstHalfAddedConfigured] = useState(false);
  const [secondHalfAddedMinutes, setSecondHalfAddedMinutes] = useState(0);
  const [secondHalfAddedConfigured, setSecondHalfAddedConfigured] = useState(false);
  const [fullTimeNoticeShown, setFullTimeNoticeShown] = useState(false);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [equipmentDraft, setEquipmentDraft] = useState(null);
  const [activeColorSlot, setActiveColorSlot] = useState('color');
  const [activeSelectedAction, setActiveSelectedAction] = useState(null);
  const uiCopy = UI_COPY[matchState.appLanguage] || UI_COPY[DEFAULT_APP_LANGUAGE];

  useEffect(() => {
    const language = matchState.appLanguage || DEFAULT_APP_LANGUAGE;
    document.documentElement.lang = language;
    document.title = DOCUMENT_TITLES[language] || DOCUMENT_TITLES[DEFAULT_APP_LANGUAGE];
  }, [matchState.appLanguage]);

  useEffect(() => {
    const rootElement = appRootRef.current;
    if (!rootElement) {
      return undefined;
    }

    let isTranslating = false;
    const applyTranslations = () => {
      if (isTranslating) {
        return;
      }

      isTranslating = true;
      translateUiTree(rootElement, matchState.appLanguage || DEFAULT_APP_LANGUAGE);
      isTranslating = false;
    };

    applyTranslations();

    if ((matchState.appLanguage || DEFAULT_APP_LANGUAGE) === DEFAULT_APP_LANGUAGE) {
      return undefined;
    }

    const observer = new MutationObserver(() => {
      applyTranslations();
    });

    observer.observe(rootElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });

    return () => {
      observer.disconnect();
    };
  }, [matchState.appLanguage]);

  useEffect(() => {
    if (!matchState.isRunning) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setMatchState((currentState) => currentState.isRunning
        ? {
            ...currentState,
            elapsedSeconds: currentState.elapsedSeconds + 1,
            updatedAt: new Date().toISOString(),
          }
        : currentState);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [matchState.isRunning]);

  useEffect(() => {
    if (!matchState.isRunning) {
      return;
    }

    if (matchState.elapsedSeconds >= 45 * 60 && !firstHalfAddedConfigured && !halfTimeNoticeShown) {
      const addedMinutesInput = window.prompt(
        translateUiText('Minuto 45. Indica minutos de descuento para la primera parte (0-15).', matchState.appLanguage),
        `${firstHalfAddedMinutes}`,
      );
      const normalizedInput = (addedMinutesInput ?? '').trim();

      if (!normalizedInput) {
        setHalfTimeNoticeShown(true);
        window.alert(translateUiText('Sin descuento confirmado. El cronometro seguira hasta que pulses Pausar manualmente cuando termine la primera parte.', matchState.appLanguage));
        return;
      }

      const parsedAddedMinutes = Number.parseInt(normalizedInput, 10);
      if (!Number.isFinite(parsedAddedMinutes)) {
        window.alert(translateUiText('Valor no valido. Se continuara sin pausa automatica; puedes pausar manualmente cuando pite el arbitro.', matchState.appLanguage));
        setHalfTimeNoticeShown(true);
        return;
      }

      const safeAddedMinutes = Number.isFinite(parsedAddedMinutes)
        ? Math.max(0, Math.min(15, parsedAddedMinutes))
        : 0;

      setFirstHalfAddedMinutes(safeAddedMinutes);
      setFirstHalfAddedConfigured(true);

      if (safeAddedMinutes > 0) {
        updateMatchState((currentState) => ({
          ...currentState,
          events: [
            buildEvent('info', `Descuento primera parte: +${safeAddedMinutes} minuto(s)`, 'neutral', [], currentState.elapsedSeconds),
            ...currentState.events,
          ].slice(0, 25),
        }));
        window.alert(translateUiText(`Se jugara hasta el minuto ${45 + safeAddedMinutes} antes del descanso.`, matchState.appLanguage));
      }

      return;
    }

    const halfTimeTargetSeconds = (45 + firstHalfAddedMinutes) * 60;
    if (firstHalfAddedConfigured && matchState.elapsedSeconds >= halfTimeTargetSeconds && !halfTimeNoticeShown) {
      setHalfTimeNoticeShown(true);
      playHalfTimeAlertSound();
      window.alert(translateUiText(`Minuto ${45 + firstHalfAddedMinutes}: descanso. El partido se ha pausado automaticamente.`, matchState.appLanguage));
      updateMatchState((currentState) => ({
        ...currentState,
        isRunning: false,
        events: [
          buildEvent('info', `Descanso (${45 + firstHalfAddedMinutes}:00) - Partido pausado automaticamente`, 'neutral', [], currentState.elapsedSeconds),
          ...currentState.events,
        ].slice(0, 25),
      }));
      return;
    }

    if (matchState.elapsedSeconds >= 90 * 60 && !secondHalfAddedConfigured && !fullTimeNoticeShown) {
      playHalfTimeAlertSound();
      const addedMinutesInput = window.prompt(
        translateUiText('Minuto 90. Indica minutos de descuento para la segunda parte (0-15).', matchState.appLanguage),
        `${secondHalfAddedMinutes}`,
      );
      const normalizedInput = (addedMinutesInput ?? '').trim();

      if (!normalizedInput) {
        setSecondHalfAddedMinutes(0);
        setSecondHalfAddedConfigured(true);
        window.alert(translateUiText('Sin descuento indicado. El reloj seguira hasta que pulses Finalizar partido.', matchState.appLanguage));
        return;
      }

      const parsedAddedMinutes = normalizedInput ? Number.parseInt(normalizedInput, 10) : 0;
      const safeAddedMinutes = Number.isFinite(parsedAddedMinutes)
        ? Math.max(0, Math.min(15, parsedAddedMinutes))
        : 0;

      setSecondHalfAddedMinutes(safeAddedMinutes);
      setSecondHalfAddedConfigured(true);
      updateMatchState((currentState) => ({
        ...currentState,
        events: safeAddedMinutes > 0
          ? [
              buildEvent('info', `Descuento segunda parte: +${safeAddedMinutes} minuto(s)`, 'neutral', [], currentState.elapsedSeconds),
              ...currentState.events,
            ].slice(0, 25)
          : currentState.events,
      }));
    }

  }, [matchState.isRunning, matchState.elapsedSeconds, halfTimeNoticeShown, fullTimeNoticeShown, matchState.appLanguage, firstHalfAddedConfigured, firstHalfAddedMinutes, secondHalfAddedConfigured, secondHalfAddedMinutes]);

  useEffect(() => {
    saveMatchState(matchState);
    saveMatchSnapshot(matchState);
  }, [matchState]);

  useEffect(() => {
    if ((matchState.technicalStaff || []).length > 0) {
      return;
    }

    const lastMatchWithTechnicalStaff = [...(matchState.history || [])]
      .reverse()
      .find((match) => Array.isArray(match.technicalStaff) && match.technicalStaff.length > 0);

    if (!lastMatchWithTechnicalStaff) {
      return;
    }

    updateMatchState((currentState) => {
      if ((currentState.technicalStaff || []).length > 0) {
        return currentState;
      }

      return {
        ...currentState,
        technicalStaff: (lastMatchWithTechnicalStaff.technicalStaff || []).map((member) => ({ ...member })),
      };
    });
  }, [matchState.technicalStaff, matchState.history]);

  const summary = useMemo(() => {
    const totalGoals = matchState.scores.local + matchState.scores.visitor;
    return {
      totalGoals,
      status: matchState.isRunning
        ? 'En directo'
        : matchState.elapsedSeconds > 0
          ? 'Pausado'
          : 'Parado',
    };
  }, [matchState]);

  const updateMatchState = (updater) => {
    setMatchState((currentState) => {
      const nextState = typeof updater === 'function' ? updater(currentState) : updater;
      return {
        ...nextState,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const getAvailablePlayers = () => {
    const currentPlayers = [...(matchState.roster.local || []), ...(matchState.roster.bench || [])];
    const latestHistoryMatch = [...(matchState.history || [])].at(-1);
    const historyPlayers = [
      ...(latestHistoryMatch?.roster?.local || []),
      ...(latestHistoryMatch?.roster?.bench || []),
    ];
    const basePlayers = currentPlayers.length > 0 ? currentPlayers : historyPlayers;

    const hasSavedPlayerNames = basePlayers.some((player) => {
      const name = player.name?.trim() || '';
      return name && !/^(Suplente|Portera|Defensa|Media|Medio|Delantera)\s*\d*$/i.test(name);
    });

    const sourcePlayers = hasSavedPlayerNames
      ? basePlayers
      : [
          ...normalizeMatchState({ ...matchState, roster: { local: [], bench: [] } }).roster.local,
          ...normalizeMatchState({ ...matchState, roster: { local: [], bench: [] } }).roster.bench,
        ];

    const uniquePlayers = sourcePlayers.filter((player, index, allPlayers) => allPlayers.findIndex((candidate) => candidate.id === player.id) === index);

    return uniquePlayers.map((player) => ({
      ...player,
      injured: false,
      yellowCards: 0,
      redCards: 0,
      x: 0,
      y: 0,
    }));
  };

  const handleTeamNameChange = (team, value) => {
    updateMatchState((currentState) => ({
      ...currentState,
      teams: {
        ...currentState.teams,
        [team]: value,
      },
    }));
  };

  const handleClubCrestChange = (clubCrest) => {
    updateMatchState((currentState) => ({ ...currentState, clubCrest }));
  };

  const handleClubCrestUpload = (event) => {
    const [file] = event.target.files || [];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => handleClubCrestChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleLeagueNameChange = (leagueName) => {
    updateMatchState((currentState) => ({ ...currentState, leagueName }));
  };

  const handleLeagueLogoChange = (leagueLogo) => {
    updateMatchState((currentState) => ({ ...currentState, leagueLogo }));
  };

  const handleLanguageChange = (languageCode) => {
    updateMatchState((currentState) => ({
      ...currentState,
      appLanguage: languageCode,
    }));
  };

  const renumberTrainingSessions = (sessions) => [...sessions]
    .sort((firstTraining, secondTraining) => {
      const byDate = String(firstTraining.date || '').localeCompare(String(secondTraining.date || ''));
      if (byDate !== 0) {
        return byDate;
      }

      return (Number(firstTraining.number) || 0) - (Number(secondTraining.number) || 0);
    })
    .map((training, index) => ({ ...training, number: index + 1 }))
    .sort((firstTraining, secondTraining) => secondTraining.date.localeCompare(firstTraining.date));

  const handleSaveTraining = (training) => {
    updateMatchState((currentState) => {
      const nextTraining = {
        ...training,
        id: training.id || crypto.randomUUID(),
        number: Math.max(1, Number(training.number) || 1),
      };
      const currentTrainingSessions = Array.isArray(currentState.trainingSessions) ? currentState.trainingSessions : [];
      const nextTrainingSessions = [
        ...currentTrainingSessions.filter((item) => item.id !== nextTraining.id && !(item.date === nextTraining.date && item.number === nextTraining.number)),
        nextTraining,
      ];

      return {
        ...currentState,
        trainingSessions: renumberTrainingSessions(nextTrainingSessions),
      };
    });
  };

  const handleDeleteTraining = (trainingId) => {
    updateMatchState((currentState) => {
      const remainingTrainingSessions = (Array.isArray(currentState.trainingSessions) ? currentState.trainingSessions : [])
        .filter((training) => training.id !== trainingId);

      return {
        ...currentState,
        trainingSessions: renumberTrainingSessions(remainingTrainingSessions),
      };
    });
  };

  const handleUpdateTechnicalStaff = (technicalStaff) => {
    const normalizedTechnicalStaff = Array.isArray(technicalStaff)
      ? technicalStaff
        .map((member, index) => {
          if (!member || typeof member !== 'object') {
            return null;
          }

          const name = typeof member.name === 'string' ? member.name.trim() : '';
          if (!name) {
            return null;
          }

          return {
            id: typeof member.id === 'string' && member.id.trim() ? member.id.trim() : `staff-${index}`,
            role: typeof member.role === 'string' && member.role.trim() ? member.role.trim() : 'AUXILIAR',
            name,
          };
        })
        .filter(Boolean)
        .slice(0, 20)
      : [];

    updateMatchState((currentState) => ({
      ...currentState,
      technicalStaff: normalizedTechnicalStaff,
    }));
  };

  const handleLeagueLogoUpload = (event) => {
    const [file] = event.target.files || [];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => handleLeagueLogoChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleTeamAppearanceChange = (field, value) => {
    setEquipmentDraft((currentAppearance) => ({
      ...(currentAppearance || matchState.teamAppearance || DEFAULT_TEAM_APPEARANCE),
      [field]: value,
    }));
  };

  const openEquipment = () => {
    setEquipmentDraft({ ...(matchState.teamAppearance || DEFAULT_TEAM_APPEARANCE) });
    setActiveColorSlot('color');
    setEquipmentOpen((isOpen) => !isOpen);
  };

  const confirmEquipment = () => {
    updateMatchState((currentState) => ({
      ...currentState,
      teamAppearance: equipmentDraft || currentState.teamAppearance || DEFAULT_TEAM_APPEARANCE,
    }));
    setEquipmentOpen(false);
  };

  const handleToggleRunning = () => {
    if (!matchState.lineupConfirmed) {
      handleOpenStartMatch();
      return;
    }

    updateMatchState((currentState) => {
      if (currentState.isRunning) {
        return currentState;
      }

      return {
        ...currentState,
        isRunning: true,
        events: [
          buildEvent('info', currentState.elapsedSeconds > 0 ? 'Partido reanudado' : 'Partido iniciado', 'neutral', [], currentState.elapsedSeconds),
          ...currentState.events,
        ].slice(0, 25),
      };
    });
  };

  const handleOpenStartMatch = () => {
    setStartMatchOpen(false);
    setActiveSection('calendar');
  };

  const handlePause = () => {
    updateMatchState((currentState) => {
      if (!currentState.isRunning) {
        return currentState;
      }

      return {
        ...currentState,
        isRunning: false,
        events: [
          buildEvent('info', 'Partido pausado', 'neutral', [], currentState.elapsedSeconds),
          ...currentState.events,
        ].slice(0, 25),
      };
    });
  };

  const handleEndFirstHalf = () => {
    updateMatchState((currentState) => ({
      ...currentState,
      isRunning: false,
      events: [
        buildEvent('info', 'Primera parte finalizada (manual)', 'neutral', [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
    setHalfTimeNoticeShown(true);
    setFirstHalfAddedConfigured(true);
  };

  const handleStartSecondHalf = () => {
    if (!window.confirm(translateUiText('¿Quieres iniciar la segunda parte?', matchState.appLanguage))) {
      return;
    }

    updateMatchState((currentState) => ({
      ...currentState,
      elapsedSeconds: 45 * 60,
      isRunning: true,
      events: [
        buildEvent('info', 'Segunda parte iniciada (45:00)', 'neutral', [], 45 * 60),
        ...currentState.events,
      ].slice(0, 25),
    }));
    setHalfTimeNoticeShown(true);
    setFirstHalfAddedConfigured(true);
    setFirstHalfAddedMinutes(0);
  };

  const handleAdvanceFiveMinutes = () => {
    updateMatchState((currentState) => ({
      ...currentState,
      elapsedSeconds: Math.max(0, currentState.elapsedSeconds + 5 * 60),
      events: [
        buildEvent('info', 'Reloj adelantado +5 min (prueba)', 'neutral', [], Math.max(0, currentState.elapsedSeconds + 5 * 60)),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleCreateInstantMatch = ({ local, visitor, clubSide }) => {
    const allPlayers = getAvailablePlayers();

    updateMatchState((currentState) => ({
      ...currentState,
      teams: { local, visitor },
      clubSide,
      scores: { local: 0, visitor: 0 },
      elapsedSeconds: 0,
      isRunning: false,
      lineupConfirmed: false,
      roster: {
        local: [],
        bench: allPlayers,
        visitor: [],
        visitorBench: cloneVisitorBenchPlayers(allPlayers),
      },
      ball: { x: 50, y: 50 },
      events: [],
    }));
    setStartMatchOpen(false);
    setStartMatchMode('default');
    setActiveCalendarMatchId(null);
    setEditingHistoryId(null);
    setPlayerActionsConfigOpen(true);
    setFirstHalfAddedMinutes(0);
    setFirstHalfAddedConfigured(false);
    setSecondHalfAddedMinutes(0);
    setSecondHalfAddedConfigured(false);
    setHalfTimeNoticeShown(false);
    setFullTimeNoticeShown(false);
  };

  const handleReset = () => {
    const resetState = createEmptyMatchState();
    const availablePlayers = getAvailablePlayers();
    resetState.teams = { local: '', visitor: '' };
    resetState.clubSide = 'local';
    resetState.clubCrest = matchState.clubCrest;
    resetState.leagueName = matchState.leagueName;
    resetState.leagueLogo = matchState.leagueLogo;
    resetState.teamAppearance = { ...(matchState.teamAppearance || DEFAULT_TEAM_APPEARANCE) };
    resetState.technicalStaff = (matchState.technicalStaff || []).map((member) => ({ ...member }));
    resetState.appLanguage = matchState.appLanguage;
    resetState.enabledPlayerActions = [...(matchState.enabledPlayerActions || [])];
    resetState.calendar = [...matchState.calendar];
    resetState.currentSeason = matchState.currentSeason;
    resetState.previousSeasons = [...matchState.previousSeasons];
    resetState.history = [...matchState.history];
    resetState.trainingSessions = Array.isArray(matchState.trainingSessions) ? [...matchState.trainingSessions] : [];
    resetState.lineupConfirmed = false;
    resetState.roster = {
      local: [],
      bench: availablePlayers,
      visitor: [],
      visitorBench: cloneVisitorBenchPlayers(availablePlayers),
    };
    resetState.scores = { local: 0, visitor: 0 };
    resetState.elapsedSeconds = 0;
    resetState.isRunning = false;
    resetState.ball = { x: 50, y: 50 };
    resetState.events = [buildEvent('reset', 'Marcador reiniciado', 'neutral', [], 0)];
    updateMatchState(() => resetState);
    setActiveCalendarMatchId(null);
    setEditingHistoryId(null);
    setLineupSelectionOpen(false);
    setStartMatchMode('default');
    setStartMatchOpen(false);
    setActiveSection('live');
    setFirstHalfAddedMinutes(0);
    setFirstHalfAddedConfigured(false);
    setSecondHalfAddedMinutes(0);
    setSecondHalfAddedConfigured(false);
    setHalfTimeNoticeShown(false);
    setFullTimeNoticeShown(false);
  };

  const handleAddCalendarMatch = (match) => {
    updateMatchState((currentState) => ({
      ...currentState,
      calendar: [
        ...currentState.calendar,
        { ...match, id: crypto.randomUUID() },
      ].sort((firstMatch, secondMatch) => `${firstMatch.date}T${firstMatch.time}`.localeCompare(`${secondMatch.date}T${secondMatch.time}`)),
    }));
  };

  const handleUpdateCalendarMatch = (matchId, updates) => {
    updateMatchState((currentState) => ({
      ...currentState,
      calendar: currentState.calendar.map((match) =>
        match.id === matchId ? { ...match, ...updates } : match,
      ).sort((firstMatch, secondMatch) => `${firstMatch.date}T${firstMatch.time}`.localeCompare(`${secondMatch.date}T${secondMatch.time}`)),
    }));
  };

  const handleDeleteCalendarMatch = (matchId) => {
    updateMatchState((currentState) => ({
      ...currentState,
      calendar: currentState.calendar.filter((match) => match.id !== matchId),
    }));
  };

  const handleCreateSeason = () => {
    const nextSeason = teamSeasonDraft.trim();
    if (!nextSeason) return;

    if (nextSeason === matchState.currentSeason) {
      setTeamSeasonDraft(nextSeason);
      return;
    }

    updateMatchState((currentState) => ({
      ...currentState,
      calendar: [],
      currentSeason: nextSeason,
      previousSeasons: [
        {
          id: crypto.randomUUID(),
          name: currentState.currentSeason,
          matches: currentState.calendar,
        },
        ...(currentState.previousSeasons || []).filter((season) => season.name !== currentState.currentSeason),
      ],
    }));
    setTeamSeasonDraft(nextSeason);
  };

  const handleSelectCalendarMatch = (match) => {
    setActiveCalendarMatchId(match.id);
    const allPlayers = getAvailablePlayers();
    const isClubVisitor = match.clubSide
      ? match.clubSide === 'visitor'
      : match.visitor.trim().toUpperCase() === CLUB_NAME;

    updateMatchState((currentState) => ({
      ...currentState,
      teams: {
        local: match.local,
        visitor: match.visitor,
      },
      clubSide: isClubVisitor ? 'visitor' : 'local',
      scores: { local: 0, visitor: 0 },
      elapsedSeconds: 0,
      isRunning: false,
      lineupConfirmed: false,
      roster: {
        local: [],
        bench: allPlayers,
        visitor: [],
        visitorBench: cloneVisitorBenchPlayers(allPlayers),
      },
      ball: { x: 50, y: 50 },
      events: [],
    }));
    setCalendarOpen(false);
    setActiveSection('live');
    setStartMatchOpen(false);
    setPlayerActionsConfigOpen(true);
    setSecondHalfAddedMinutes(0);
    setSecondHalfAddedConfigured(false);
    setHalfTimeNoticeShown(false);
    setFullTimeNoticeShown(false);
  };

  const handleConfirmPlayerActionsConfig = () => {
    setPlayerActionsConfigOpen(false);
    setLineupSelectionOpen(true);
  };

  const handleUpdateEnabledPlayerActions = (actions) => {
    updateMatchState((currentState) => ({
      ...currentState,
      enabledPlayerActions: actions,
    }));
  };

  const handleTogglePlayerAction = (actionType) => {
    updateMatchState((currentState) => {
      const current = currentState.enabledPlayerActions || [];
      const updated = current.includes(actionType)
        ? current.filter((type) => type !== actionType)
        : [...current, actionType];
      return {
        ...currentState,
        enabledPlayerActions: updated,
      };
    });
  };

  const handleFinalize = () => {
    setFinalizeConfirmOpen(true);
  };

  const confirmFinalize = () => {
    const calendarMatch = matchState.calendar.find((match) => match.id === activeCalendarMatchId);
    const historyMatch = matchState.history.find((match) => match.id === editingHistoryId);
    const finishedMatch = {
      id: editingHistoryId || crypto.randomUUID(),
      finishedAt: new Date().toLocaleString(getLanguageLocale(matchState.appLanguage)),
      teams: { ...matchState.teams },
      scores: { ...matchState.scores },
      elapsedSeconds: matchState.elapsedSeconds,
      clubSide: matchState.clubSide,
      type: calendarMatch?.type || historyMatch?.type || 'Amistoso',
      teamAppearance: { ...(matchState.teamAppearance || DEFAULT_TEAM_APPEARANCE) },
      events: [...matchState.events],
      roster: {
        local: [...matchState.roster.local],
        bench: [...matchState.roster.bench],
      },
      technicalStaff: (matchState.technicalStaff || []).map((member) => ({ ...member })),
      lineupConfirmed: matchState.lineupConfirmed,
    };

    updateMatchState((currentState) => {
      const preservedSquad = [...(currentState.roster.local || []), ...(currentState.roster.bench || [])]
        .filter((player, index, allPlayers) => allPlayers.findIndex((candidate) => candidate.id === player.id) === index)
        .map((player) => ({
          ...player,
          injured: false,
          yellowCards: 0,
          redCards: 0,
          x: 0,
          y: 0,
        }));

      return {
        ...currentState,
        teams: { local: '', visitor: '' },
        clubSide: 'local',
        scores: { local: 0, visitor: 0 },
        elapsedSeconds: 0,
        isRunning: false,
        lineupConfirmed: false,
        roster: {
          local: [],
          bench: preservedSquad,
          visitor: [],
          visitorBench: cloneVisitorBenchPlayers(preservedSquad),
        },
        ball: { x: 50, y: 50 },
        history: editingHistoryId
          ? currentState.history.map((match) => match.id === editingHistoryId ? finishedMatch : match)
          : [...currentState.history, finishedMatch],
        calendar: activeCalendarMatchId
          ? currentState.calendar.filter((match) => match.id !== activeCalendarMatchId)
          : currentState.calendar,
        events: [],
      };
    });
    setActiveCalendarMatchId(null);
    setEditingHistoryId(null);
    setLineupSelectionOpen(false);
    setStartMatchMode('default');
    setStartMatchOpen(false);
    setActiveSection('live');
    setFirstHalfAddedMinutes(0);
    setFirstHalfAddedConfigured(false);
    setSecondHalfAddedMinutes(0);
    setSecondHalfAddedConfigured(false);
    setHalfTimeNoticeShown(false);
    setFullTimeNoticeShown(false);
    setFinalizeConfirmOpen(false);
  };

  const handleEditHistoryMatch = (historyMatch) => {
    setHistoryEditMatch(historyMatch);
    setHistoryOpen(false);
  };

  const handleSaveHistoryActions = (events) => {
    if (!historyEditMatch) return;

    const countGoals = (eventList, team) => eventList.filter(
      (event) => event.type === 'goal' && event.team === team,
    ).length;
    const originalLocalGoals = countGoals(historyEditMatch.events, 'local');
    const originalVisitorGoals = countGoals(historyEditMatch.events, 'visitor');
    const updatedLocalGoals = countGoals(events, 'local');
    const updatedVisitorGoals = countGoals(events, 'visitor');

    updateMatchState((currentState) => ({
      ...currentState,
      history: currentState.history.map((match) => match.id === historyEditMatch.id ? {
        ...match,
        events,
        scores: {
          local: match.scores.local + updatedLocalGoals - originalLocalGoals,
          visitor: match.scores.visitor + updatedVisitorGoals - originalVisitorGoals,
        },
      } : match),
    }));
    setHistoryEditMatch(null);
  };

  const handleDeleteHistoryMatch = (matchId) => {
    updateMatchState((currentState) => ({
      ...currentState,
      history: currentState.history.filter((match) => match.id !== matchId),
    }));
  };

  const handleConfirmLineup = (selectedIds, absentReasons = {}) => {
    updateMatchState((currentState) => {
      const allPlayers = [...currentState.roster.local, ...currentState.roster.bench];
      const selectedPlayers = allPlayers
        .filter((player) => selectedIds.includes(player.id))
        .sort((firstPlayer, secondPlayer) => Number(secondPlayer.role === 'POR') - Number(firstPlayer.role === 'POR'));
      const playersOnBench = allPlayers.filter((player) => !selectedIds.includes(player.id));
      const fieldPositions = [
        { x: 10, y: 50 },
        { x: 22, y: 20 },
        { x: 22, y: 35 },
        { x: 22, y: 65 },
        { x: 22, y: 80 },
        { x: 45, y: 22 },
        { x: 45, y: 42 },
        { x: 45, y: 58 },
        { x: 45, y: 78 },
        { x: 68, y: 35 },
        { x: 68, y: 65 },
      ];

      return {
        ...currentState,
        lineupConfirmed: true,
        isRunning: false,
        roster: {
          local: selectedPlayers.map((player, index) => ({
            ...player,
            ...fieldPositions[index],
            injured: false,
          })),
          bench: playersOnBench.map((player) => ({ ...player, x: 0, y: 0, absent: absentReasons[player.id] || null })),
          visitor: cloneVisitorPlayers(selectedPlayers.map((player, index) => ({
            ...player,
            ...fieldPositions[index],
          }))),
          visitorBench: cloneVisitorBenchPlayers(playersOnBench).map((player) => ({ ...player, absent: absentReasons[player.id.replace('visitor-', '')] || null })),
        },
      };
    });
    setLineupSelectionOpen(false);
  };

  const handleApplyFormation = (formation, side = 'local') => {
    const positions = FORMATION_POSITIONS[formation];
    if (!positions) return;

    updateMatchState((currentState) => ({
      ...currentState,
      roster: {
        ...currentState.roster,
        local: side === 'local'
          ? currentState.roster.local.map((player, index) => ({
              ...player,
              ...(positions[index] || {}),
            }))
          : currentState.roster.local,
        visitor: side === 'visitor'
          ? currentState.roster.visitor.map((player, index) => ({
              ...player,
              ...(positions[index] ? { x: 100 - positions[index].x, y: positions[index].y } : {}),
            }))
          : currentState.roster.visitor,
      },
      events: currentState.isRunning || currentState.elapsedSeconds > 0
        ? [
            buildEvent('tactics', `Formación ${formation} aplicada al ${side === 'local' ? 'equipo local' : 'visitante'}`, 'neutral', [], currentState.elapsedSeconds),
            ...currentState.events,
          ].slice(0, 25)
        : currentState.events,
    }));
  };

  const handleGoal = (team) => {
    if (team === 'local') {
      setPlayerActionModal({ type: 'goal', team });
      return;
    }

    const side = team === 'local' ? 'local' : 'visitor';

    updateMatchState((currentState) => ({
      ...currentState,
      scores: {
        ...currentState.scores,
        [side]: currentState.scores[side] + 1,
      },
      events: [
        buildEvent('goal', `${currentState.teams[team]} marca gol`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
      ball: {
        x: 50,
        y: 50,
      },
    }));
  };

  const handleAssist = (team) => {
    if (team === 'local') {
      setPlayerActionModal({ type: 'assist', team });
      return;
    }

    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('assist', `${currentState.teams[team]} tiene asistencia`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleCard = (team, color) => {
    if (color === 'red') {
      setRedCardModal({ team });
      return;
    }

    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent(color === 'yellow' ? 'yellow' : 'red', `${currentState.teams[team]} recibe tarjeta ${color}`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const performSubstitution = (team, outgoingPlayerId, incomingPlayerId) => {
    updateMatchState((currentState) => {
      const rosterKey = team === 'visitor' ? 'visitor' : 'local';
      const benchKey = team === 'visitor' ? 'visitorBench' : 'bench';
      const fieldPlayers = currentState.roster[rosterKey] || [];
      const benchPlayers = currentState.roster[benchKey] || [];

      const outgoingPlayer = fieldPlayers.find((player) => player.id === outgoingPlayerId);
      const incomingPlayer = benchPlayers.find((player) => player.id === incomingPlayerId);

      if (!outgoingPlayer || !incomingPlayer) {
        return currentState;
      }

      const nextFieldPlayers = fieldPlayers
        .filter((player) => player.id !== outgoingPlayerId)
        .concat({
          ...incomingPlayer,
          x: outgoingPlayer.x,
          y: outgoingPlayer.y,
          injured: false,
        });

      const nextBenchPlayers = benchPlayers
        .filter((player) => player.id !== incomingPlayerId)
        .concat({
          ...outgoingPlayer,
          x: 0,
          y: 0,
          injured: false,
        });

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          [rosterKey]: nextFieldPlayers,
          [benchKey]: nextBenchPlayers,
        },
        events: [
          buildEvent(
            'substitution',
            `${formatPlayerEventLabel(outgoingPlayer, rosterKey)} sale. Entra ${formatPlayerEventLabel(incomingPlayer, rosterKey)}`,
            getMatchSide(rosterKey, currentState.clubSide),
            [outgoingPlayer, incomingPlayer],
            currentState.elapsedSeconds,
          ),
          ...currentState.events,
        ].slice(0, 25),
      };
    });
  };

  const handleSubstitution = (team, outgoingPlayerId = null) => {
    const rosterKey = team === 'visitor' ? 'visitor' : 'local';
    const benchKey = team === 'visitor' ? 'visitorBench' : 'bench';

    setSubstitutionModal({
      team,
      fieldPlayers: matchState.roster[rosterKey] || [],
      benchPlayers: matchState.roster[benchKey] || [],
      outgoingPlayerId,
      quickVisitor: team === 'visitor' && Boolean(outgoingPlayerId),
    });
  };

  const handleFoul = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('foul', `${currentState.teams[team]} comete falta`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handlePenalty = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('penalty', `${currentState.teams[team]} - Penalti`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleOffside = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('offside', `${currentState.teams[team]} - Fuera de juego`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleCorner = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('corner', `${currentState.teams[team]} - Saque de esquina`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleEditNumber = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('edit-number', `${currentState.teams[team]} - Cambio de dorsal`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleShotOnGoal = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('shot-on-goal', `${currentState.teams[team]} - Tiro a puerta`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleShot = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('shot', `${currentState.teams[team]} - Tiros`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleClearChanceCreated = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('clear-chance-created', `${currentState.teams[team]} - Ocasión clara creada`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleClearChanceMissed = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('clear-chance-missed', `${currentState.teams[team]} - Ocasión clara fallada`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleBallLoss = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('ball-loss', `${currentState.teams[team]} - Pérdida de balón`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleCrosses = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('crosses', `${currentState.teams[team]} - Centros`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleBallRecovery = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('ball-recovery', `${currentState.teams[team]} - Balón recuperado`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleClearance = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('clearance', `${currentState.teams[team]} - Despejes`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleErrorGoal = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('error-goal', `${currentState.teams[team]} - Error provoca gol`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleErrorChance = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('error-chance', `${currentState.teams[team]} - Error provoca ocasión de gol`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleSaves = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('saves', `${currentState.teams[team]} - Paradas`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleOneOnOneWon = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('one-on-one-won', `${currentState.teams[team]} - Uno contra uno ganado`, team, [], currentState.elapsedSeconds),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleManualScoreChange = (team, value) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;

    updateMatchState((currentState) => ({
      ...currentState,
      scores: {
        ...currentState.scores,
        [team]: safeValue,
      },
    }));
  };

  const handleAddPlayer = (side, player = null) => {
    const rawPlayer = player || {
      number: 99,
      name: 'Nueva jugadora',
      role: 'DEL',
    };

    const newPlayer = {
      id: rawPlayer.id || crypto.randomUUID(),
      number: Number(rawPlayer.number) || 1,
      name: typeof rawPlayer.name === 'string' && rawPlayer.name.trim() ? rawPlayer.name.trim() : 'Nueva jugadora',
      role: rawPlayer.role || 'DEL',
      injured: Boolean(rawPlayer.injured),
      yellowCards: 0,
      redCards: 0,
      x: 0,
      y: 0,
    };

    updateMatchState((currentState) => {
      const bench = currentState.roster.bench || [];

      const isPlaceholder = (p) => {
        const name = p.name?.trim() || '';
        return !name || /^(Suplente|Portera|Defensa|Media|Medio|Delantera|Nueva jugadora)\s*\d*$/i.test(name);
      };

      const genericBenchIndex = bench.findIndex(isPlaceholder);

      let newBench;
      if (genericBenchIndex >= 0) {
        newBench = [...bench];
        newBench[genericBenchIndex] = newPlayer;
      } else {
        newBench = [...bench, newPlayer];
      }

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          bench: newBench,
        },
      };
    });
  };

  const handleUpdatePlayer = (side, playerId, updates) => {
    const safeName = typeof updates.name === 'string' ? updates.name.trim() : '';

    updateMatchState((currentState) => {
      const resolvePlayerName = (player) => {
        if (safeName) {
          return safeName;
        }

        if (player?.name?.trim()) {
          return player.name.trim();
        }

        return `Jugadora ${Number(updates.number) || Number(player?.number) || 1}`;
      };

      const normalizedUpdates = {
        ...updates,
        name: safeName || 'Jugadora',
        number: Number(updates.number) || 1,
        role: updates.role || 'MED',
      };

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          local: currentState.roster.local.map((player) =>
            player.id === playerId
              ? { ...player, ...normalizedUpdates, name: resolvePlayerName(player) }
              : player,
          ),
          bench: currentState.roster.bench.map((player) =>
            player.id === playerId
              ? { ...player, ...normalizedUpdates, name: resolvePlayerName(player) }
              : player,
          ),
        },
      };
    });
  };

  const handleMovePlayer = (side, playerId, target) => {
    updateMatchState((currentState) => {
      const playerToMove = [...currentState.roster.local, ...currentState.roster.bench].find(
        (player) => player.id === playerId,
      );

      if (!playerToMove) {
        return currentState;
      }

      const nextLocal = currentState.roster.local.filter((player) => player.id !== playerId);
      const nextBench = currentState.roster.bench.filter((player) => player.id !== playerId);

      if (target === 'starter') {
        return {
          ...currentState,
          roster: {
            local: [...nextLocal, { ...playerToMove, x: 50, y: 50 }],
            bench: nextBench,
          },
        };
      }

      return {
        ...currentState,
        roster: {
          local: nextLocal,
          bench: [...nextBench, { ...playerToMove, x: 0, y: 0 }],
        },
      };
    });
  };

  const handlePlayerMove = (playerId, position, team = 'local') => {
    updateMatchState((currentState) => {
      const teamRoster = currentState.roster[team] || [];

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          [team]: teamRoster.map((player) =>
            player.id === playerId ? { ...player, ...position } : player,
          ),
        },
      };
    });
  };

  const handleTacticsBoardMove = (playerId, position, team = 'local') => {
    const rosterKey = team === 'visitor' ? 'visitor' : 'local';

    updateMatchState((currentState) => {
      const teamRoster = currentState.roster[rosterKey] || [];

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          [rosterKey]: teamRoster.map((player) =>
            player.id === playerId ? { ...player, x: position.x, y: position.y } : player,
          ),
        },
      };
    });
  };

  const handleTacticsBallMove = (position) => {
    updateMatchState((currentState) => ({
      ...currentState,
      ball: position,
    }));
  };

  const handleInjurySubstitution = (substituteId) => {
    if (!injuredPlayerModal) return;

    const { player: injuredPlayer, team = 'local' } = injuredPlayerModal;
    const rosterKey = team === 'visitor' ? 'visitor' : 'local';
    const benchKey = team === 'visitor' ? 'visitorBench' : 'bench';

    updateMatchState((currentState) => {
      const substitute = (currentState.roster[benchKey] || []).find((p) => p.id === substituteId);
      if (!substitute) return currentState;

      const updatedInjured = { ...injuredPlayer, injured: true };
      const nextStarters = (currentState.roster[rosterKey] || []).map((p) =>
        p.id === injuredPlayer.id ? updatedInjured : p,
      );
      const startersWithoutInjured = nextStarters.filter((p) => p.id !== injuredPlayer.id);
      const benchWithInjured = [
        ...(currentState.roster[benchKey] || []).filter((p) => p.id !== injuredPlayer.id),
        updatedInjured,
      ];

      const substituteIntoField = {
        ...substitute,
        x: injuredPlayer.x,
        y: injuredPlayer.y,
        injured: false,
      };
      const benchWithoutSubstitute = benchWithInjured.filter((p) => p.id !== substituteId);

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          [rosterKey]: [...startersWithoutInjured, substituteIntoField],
          [benchKey]: benchWithoutSubstitute,
        },
        events: [
          ...currentState.events,
          buildEvent(
            'substitution',
            `${formatPlayerEventLabel(injuredPlayer, rosterKey)} sale por lesión. Entra ${formatPlayerEventLabel(substitute, rosterKey)}`,
            getMatchSide(rosterKey, currentState.clubSide),
            [injuredPlayer, substitute],
            currentState.elapsedSeconds,
          ),
        ],
      };
    });

    setInjuredPlayerModal(null);
  };

  const handleSelectTeamAction = (team, actionType) => {
    setActiveSelectedAction((prev) =>
      prev && prev.team === team && prev.type === actionType ? null : { team, type: actionType },
    );
  };

  const applyActionToPlayer = (player, team, actionType) => {
    const rosterKey = team === 'visitor' ? 'visitor' : 'local';
    const benchKey = team === 'visitor' ? 'visitorBench' : 'bench';

    if (actionType === 'yellow') {
      handleYellowCardClick(player, team);
      return;
    }

    if (actionType === 'red') {
      handleRedCardClick(player);
      return;
    }

    if (actionType === 'substitution') {
      setSubstitutionModal({
        team,
        fieldPlayers: matchState.roster[rosterKey] || [],
        benchPlayers: matchState.roster[benchKey] || [],
        outgoingPlayerId: player.id,
        quickVisitor: team === 'visitor',
      });
      return;
    }

    if (actionType === 'injury') {
      setSelectingInjured(false);
      updateMatchState((currentState) => ({
        ...currentState,
        roster: {
          ...currentState.roster,
          [rosterKey]: (currentState.roster[rosterKey] || []).map((p) =>
            p.id === player.id ? { ...p, injured: true } : p,
          ),
        },
      }));
      setInjuredPlayerModal({ player: { ...player, injured: true }, team });
      return;
    }

    if (actionType === 'edit-number') {
      const nextNumber = Number(window.prompt(translateUiText(`Nuevo dorsal para ${player.name}`, matchState.appLanguage), player.number));
      if (Number.isFinite(nextNumber) && nextNumber > 0) {
        updateMatchState((currentState) => ({
          ...currentState,
          roster: {
            ...currentState.roster,
            [rosterKey]: (currentState.roster[rosterKey] || []).map((item) =>
              item.id === player.id ? { ...item, number: nextNumber } : item,
            ),
          },
        }));
      }
      return;
    }

    updateMatchState((currentState) => {
      const matchSide = getMatchSide(rosterKey, currentState.clubSide);
      const selectedPlayer = (currentState.roster[rosterKey] || []).find((item) => item.id === player.id) || player;
      const actionItem = PLAYER_ACTIONS.find((a) => a.type === actionType);
      const actionLabelText = actionItem ? actionItem.label : actionType;

      const playerLabel = rosterKey === 'visitor' ? `${selectedPlayer.number}` : selectedPlayer.name;
      const eventText = rosterKey === 'visitor'
        ? `${selectedPlayer.number} - ${actionLabelText}`
        : `${playerLabel} (#${selectedPlayer.number}) - ${actionLabelText}`;

      const nextState = {
        ...currentState,
        events: [
          buildEvent(
            actionType,
            eventText,
            matchSide,
            [selectedPlayer],
            currentState.elapsedSeconds,
          ),
          ...currentState.events,
        ].slice(0, 25),
      };

      if (actionType === 'goal') {
        nextState.scores = {
          ...currentState.scores,
          [matchSide]: currentState.scores[matchSide] + 1,
        };
        nextState.ball = { x: 50, y: 50 };
      }

      return nextState;
    });
  };

  const handlePlayerClick = (player, team = 'local') => {
    if (selectingInjured) {
      updateMatchState((currentState) => {
        const rosterKey = team === 'visitor' ? 'visitor' : 'local';
        const benchKey = team === 'visitor' ? 'visitorBench' : 'bench';
        const isBenchPlayer = (currentState.roster[benchKey] || []).some((p) => p.id === player.id);

        return {
          ...currentState,
          roster: {
            ...currentState.roster,
            [isBenchPlayer ? benchKey : rosterKey]: (currentState.roster[isBenchPlayer ? benchKey : rosterKey] || []).map((p) =>
              p.id === player.id ? { ...p, injured: true } : p,
            ),
          },
        };
      });
      setSelectingInjured(false);
      setInjuredPlayerModal({ player: { ...player, injured: true }, team });
      return;
    }

    setPlayerActionMenu({ player, team, selectedAction: player.selectedAction || null });
  };

  const handlePlayerAction = (actionType) => {
    const currentSelection = playerActionMenu;
    if (!currentSelection) return;

    const { player, team } = currentSelection;
    const rosterKey = team === 'visitor' ? 'visitor' : 'local';
    const benchKey = team === 'visitor' ? 'visitorBench' : 'bench';

    if (currentSelection.selectedAction === actionType) {
      updateMatchState((currentState) => ({
        ...currentState,
        roster: {
          ...currentState.roster,
          [rosterKey]: (currentState.roster[rosterKey] || []).map((item) => item.id === player.id ? { ...item, selectedAction: null } : item),
          [benchKey]: (currentState.roster[benchKey] || []).map((item) => item.id === player.id ? { ...item, selectedAction: null } : item),
        },
      }));
      setPlayerActionMenu(null);
      return;
    }

    updateMatchState((currentState) => ({
      ...currentState,
      roster: {
        ...currentState.roster,
        [rosterKey]: (currentState.roster[rosterKey] || []).map((item) => item.id === player.id ? { ...item, selectedAction: actionType } : item),
        [benchKey]: (currentState.roster[benchKey] || []).map((item) => item.id === player.id ? { ...item, selectedAction: actionType } : item),
      },
    }));

    if (actionType === 'yellow') {
      handleYellowCardClick(player, team);
      setPlayerActionMenu(null);
      return;
    }

    if (actionType === 'substitution') {
      setSubstitutionModal({
        team,
        fieldPlayers: matchState.roster[rosterKey] || [],
        benchPlayers: matchState.roster[benchKey] || [],
        outgoingPlayerId: player.id,
        quickVisitor: team === 'visitor',
      });
      setPlayerActionMenu(null);
      return;
    }

    if (actionType === 'edit-number') {
      const nextNumber = Number(window.prompt(translateUiText(`Nuevo dorsal para ${player.name}`, matchState.appLanguage), player.number));
      if (Number.isFinite(nextNumber) && nextNumber > 0) {
        updateMatchState((currentState) => ({
          ...currentState,
          roster: {
            ...currentState.roster,
            [rosterKey]: (currentState.roster[rosterKey] || []).map((item) =>
              item.id === player.id ? { ...item, number: nextNumber } : item,
            ),
          },
        }));
      }
      setPlayerActionMenu(null);
      return;
    }

    updateMatchState((currentState) => {
      const matchSide = getMatchSide(rosterKey, currentState.clubSide);
      const selectedPlayer = (currentState.roster[rosterKey] || []).find((item) => item.id === player.id);
      if (!selectedPlayer) return currentState;

      if (actionType === 'goal' || actionType === 'assist') {
        const actionLabel = actionType === 'goal' ? 'marca gol' : 'da asistencia';
        const nextState = {
          ...currentState,
          events: [
            buildEvent(actionType, `${formatPlayerEventLabel(selectedPlayer, rosterKey)} ${actionLabel}`, matchSide, [selectedPlayer], currentState.elapsedSeconds),
            ...currentState.events,
          ].slice(0, 25),
        };

        if (actionType === 'goal') {
          nextState.scores = {
            ...currentState.scores,
            [matchSide]: currentState.scores[matchSide] + 1,
          };
          nextState.ball = { x: 50, y: 50 };
        }
        return nextState;
      }

      if (actionType === 'red') {
        if (team === 'local') {
          const expelledPlayer = {
            ...selectedPlayer,
            injured: false,
            redCards: (selectedPlayer.redCards || 0) + 1,
          };
          return {
            ...currentState,
            roster: {
              ...currentState.roster,
              local: currentState.roster.local.filter((item) => item.id !== player.id),
              bench: [...currentState.roster.bench, expelledPlayer],
            },
            events: [
              buildEvent('red', `${formatPlayerEventLabel(selectedPlayer, rosterKey)} recibe tarjeta roja y es expulsada`, matchSide, [selectedPlayer], currentState.elapsedSeconds),
              ...currentState.events,
            ].slice(0, 25),
          };
        }

        return {
          ...currentState,
          roster: {
            ...currentState.roster,
            visitor: (currentState.roster.visitor || []).filter((item) => item.id !== player.id),
            visitorBench: [
              ...(currentState.roster.visitorBench || []),
              { ...selectedPlayer, redCards: (selectedPlayer.redCards || 0) + 1, injured: false, x: 0, y: 0 },
            ],
          },
          events: [
            buildEvent('red', `${formatPlayerEventLabel(selectedPlayer, rosterKey)} recibe tarjeta roja y es expulsada`, matchSide, [selectedPlayer], currentState.elapsedSeconds),
            ...currentState.events,
          ].slice(0, 25),
        };
      }

      const genericAction = PLAYER_ACTIONS.find((action) => action.type === actionType);
      if (genericAction && ['foul', 'penalty', 'offside', 'corner'].includes(actionType)) {
        return {
          ...currentState,
          events: [
            buildEvent(actionType, `${formatPlayerEventLabel(selectedPlayer, rosterKey)}: ${genericAction.label}`, matchSide, [selectedPlayer], currentState.elapsedSeconds),
            ...currentState.events,
          ].slice(0, 25),
        };
      }

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          [rosterKey]: (currentState.roster[rosterKey] || []).map((item) =>
            item.id === player.id ? { ...item, injured: true } : item,
          ),
        },
        events: [
          buildEvent('injury', `${formatPlayerEventLabel(selectedPlayer, rosterKey)} se lesiona`, matchSide, [selectedPlayer], currentState.elapsedSeconds),
          ...currentState.events,
        ].slice(0, 25),
      };
    });

    if (actionType === 'injury') {
      setInjuredPlayerModal({ player: { ...player, injured: true }, team });
    }
    setPlayerActionMenu(null);
  };

  const handleInitiateInjury = () => {
    setSelectingInjured(!selectingInjured);
    setInjuredPlayerModal(null);
  };

  const handleYellowCardClick = (player, team = 'local') => {
    updateMatchState((currentState) => {
      const rosterKey = team === 'visitor' ? 'visitor' : 'local';
      const matchSide = getMatchSide(rosterKey, currentState.clubSide);
      const playerIndex = (currentState.roster[rosterKey] || []).findIndex((p) => p.id === player.id);
      let updatedPlayer = null;
      let updatedRoster = { ...currentState.roster };
      let eventLabel = '';
      let eventType = 'yellow';

      if (playerIndex !== -1) {
        updatedPlayer = { ...(currentState.roster[rosterKey] || [])[playerIndex] };
        updatedPlayer.yellowCards = (updatedPlayer.yellowCards || 0) + 1;

        if (updatedPlayer.yellowCards >= 2) {
          updatedPlayer.injured = false;
          updatedPlayer.redCards = (updatedPlayer.redCards || 0) + 1;
          if (team === 'local') {
            const nextLocal = currentState.roster.local.filter((p) => p.id !== player.id);
            updatedRoster = {
              ...currentState.roster,
              local: nextLocal,
              bench: [...currentState.roster.bench, updatedPlayer],
            };
          } else {
            updatedRoster = {
              ...currentState.roster,
              visitor: (currentState.roster.visitor || []).filter((p) => p.id !== player.id),
              visitorBench: [
                ...(currentState.roster.visitorBench || []),
                { ...updatedPlayer, x: 0, y: 0 },
              ],
            };
          }
          eventType = 'red';
          eventLabel = `${formatPlayerEventLabel(updatedPlayer, rosterKey)} recibe segunda tarjeta amarilla y es expulsada`;
        } else {
          const nextRoster = (currentState.roster[rosterKey] || []).map((p) =>
            p.id === player.id ? updatedPlayer : p,
          );
          updatedRoster = {
            ...currentState.roster,
            [rosterKey]: nextRoster,
          };
          eventLabel = `${formatPlayerEventLabel(updatedPlayer, rosterKey)} recibe tarjeta amarilla`;
        }
      } else {
        const benchIndex = currentState.roster.bench.findIndex((p) => p.id === player.id);
        if (benchIndex !== -1) {
          updatedPlayer = { ...currentState.roster.bench[benchIndex] };
          updatedPlayer.yellowCards = (updatedPlayer.yellowCards || 0) + 1;

          const nextBench = currentState.roster.bench.map((p) =>
            p.id === player.id ? updatedPlayer : p,
          );
          updatedRoster = {
            ...currentState.roster,
            bench: nextBench,
          };
          eventLabel = `${formatPlayerEventLabel(updatedPlayer, 'local')} recibe tarjeta amarilla`;
        }
      }

      return {
        ...currentState,
        roster: updatedRoster,
        events: [buildEvent(eventType, eventLabel, matchSide, updatedPlayer ? [updatedPlayer] : [], currentState.elapsedSeconds), ...currentState.events].slice(0, 25),
      };
    });

    setYellowCardModal(false);
  };

  const handleRedCardClick = (player) => {
    if (!redCardModal) return;

    updateMatchState((currentState) => {
      const playerToExpel = currentState.roster.local.find((p) => p.id === player.id);
      if (!playerToExpel) return currentState;

      const expelledPlayer = {
        ...playerToExpel,
        injured: false,
        redCards: (playerToExpel.redCards || 0) + 1,
      };

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          local: currentState.roster.local.filter((p) => p.id !== player.id),
          bench: [...currentState.roster.bench, expelledPlayer],
        },
        events: [
          buildEvent(
            'red',
            `${playerToExpel.name} recibe tarjeta roja y es expulsada`,
            redCardModal.team,
            [playerToExpel],
            currentState.elapsedSeconds,
          ),
          ...currentState.events,
        ].slice(0, 25),
      };
    });

    setRedCardModal(null);
  };

  const handlePlayerActionClick = (player) => {
    if (!playerActionModal) return;

    updateMatchState((currentState) => {
      const selectedPlayer = currentState.roster.local.find((p) => p.id === player.id);
      if (!selectedPlayer) return currentState;

      const actionLabel = playerActionModal.type === 'goal' ? 'marca gol' : 'da asistencia';
      const matchSide = getMatchSide('local', currentState.clubSide);
      const nextState = {
        ...currentState,
        events: [
          buildEvent(
            playerActionModal.type,
            `${selectedPlayer.name} (#${selectedPlayer.number}) ${actionLabel}`,
            matchSide,
            [selectedPlayer],
            currentState.elapsedSeconds,
          ),
          ...currentState.events,
        ].slice(0, 25),
      };

      if (playerActionModal.type === 'goal') {
        nextState.scores = {
          ...currentState.scores,
          [matchSide]: currentState.scores[matchSide] + 1,
        };
        nextState.ball = { x: 50, y: 50 };
      }

      return nextState;
    });

    setPlayerActionModal(null);
  };

  const handleInitiateYellowCard = () => {
    setYellowCardModal(true);
  };

  const tacticsRoster = useMemo(() => {
    const hasPlayersInRoster = [
      ...(matchState.roster.local || []),
      ...(matchState.roster.bench || []),
      ...(matchState.roster.visitor || []),
      ...(matchState.roster.visitorBench || []),
    ].length > 0;

    if (hasPlayersInRoster) {
      return matchState.roster;
    }

    const fallbackPlayers = getAvailablePlayers();

    return {
      ...matchState.roster,
      local: [],
      bench: fallbackPlayers,
      visitor: [],
      visitorBench: cloneVisitorBenchPlayers(fallbackPlayers),
    };
  }, [matchState]);

  return (
    <main className="app-shell" ref={appRootRef}>
      <div className="app-frame">
        <nav className="app-navigation" aria-label="Secciones principales">
          <div className="app-navigation-brand">{uiCopy.navBrand}</div>
          <button key="live" type="button" className={`app-navigation-item ${activeSection === 'live' ? 'active' : ''}`} onClick={() => setActiveSection('live')}><span aria-hidden="true">●</span>{uiCopy.navLive}</button>
          <button key="team" type="button" className={`app-navigation-item ${activeSection === 'team' ? 'active' : ''}`} onClick={() => setActiveSection('team')}><span aria-hidden="true">♙</span>{uiCopy.navTeam}</button>
          <button key="tactics" type="button" className={`app-navigation-item ${activeSection === 'tactics' ? 'active' : ''}`} onClick={() => setActiveSection('tactics')}><span aria-hidden="true">⌘</span>{uiCopy.navTactics}</button>
          <button key="calendar" type="button" className={`app-navigation-item ${activeSection === 'calendar' ? 'active' : ''}`} onClick={() => setActiveSection('calendar')}><span aria-hidden="true">□</span>{uiCopy.navCalendar}</button>
          <button key="history" type="button" className={`app-navigation-item ${activeSection === 'history' ? 'active' : ''}`} onClick={() => setActiveSection('history')}><span aria-hidden="true">≡</span>{uiCopy.navHistory}</button>
          <button key="training" type="button" className={`app-navigation-item ${activeSection === 'training' ? 'active' : ''}`} onClick={() => setActiveSection('training')}><span aria-hidden="true">▦</span>{uiCopy.navTraining}</button>
          <button key="languages" type="button" className={`app-navigation-item ${activeSection === 'languages' ? 'active' : ''}`} onClick={() => setActiveSection('languages')}><span aria-hidden="true">🌐</span>{uiCopy.navLanguages}</button>
        </nav>

        <div className="app-workspace">
          {activeSection === 'live' && (
            <section className="live-view" aria-label="Partido en directo">
              <MatchHeader
                teams={matchState.teams}
                scores={matchState.scores}
                elapsedSeconds={matchState.elapsedSeconds}
                clubSide={matchState.clubSide}
                clubCrest={matchState.clubCrest}
                showTeams={Boolean(activeCalendarMatchId)}
              />

              <div className="status-bar">
                <span>{summary.status}</span>
                <span>{summary.totalGoals} goles</span>
              </div>

              <div className="pitch-section">
                <ControlPanel
                  isRunning={matchState.isRunning}
                  elapsedSeconds={matchState.elapsedSeconds}
                  lineupConfirmed={matchState.lineupConfirmed}
                  onStartMatch={handleOpenStartMatch}
                  onToggleRunning={handleToggleRunning}
                  onPause={handlePause}
                  onEndFirstHalf={handleEndFirstHalf}
                  onStartSecondHalf={handleStartSecondHalf}
                  onAdvanceFiveMinutes={handleAdvanceFiveMinutes}
                  onReset={handleReset}
                  enabledPlayerActions={matchState.enabledPlayerActions}
                  onTogglePlayerAction={handleTogglePlayerAction}
                  onFinalize={handleFinalize}
                  selectingInjured={selectingInjured}
                  onInitiateInjury={handleInitiateInjury}
                  teamAppearance={matchState.teamAppearance}
                />
                <PitchField
                  teams={matchState.teams}
                  clubSide={matchState.clubSide}
                  roster={matchState.roster}
                  ball={matchState.ball}
                  onPlayerClick={handlePlayerClick}
                  onPlayerMove={handlePlayerMove}
                  onApplyFormation={handleApplyFormation}
                  selectingInjured={selectingInjured}
                  showPlayerNames={true}
                  teamAppearance={matchState.teamAppearance}
                />
              </div>

              <div className="content-grid">
                <MatchEvents
                  events={matchState.events}
                  teamAppearance={matchState.teamAppearance}
                  enabledPlayerActions={matchState.enabledPlayerActions}
                  onUpdatePlayerActions={handleTogglePlayerAction}
                />
              </div>
            </section>
          )}

          {activeSection === 'team' && (
            <section className="team-view" aria-label="Mi equipo">
              <header className="section-heading">
                <div>
                  <h1>Mi equipo</h1>
                  <p>Gestiona la identidad del club, la temporada y la plantilla.</p>
                </div>
              </header>
              <section className="team-details-panel" aria-label="Datos del club">
                <label className="club-name-field season-name-field">
                  Temporada actual
                  <input value={teamSeasonDraft || matchState.currentSeason} onChange={(event) => setTeamSeasonDraft(event.target.value)} placeholder="2026-2027" />
                  <button type="button" onClick={handleCreateSeason}>Crear temporada</button>
                </label>
              </section>
              <div className="identity-managers">
                <section className="club-crest-manager" aria-label="Escudo del club">
                  <img className="club-crest-preview" src={matchState.clubCrest} alt={`Escudo de ${matchState.teams[matchState.clubSide]}`} />
                  <div className="club-crest-controls">
                    <label className="club-name-field">
                      Nombre del club
                      <input value={matchState.teams[matchState.clubSide]} onChange={(event) => handleTeamNameChange(matchState.clubSide, event.target.value)} />
                    </label>
                    <strong>Escudo del club</strong>
                    <label className="crest-upload-button">
                      Subir imagen
                      <input type="file" accept="image/*" onChange={handleClubCrestUpload} />
                    </label>
                    <label className="crest-url-field">
                      URL de imagen
                      <input value={matchState.clubCrest.startsWith('data:') ? '' : matchState.clubCrest} onChange={(event) => handleClubCrestChange(event.target.value)} placeholder="https://..." />
                    </label>
                  </div>
                </section>
                <section className="club-crest-manager league-logo-manager" aria-label="Liga">
                  <img className="club-crest-preview" src={matchState.leagueLogo || DEFAULT_LEAGUE_LOGO} alt={`Logo de ${matchState.leagueName || 'la liga'}`} />
                  <div className="club-crest-controls">
                    <label className="club-name-field">
                      Nombre de la liga
                      <input value={matchState.leagueName} onChange={(event) => handleLeagueNameChange(event.target.value)} placeholder="Nombre de la liga" />
                    </label>
                    <strong>Logo de la liga</strong>
                    <label className="crest-upload-button">
                      Subir imagen
                      <input type="file" accept="image/*" onChange={handleLeagueLogoUpload} />
                    </label>
                    <label className="crest-url-field">
                      URL de imagen
                      <input value={matchState.leagueLogo.startsWith('data:') ? '' : matchState.leagueLogo} onChange={(event) => handleLeagueLogoChange(event.target.value)} placeholder="https://..." />
                    </label>
                  </div>
                </section>
              </div>
              <RosterPanel
                teams={matchState.teams}
                roster={matchState.roster}
                technicalStaff={matchState.technicalStaff}
                onAddPlayer={handleAddPlayer}
                onUpdatePlayer={handleUpdatePlayer}
                onMovePlayer={handleMovePlayer}
                onUpdateTechnicalStaff={handleUpdateTechnicalStaff}
                onSelectLineup={() => setLineupSelectionOpen(true)}
                lineupConfirmed={matchState.lineupConfirmed}
                managementOnly={true}
              />
              <section className="equipment-panel" aria-label="Equipación">
                <div className="equipment-heading">
                  <div>
                    <h2>Equipación</h2>
                    <p>Elige el color y la forma de tus jugadoras.</p>
                  </div>
                  <button type="button" className="secondary-button equipment-toggle" onClick={openEquipment} aria-expanded={equipmentOpen}>
                    {equipmentOpen ? '− Ocultar' : '+ Equipación'}
                  </button>
                </div>
                {equipmentOpen && (
                  <div className="equipment-controls">
                    <div className="equipment-colors">
                      <strong>Color</strong>
                      <div className="color-swatches" role="radiogroup" aria-label="Color de la equipación">
                        {['#facc15', '#ef4444', '#22c55e', '#2563eb', '#111827', '#f8fafc', '#f97316', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b', '#92400e'].map((color) => (
                          <button type="button" key={color} className={`color-swatch ${equipmentDraft?.[activeColorSlot] === color ? 'selected' : ''}`} style={{ backgroundColor: color }} onClick={() => handleTeamAppearanceChange(activeColorSlot, color)} aria-label={`${activeColorSlot === 'color' ? 'Color principal' : 'Color secundario'} ${color}`} aria-pressed={equipmentDraft?.[activeColorSlot] === color} />
                        ))}
                      </div>
                      <div className="color-slot-options">
                        <button type="button" className={activeColorSlot === 'color' ? 'active' : ''} onClick={() => setActiveColorSlot('color')}>Color principal</button>
                        <button type="button" className={activeColorSlot === 'secondaryColor' ? 'active' : ''} onClick={() => setActiveColorSlot('secondaryColor')}>Color secundario</button>
                      </div>
                    </div>
                    <div className="equipment-shapes">
                      <strong>Forma de las jugadoras</strong>
                      <div className="shape-options" role="radiogroup" aria-label="Forma de la equipación">
                        <span className="shape-option selected"><span className="appearance-preview ball-shape" aria-hidden="true" />Esfera</span>
                      </div>
                    </div>
                    <button type="button" className="primary-button equipment-confirm-button" onClick={confirmEquipment}>Confirmar equipación</button>
                  </div>
                )}
              </section>
            </section>
          )}

          {activeSection === 'history' && (
            <HistoryDashboard matches={matchState.history} teamAppearance={matchState.teamAppearance} clubCrest={matchState.clubCrest} appLanguage={matchState.appLanguage} onEditMatch={handleEditHistoryMatch} onDeleteMatch={handleDeleteHistoryMatch} />
          )}

          {activeSection === 'training' && (
            <TrainingDashboard
              roster={tacticsRoster}
              trainingSessions={matchState.trainingSessions}
              onSaveTraining={handleSaveTraining}
              onDeleteTraining={handleDeleteTraining}
              appLanguage={matchState.appLanguage}
            />
          )}

          {activeSection === 'languages' && (
            <section className="languages-view" aria-label="Idiomas de la aplicacion">
              <header className="section-heading">
                <div>
                  <h1>{uiCopy.languagesTitle}</h1>
                  <p>{uiCopy.languagesSubtitle}</p>
                </div>
              </header>
              <section className="languages-panel" aria-label="Selector de idioma">
                <p className="languages-current"><strong>{uiCopy.languagesCurrent}:</strong> {(LANGUAGE_OPTIONS.find((option) => option.code === matchState.appLanguage)?.nativeLabel) || 'Espanol'}</p>
                <div className="languages-grid">
                  {LANGUAGE_OPTIONS.map((languageOption) => (
                    <button
                      key={languageOption.code}
                      type="button"
                      className={`language-card ${matchState.appLanguage === languageOption.code ? 'active' : ''}`}
                      onClick={() => handleLanguageChange(languageOption.code)}
                      aria-pressed={matchState.appLanguage === languageOption.code}
                    >
                      <strong>{languageOption.nativeLabel}</strong>
                      <small>{languageOption.label}</small>
                      <span>{languageOption.region}</span>
                    </button>
                  ))}
                </div>
                <p className="languages-note">{uiCopy.languagesRoadmap}</p>
              </section>
            </section>
          )}
        </div>
      </div>

      {(tacticsBoardOpen || activeSection === 'tactics') && (
        <TacticsBoardModal
          roster={tacticsRoster}
          ball={matchState.ball}
          teamAppearance={matchState.teamAppearance}
          onClose={() => {
            setTacticsBoardOpen(false);
            setActiveSection('live');
          }}
          onMovePlayer={handleTacticsBoardMove}
          onMoveBall={handleTacticsBallMove}
          onApplyFormation={handleApplyFormation}
        />
      )}

      {substitutionModal && (
        <SubstitutionModal
          fieldPlayers={substitutionModal.fieldPlayers}
          benchPlayers={substitutionModal.benchPlayers}
          isVisitor={substitutionModal.team === 'visitor'}
          outgoingPlayerId={substitutionModal.outgoingPlayerId || null}
          onSubstitute={(outgoingPlayerId, incomingPlayerId) => {
            performSubstitution(substitutionModal.team, outgoingPlayerId, incomingPlayerId);
            setSubstitutionModal(null);
          }}
          onCancel={() => setSubstitutionModal(null)}
        />
      )}

      {injuredPlayerModal && (
        <SubstitutionModal
          injuredPlayer={injuredPlayerModal.player}
          isVisitor={injuredPlayerModal.team === 'visitor'}
          benchPlayers={injuredPlayerModal.team === 'visitor'
            ? (matchState.roster.visitorBench || [])
            : matchState.roster.bench}
          onSubstitute={handleInjurySubstitution}
          onCancel={() => setInjuredPlayerModal(null)}
        />
      )}

      {yellowCardModal && (
        <YellowCardModal
          allPlayers={[...matchState.roster.local, ...matchState.roster.bench]}
          onSelectPlayer={handleYellowCardClick}
          onCancel={() => setYellowCardModal(false)}
        />
      )}

      {playerActionMenu && (
        <PlayerActionMenuModal
          player={playerActionMenu.player}
          team={playerActionMenu.team}
          onSelectAction={handlePlayerAction}
          onCancel={() => setPlayerActionMenu(null)}
          enabledPlayerActions={matchState.enabledPlayerActions}
          selectedAction={playerActionMenu.selectedAction || playerActionMenu.player?.selectedAction || null}
        />
      )}

      {redCardModal && (
        <RedCardModal
          fieldPlayers={matchState.roster.local}
          onSelectPlayer={handleRedCardClick}
          onCancel={() => setRedCardModal(null)}
        />
      )}

      {playerActionModal && (
        <PlayerActionModal
          actionType={playerActionModal.type}
          fieldPlayers={matchState.roster.local}
          onSelectPlayer={handlePlayerActionClick}
          onCancel={() => setPlayerActionModal(null)}
        />
      )}

      {lineupSelectionOpen && (
        <LineupModal
          players={[...matchState.roster.local, ...matchState.roster.bench].sort(
            (firstPlayer, secondPlayer) => firstPlayer.number - secondPlayer.number,
          )}
          initialSelectedIds={matchState.roster.local.map((player) => player.id)}
          onConfirm={handleConfirmLineup}
          onCancel={() => setLineupSelectionOpen(false)}
          canCancel={true}
        />
      )}

      {startMatchOpen && (
        <StartMatchModal
          matches={matchState.calendar}
          isFreshStart={startMatchMode === 'fresh'}
          onSelectCalendarMatch={handleSelectCalendarMatch}
          onCreateInstant={handleCreateInstantMatch}
          onClose={() => {
            setStartMatchOpen(false);
            setStartMatchMode('default');
          }}
        />
      )}

      {playerActionsConfigOpen && (
        <PlayerActionsConfigModal
          enabledActions={matchState.enabledPlayerActions}
          onUpdateActions={handleUpdateEnabledPlayerActions}
          onConfirm={handleConfirmPlayerActionsConfig}
          onCancel={() => {
            setPlayerActionsConfigOpen(false);
            setStartMatchOpen(true);
          }}
        />
      )}

      {(calendarOpen || activeSection === 'calendar') && (
        <CalendarModal
          matches={matchState.calendar}
          previousSeasons={matchState.previousSeasons}
          onAddMatch={handleAddCalendarMatch}
          onUpdateMatch={handleUpdateCalendarMatch}
          onSelectMatch={handleSelectCalendarMatch}
          onDeleteMatch={handleDeleteCalendarMatch}
          onClose={() => {
            setCalendarOpen(false);
            setActiveSection('live');
          }}
        />
      )}

      {historyOpen && (
        <HistoryModal
          matches={matchState.history}
          onEdit={handleEditHistoryMatch}
          onDelete={handleDeleteHistoryMatch}
          onShare={() => {}}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {historyEditMatch && (
        <HistoryEditModal
          match={historyEditMatch}
          onSave={handleSaveHistoryActions}
          onClose={() => setHistoryEditMatch(null)}
        />
      )}

      {finalizeConfirmOpen && (
        <div className="modal-overlay" role="alertdialog" aria-modal="true">
          <div className="modal-content finalize-confirm-modal">
            <h2>¿Ha finalizado el partido?</h2>
            <p className="modal-label">
              Al aceptar se guardará en el historial, se quitará del calendario y se limpiará el campo.
            </p>
            <div className="finalize-confirm-actions">
              <button type="button" className="primary-button" onClick={confirmFinalize}>
                Sí, finalizar
              </button>
              <button type="button" className="cancel-btn" onClick={() => setFinalizeConfirmOpen(false)}>
                No, continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
