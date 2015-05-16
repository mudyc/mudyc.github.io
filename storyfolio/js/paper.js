
function Paper()
{
    PIXI.DisplayObject.call(this);

    this.children = [];

    this._seed = -1;
    this.nt = undefined;
    this.shader = undefined;
}

// constructor
Paper.prototype = Object.create(PIXI.DisplayObject.prototype);
Paper.prototype.constructor = Paper;
//module.exports = Paper;

Object.defineProperties(Paper.prototype, {
    seed: {
        get: function ()
        {
            return this._seed;
        },
        set: function (value)
        {
						if (this._seed == value) return;
            this._seed = value;
            this.nt = this.shader = undefined;
        }
    },

});




Paper.prototype.renderWebGL = function (renderer)
{
  // make text work
  renderer.shaderManager._currentId = -1;

  var setRectangle = function(gl, x, y, width, height) {
    var x1, x2, y1, y2;
    x1 = x;
    x2 = x + width;
    y1 = y;
    y2 = y + height;
    return gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]), gl.STATIC_DRAW);
  };

  hashCode = function(str) {
    var chr, hash, i, _i, _ref;
    hash = 0;
    if (str.length === 0) {
      return hash;
    }
    for (i = _i = 0, _ref = str.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash;
  };

  var gl = renderer.gl;
  if (this.nt === undefined)
    this.nt = new NamedTextures(gl);
  if (this.shader === undefined)
    this.shader = new Shader(gl);

  Math.seedrandom(this.seed);
  if (true) {
    colors = new Colors(gl, Math.random());
    _ref = [0, 0.5, 0.95];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      trans = _ref[_i];
      rootrep0 = new TexGenXYRepeatUnit().getRelated().texCoords2D();
      rootrep1 = new TexGenXYRepeatUnit().getRelated().texCoords2D();
      this.shader.setup(gl, Math.floor(Math.random() * 3), {
        tex0: this.nt.get_random_tex(),
        tex1: this.nt.get_random_tex(),
        coords0: rootrep0,
        coords1: rootrep1,
        u_resolution: {
          width: renderer.width,
          height: renderer.height
        },
        c0: colors.get_color(0),
        c1: colors.get_color(1),
        c2: colors.get_color(2),
        r0: colors.get_rand(0),
        r1: colors.get_rand(1),
        trans: trans
      });
      setRectangle(gl, 0, 0, renderer.width, renderer.height);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.blendEquation(gl.FUNC_ADD);
      gl.disable(gl.DEPTH_TEST);
      _results.push(gl.drawArrays(gl.TRIANGLES, 0, 6));
    }
    return _results;
  }
}

Paper.prototype.renderCanvas = function (renderer)
{
  //console.log('render canvas');
}
