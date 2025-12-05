// src/app/utils/localStorage.ts

const aliasToNickname: Record<string, string> = {
  ATL: 'Hawks',
  BOS: 'Celtics',
  BKN: 'Nets',
  CHA: 'Hornets',
  CHI: 'Bulls',
  CLE: 'Cavaliers',
  DAL: 'Mavericks',
  DEN: 'Nuggets',
  DET: 'Pistons',
  GSW: 'Warriors',
  HOU: 'Rockets',
  IND: 'Pacers',
  LAC: 'Clippers',
  LAL: 'Lakers',
  MEM: 'Grizzlies',
  MIA: 'Heat',
  MIL: 'Bucks',
  MIN: 'Timberwolves',
  NOP: 'Pelicans',
  NYK: 'Knicks',
  OKC: 'Thunder',
  ORL: 'Magic',
  PHI: '76ers',
  PHX: 'Suns',
  POR: 'Trail Blazers',
  SAC: 'Kings',
  SAS: 'Spurs',
  TOR: 'Raptors',
  UTA: 'Jazz',
  WAS: 'Wizards',
};

const aliasToFullName: Record<string, string> = {
  ATL: 'Atlanta Hawks',
  BOS: 'Boston Celtics',
  BKN: 'Brooklyn Nets',
  CHA: 'Charlotte Hornets',
  CHI: 'Chicago Bulls',
  CLE: 'Cleveland Cavaliers',
  DAL: 'Dallas Mavericks',
  DEN: 'Denver Nuggets',
  DET: 'Detroit Pistons',
  GSW: 'Golden State Warriors',
  HOU: 'Houston Rockets',
  IND: 'Indiana Pacers',
  LAC: 'Los Angeles Clippers',
  LAL: 'Los Angeles Lakers',
  MEM: 'Memphis Grizzlies',
  MIA: 'Miami Heat',
  MIL: 'Milwaukee Bucks',
  MIN: 'Minnesota Timberwolves',
  NOP: 'New Orleans Pelicans',
  NYK: 'New York Knicks',
  OKC: 'Oklahoma City Thunder',
  ORL: 'Orlando Magic',
  PHI: 'Philadelphia 76ers',
  PHX: 'Phoenix Suns',
  POR: 'Portland Trail Blazers',
  SAC: 'Sacramento Kings',
  SAS: 'San Antonio Spurs',
  TOR: 'Toronto Raptors',
  UTA: 'Utah Jazz',
  WAS: 'Washington Wizards',
};

export const getNicknameFromAlias = (alias: string | null): string | null => {
  if (!alias) return null;
  return aliasToNickname[alias.toUpperCase()] || null;
};

export const getFullNameFromAlias = (alias: string | null): string | null => {
  if (!alias) return null;
  return aliasToFullName[alias.toUpperCase()] || null;
};

export const getSelectedTeamIds = () => {
  if (typeof window === 'undefined') {
    return {
      homeTeamId: null,
      awayTeamId: null,
      homeTeamName: null,
      awayTeamName: null,
      homeTeamNickname: null,
      awayTeamNickname: null,
      homeTeamAlias: null,
      awayTeamAlias: null,
    };
  }
  const homeTeamId = localStorage.getItem('selectedHomeTeamId');
  const awayTeamId = localStorage.getItem('selectedAwayTeamId');
  const homeTeamName = localStorage.getItem('selectedHomeTeamName');
  const awayTeamName = localStorage.getItem('selectedAwayTeamName');
  const homeTeamNickname = localStorage.getItem('selectedHomeTeamNickname');
  const awayTeamNickname = localStorage.getItem('selectedAwayTeamNickname');
  const homeTeamAlias = localStorage.getItem('selectedHomeTeamAlias');
  const awayTeamAlias = localStorage.getItem('selectedAwayTeamAlias');
  return {
    homeTeamId,
    awayTeamId,
    homeTeamName,
    awayTeamName,
    homeTeamNickname,
    awayTeamNickname,
    homeTeamAlias,
    awayTeamAlias,
  };
};
