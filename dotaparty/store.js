store = new Vuex.Store({
  state: {
    heroes: [],
    crossMatches: {},
    player: {},
    playerGames: [],
    matches: {},
    selectedPlayers: [],
    selectedMatch: {}
  },
  mutations: {
    setHeroes: function(state, heroes) {
      state.heroes = heroes;
    },
    addCrossMatches: function(state, payload) {
      var accountId1 = payload.accountId1;
      var accountId2 = payload.accountId2;
      var matches = payload.matches;
      Vue.set(state.crossMatches, util.key(accountId1, accountId2), matches);
      Vue.set(state.crossMatches, util.key(accountId2, accountId1), matches);
    },
    setCurrentPlayer: function(state, player) {
      state.player = player;
      state.selectedPlayers.push(player.profile.account_id);
    },
    playerGames: function(state, games) {
      state.playerGames = games;
    },
    matchLoaded: function(state, match) {
      state.matches[match.match_id] = match;
    },
    selectedMatch: function(state, match) {
      state.selectedMatch = match;
    }
  },
  getters: {
    getHero: function(state) {
      return function(heroId) {
        var s = state.heroes.find(function(h) { return h.hero_id == heroId });
        return s;
      };
    },
    getMatchesBetween: function(state) {
      return function(accountId1, accountId2) {
        return state.crossMatches[util.key(accountId1, accountId2)];
      }
    },
    getCurrentPlayer: function(state) {
      return state.player;
    },
    getCurrentPlayerGames: function(state) {
      return state.playerGames;
    },
    getMatch: function(state) {
      return function(matchId) {
        return state.matches[matchId];
      }
    },
    getSelectedMatch: function(state) {
      return state.selectedMatch;
    },
    getSelectedPlayers: function(state) {
      return state.selectedMatch.players.filter(function(p) {
        return state.selectedPlayers.indexOf(p.account_id) >= 0;
      })
    }
  },
  actions: {
    updateHeroes: function(context) {
      queue.get('https://api.opendota.com/api/heroStats', function(response) {
        context.commit('setHeroes', response.data);
      });
    },
    updateMatchesBetween: function(context, payload) {
      var accountId1 = payload[0];
      var accountId2 = payload[1];
      if (accountId1 == accountId2)
        return;

      if (context.state.crossMatches[util.key(accountId1, accountId2)] != null)
        return;

      var url = 'https://api.opendota.com/api/players/' + accountId1 + '/matches?included_account_id=' + accountId2;
      queue.get(url, function(response) {
        context.commit('addCrossMatches', {
          accountId1: accountId1, 
          accountId2: accountId2, 
          matches: response.data
        });
      });
    },
    updateCurrentPlayer: function(context, accountId) {
      queue.get('https://api.opendota.com/api/players/' + accountId + '/', function(response) {
        context.commit('setCurrentPlayer', response.data);
        context.dispatch('loadGames', accountId);
      }); 
    },
    loadGames: function(context, accountId) {
      queue.get('https://api.opendota.com/api/players/' + accountId + '/matches?limit=8', function(response) {
        context.commit('playerGames', response.data);
      });
    },
    loadMatch: function(context, matchId) {
      var match = context.getters.getMatch(matchId);
      if (match == null) {
        queue.get('https://api.opendota.com/api/matches/' + matchId, function(response) {
          context.commit('matchLoaded', response.data);
          context.commit('selectedMatch', response.data);
          context.dispatch('loadCrossMatches');
        });
      } else {
        context.commit('selectedMatch', match);
        context.dispatch('loadCrossMatches');
      }
    },
    loadCrossMatches: function(context) {
      context.state.selectedPlayers.map(function(accountId1) {
        var a = context.state.selectedMatch.players.filter(function(p) {
          return p.account_id != null;
        }).map(function(player) {
          return player.account_id;
        }).map(function(accountId2) {
          context.dispatch('updateMatchesBetween', [ accountId1, accountId2 ]);
        });
      })
    }
  }
});
