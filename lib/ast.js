var ast = {

    initialize: function() {
      this._nodes = [];
      this._node = {};
    },

    set: function(props) {
      for (var k in props) this._node[k] = props[k];
    },

    harvest: function() {
      this._nodes.push(this._node);
      this._node = {};
    },

    yield: function() {
      var _nodes = this._nodes;
      this.initialize();
      return _nodes;
    }
};

module.exports = ast;
