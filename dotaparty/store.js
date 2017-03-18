store = new Vuex.Store({
  state: {
    heroes: [],
    crossMatches: {},
    player: [],
    playerGames: []
  },
  mutations: {
    setHeroes: function(state, heroes) {
      state.heroes = heroes;
    },
    addCrossMatches: function(state, accountId1, accountId2, matches) {
      state.crossMatches[util.key(accountId1, accountId2)] = matches;
      state.crossMatches[util.key(accountId2, accountId1)] = matches;
    },
    setCurrentPlayer: function(state, player) {
      state.player = player;
    },
    playerGames: function(state, games) {
      state.playerGames = games;
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
    }
  },
  actions: {
    updateHeroes: function(context) {
      queue.get('https://api.opendota.com/api/heroStats', function(response) {
        context.commit('setHeroes', response.data);
      });
    },
    updateMatchesBetween: function(context, accountId1, accountId2) {
      if (accountId1 == null)
        return;

      if (accountId2 == null)
        return;

      var url = 'https://api.opendota.com/api/players/' + accountId1 + '/matches?included_account_id=' + accountId2;
      queue.get(url, function(response) {
        context.commit('addCrossMatches', accountId1, accountId2, response.data);
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
    }
  }
});
