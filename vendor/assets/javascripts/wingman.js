(function(window) {
  
(function(/*! Stitch !*/) {
  if (!this.require) {
    var modules = {}, cache = {}, require = function(name, root) {
      var path = expand(root, name), module = cache[path], fn;
      if (module) {
        return module.exports;
      } else if (fn = modules[path] || modules[path = expand(path, './index')]) {
        module = {id: path, exports: {}};
        try {
          cache[path] = module;
          fn(module.exports, function(name) {
            return require(name, dirname(path));
          }, module);
          return module.exports;
        } catch (err) {
          delete cache[path];
          throw err;
        }
      } else {
        throw 'module \'' + name + '\' not found';
      }
    }, expand = function(root, name) {
      var results = [], parts, part;
      if (/^\.\.?(\/|$)/.test(name)) {
        parts = [root, name].join('/').split('/');
      } else {
        parts = name.split('/');
      }
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part == '..') {
          results.pop();
        } else if (part != '.' && part != '') {
          results.push(part);
        }
      }
      return results.join('/');
    }, dirname = function(path) {
      return path.split('/').slice(0, -1).join('/');
    };
    this.require = function(name) {
      return require(name, '');
    }
    this.require.define = function(bundle) {
      for (var key in bundle)
        modules[key] = bundle[key];
    };
  }
  return this.require.define;
}).call(this)({"wingman": function(exports, require, module) {(function() {

  if (typeof window !== "undefined" && window !== null) {
    exports.document = window.document;
    exports.window = window;
    exports.global = window;
    exports.localStorage = localStorage;
  }

  exports.Object = require('./wingman/shared/object');

  exports.request = require('./wingman/request');

  exports.Template = require('./wingman/template');

  exports.View = require('./wingman/view');

  exports.Store = require('./wingman/store');

  exports.Model = require('./wingman/model');

  exports.Controller = require('./wingman/controller');

  exports.Application = require('./wingman/application');

  exports.Module = require('./wingman/shared/module');

  exports.Events = require('./wingman/shared/events');

  exports.store = function() {
    return this._store || (this._store = new exports.Store);
  };

}).call(this);
}, "wingman/application": function(exports, require, module) {(function() {
  var Application, Events, Fleck, Navigator, Wingman,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Wingman = require('../wingman');

  Events = require('./shared/events');

  Navigator = require('./shared/navigator');

  Fleck = require('fleck');

  module.exports = Application = (function(_super) {

    __extends(Application, _super);

    Application.include(Navigator);

    Application.include(Events);

    Application.rootViewSiblings = function() {
      var key, value, views;
      views = {};
      for (key in this) {
        value = this[key];
        if (key.match("(.+)View$") && key !== 'RootView') views[key] = value;
      }
      return views;
    };

    function Application(options) {
      this.handlePopStateChange = __bind(this.handlePopStateChange, this);
      this.buildController = __bind(this.buildController, this);      if (this.constructor.__super__.constructor.instance) {
        throw new Error('You cannot instantiate two Wingman apps at the same time.');
      }
      this.constructor.__super__.constructor.instance = this;
      this.bind('viewCreated', this.buildController);
      this.el = (options != null ? options.el : void 0) || Wingman.document.body;
      this.view = (options != null ? options.view : void 0) || this.buildView();
      Wingman.window.addEventListener('popstate', this.handlePopStateChange);
      this.updatePath();
      if (typeof this.ready === "function") this.ready();
    }

    Application.prototype.buildView = function() {
      var view,
        _this = this;
      view = new this.constructor.RootView({
        parent: this,
        el: this.el,
        app: this,
        childClasses: this.constructor.rootViewSiblings()
      });
      view.bind('descendantCreated', function(view) {
        return _this.trigger('viewCreated', view);
      });
      this.trigger('viewCreated', view);
      view.render();
      return view;
    };

    Application.prototype.buildController = function(view) {
      var Controller;
      Controller = this.controllerClassForView(view);
      if (Controller) return new Controller(view);
    };

    Application.prototype.controllerClassForView = function(view) {
      var klassName, part, parts, scope, _i, _len;
      parts = view.path().split('.');
      scope = this.constructor;
      for (_i = 0, _len = parts.length; _i < _len; _i++) {
        part = parts[_i];
        klassName = Fleck.camelize(part, true) + 'Controller';
        scope = scope[klassName];
        if (!scope) return;
      }
      return scope;
    };

    Application.prototype.handlePopStateChange = function(e) {
      if (Wingman.window.navigator.userAgent.match('WebKit') && !this._firstRun) {
        return this._firstRun = true;
      } else {
        this.updateNavigationOptions(e.state);
        return this.updatePath();
      }
    };

    Application.prototype.updatePath = function() {
      return this.set({
        path: Wingman.document.location.pathname.substr(1)
      });
    };

    Application.prototype.updateNavigationOptions = function(options) {
      return this.set({
        navigationOptions: options
      });
    };

    Application.prototype.findView = function(path) {
      return this.view.get(path);
    };

    return Application;

  })(Wingman.Object);

}).call(this);
}, "wingman/controller": function(exports, require, module) {(function() {
  var Navigator, Wingman,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __slice = Array.prototype.slice;

  Wingman = require('../wingman');

  Navigator = require('./shared/navigator');

  module.exports = (function(_super) {

    __extends(_Class, _super);

    _Class.include(Navigator);

    function _Class(view) {
      this.set({
        view: view
      });
      this.set({
        app: view.app
      });
      this.setupBindings();
      _Class.__super__.constructor.call(this);
      if (typeof this.ready === "function") this.ready();
    }

    _Class.prototype.setupBindings = function() {
      var eventName, methodName, _ref, _results;
      _ref = this.bindings;
      _results = [];
      for (eventName in _ref) {
        methodName = _ref[eventName];
        _results.push(this.setupBinding(eventName, methodName));
      }
      return _results;
    };

    _Class.prototype.setupBinding = function(eventName, methodName) {
      var _this = this;
      return this.get('view').bind(eventName, function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return _this[methodName].apply(_this, args);
      });
    };

    return _Class;

  })(Wingman.Object);

}).call(this);
}, "wingman/model": function(exports, require, module) {(function() {
  var Fleck, HasManyAssociation, Model, StorageAdapter, Wingman,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __slice = Array.prototype.slice;

  Wingman = require('../wingman');

  StorageAdapter = require('./model/storage_adapter');

  HasManyAssociation = require('./model/has_many_association');

  Fleck = require('fleck');

  module.exports = Model = (function(_super) {

    __extends(Model, _super);

    Model.extend(StorageAdapter);

    Model.collection = function() {
      return Wingman.store().collection(this);
    };

    Model.count = function() {
      return this.collection().count();
    };

    Model.load = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (typeof args[0] === 'number') {
        return this.loadOne(args[0], args[1]);
      } else {
        return this.loadMany(args[0]);
      }
    };

    Model.hasMany = function(name) {
      return (this.hasManyNames || (this.hasManyNames = [])).push(name);
    };

    Model.loadOne = function(id, callback) {
      var _this = this;
      return this.storageAdapter().load(id, {
        success: function(hash) {
          var model;
          model = new _this(hash);
          if (callback) return callback(model);
        }
      });
    };

    Model.loadMany = function(callback) {
      var _this = this;
      return this.storageAdapter().load({
        success: function(array) {
          var model, modelData, models, _i, _len;
          models = [];
          for (_i = 0, _len = array.length; _i < _len; _i++) {
            modelData = array[_i];
            model = new _this(modelData);
            models.push(model);
          }
          if (callback) return callback(models);
        }
      });
    };

    Model.scoped = function(params) {
      return this.collection().scoped(params);
    };

    Model.find = function(id) {
      return this.collection().find(id);
    };

    function Model(properties, options) {
      var _this = this;
      this.storageAdapter = this.constructor.storageAdapter();
      this.dirtyStaticPropertyNames = [];
      if (this.constructor.hasManyNames) this.setupHasManyAssociations();
      this.observeOnce('id', function() {
        return _this.constructor.collection().add(_this);
      });
      this.set(properties);
    }

    Model.prototype.setupHasManyAssociations = function() {
      var association, hasManyName, klass, klassName, _i, _len, _ref, _results,
        _this = this;
      _ref = this.constructor.hasManyNames;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        hasManyName = _ref[_i];
        klassName = Fleck.camelize(Fleck.singularize(Fleck.underscore(hasManyName)), true);
        klass = Wingman.global[klassName];
        association = new HasManyAssociation(this, klass);
        this.setProperty(hasManyName, association);
        association.bind('add', function(model) {
          return _this.trigger("add:" + hasManyName, model);
        });
        _results.push(association.bind('remove', function(model) {
          return _this.trigger("remove:" + hasManyName, model);
        }));
      }
      return _results;
    };

    Model.prototype.save = function(options) {
      var operation,
        _this = this;
      if (options == null) options = {};
      operation = this.isPersisted() ? 'update' : 'create';
      return this.storageAdapter[operation](this, {
        success: function(data) {
          if (data) {
            if (operation === 'update') delete data.id;
            _this.set(data);
          }
          _this.clean();
          return typeof options.success === "function" ? options.success() : void 0;
        },
        error: function() {
          return typeof options.error === "function" ? options.error() : void 0;
        }
      });
    };

    Model.prototype.destroy = function() {
      this.trigger('destroy', this);
      this.storageAdapter["delete"](this.get('id'));
      return this.flush();
    };

    Model.prototype.flush = function() {
      return this.trigger('flush', this);
    };

    Model.prototype.toParam = function() {
      return this.get('id');
    };

    Model.prototype.load = function() {
      var _this = this;
      return this.storageAdapter.load(this.get('id'), {
        success: function(hash) {
          delete hash.id;
          return _this.set(hash);
        }
      });
    };

    Model.prototype.clean = function() {
      return this.dirtyStaticPropertyNames.length = 0;
    };

    Model.prototype.dirtyStaticProperties = function() {
      return this.toJSON({
        only: this.dirtyStaticPropertyNames
      });
    };

    Model.prototype.set = function(hash) {
      return Model.__super__.set.call(this, hash);
    };

    Model.prototype.setProperty = function(propertyName, values) {
      if (propertyName === 'id' && this.get('id')) {
        throw new Error('You cannot change the ID of a model when set.');
      }
      if (this.get(propertyName) instanceof HasManyAssociation) {
        return this.get(propertyName).build(values);
      } else {
        this.dirtyStaticPropertyNames.push(propertyName);
        Model.__super__.setProperty.call(this, propertyName, values);
        if (this.storageAdapter.autoSave) return this.save();
      }
    };

    Model.prototype.isPersisted = function() {
      return !!this.get('id');
    };

    Model.prototype.isDirty = function() {
      return this.dirtyStaticPropertyNames.length !== 0;
    };

    return Model;

  })(Wingman.Object);

}).call(this);
}, "wingman/model/has_many_association": function(exports, require, module) {(function() {
  var Events, Fleck, HasManyAssociation, Module,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __slice = Array.prototype.slice;

  Fleck = require('fleck');

  Module = require('./../shared/module');

  Events = require('./../shared/events');

  module.exports = HasManyAssociation = (function(_super) {

    __extends(HasManyAssociation, _super);

    HasManyAssociation.include(Events);

    function HasManyAssociation(model, associatedClass) {
      this.model = model;
      this.associatedClass = associatedClass;
      this.setupScope = __bind(this.setupScope, this);
      this.model.observeOnce('id', this.setupScope);
    }

    HasManyAssociation.prototype.setupScope = function() {
      var _this = this;
      this.scope = this.associatedClass.scoped(this.scopeOptions());
      this.scope.forEach(function(model) {
        return _this.trigger('add', model);
      });
      this.scope.bind('add', function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return _this.trigger.apply(_this, ['add'].concat(__slice.call(args)));
      });
      return this.scope.bind('remove', function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return _this.trigger.apply(_this, ['remove'].concat(__slice.call(args)));
      });
    };

    HasManyAssociation.prototype.scopeOptions = function() {
      var options;
      options = {};
      options[this.foreignKey()] = this.model.get('id');
      return options;
    };

    HasManyAssociation.prototype.foreignKey = function() {
      return Fleck.camelize(Fleck.underscore(this.model.constructor.name)) + 'Id';
    };

    HasManyAssociation.prototype.count = function() {
      if (this.scope) {
        return this.scope.count();
      } else {
        return 0;
      }
    };

    HasManyAssociation.prototype.buildOne = function(hash) {
      var foreignId;
      foreignId = this.model.get('id');
      if (!foreignId) {
        throw new Error("Parent's ID must be set to use HasManyAssociation#build.");
      }
      hash[this.foreignKey()] = foreignId;
      return new this.associatedClass(hash);
    };

    HasManyAssociation.prototype.build = function(arrayOrHash) {
      var hash, _i, _len, _results;
      if (Array.isArray(arrayOrHash)) {
        _results = [];
        for (_i = 0, _len = arrayOrHash.length; _i < _len; _i++) {
          hash = arrayOrHash[_i];
          _results.push(this.buildOne(hash));
        }
        return _results;
      } else {
        return this.buildOne(arrayOrHash);
      }
    };

    HasManyAssociation.prototype.forEach = function(callback) {
      var model, _i, _len, _ref, _results;
      _ref = this.models();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        model = _ref[_i];
        _results.push(callback(model));
      }
      return _results;
    };

    HasManyAssociation.prototype.models = function() {
      var key, models, value, _ref;
      if (this.scope) {
        models = [];
        _ref = this.scope.models;
        for (key in _ref) {
          value = _ref[key];
          models.push(value);
        }
        return models;
      } else {
        return [];
      }
    };

    return HasManyAssociation;

  })(Module);

}).call(this);
}, "wingman/model/storage_adapter": function(exports, require, module) {(function() {
  var LocalStorage, RestStorage;

  RestStorage = require('./storage_adapters/rest');

  LocalStorage = require('./storage_adapters/local');

  module.exports = {
    storageTypes: {
      'rest': RestStorage,
      'local': LocalStorage
    },
    storage: function(type, options) {
      if (options == null) options = {};
      if (!this.storageAdapterTypeSupported(type)) {
        throw new Error("Storage engine " + type + " not supported.");
      }
      options.type = type;
      return this.storageAdapterOptions = options;
    },
    storageAdapterTypeSupported: function(type) {
      return !!this.storageTypes[type];
    },
    storageAdapter: function() {
      return this._storageAdapter || (this._storageAdapter = this.buildStorageAdapter());
    },
    buildStorageAdapter: function() {
      var key, klass, options, value, _ref;
      this.storageAdapterOptions || (this.storageAdapterOptions = {
        type: 'rest'
      });
      klass = this.storageTypes[this.storageAdapterOptions.type];
      options = {};
      _ref = this.storageAdapterOptions;
      for (key in _ref) {
        value = _ref[key];
        if (key !== 'type') options[key] = value;
      }
      return new klass(options);
    }
  };

}).call(this);
}, "wingman/model/storage_adapters/local": function(exports, require, module) {(function() {
  var Wingman;

  Wingman = require('../../../wingman');

  module.exports = (function() {

    _Class.prototype.autoSave = true;

    function _Class(options) {
      this.options = options;
    }

    _Class.prototype.create = function(model, options) {
      model.set({
        id: this.generateId()
      });
      Wingman.localStorage.setItem(this.key(model.get('id')), JSON.stringify(model.toJSON()));
      return options != null ? typeof options.success === "function" ? options.success() : void 0 : void 0;
    };

    _Class.prototype.update = function(model, options) {
      var _this = this;
      return this.load(model.get('id'), {
        success: function(existingProperties) {
          var key, newProperties, value;
          newProperties = model.toJSON();
          for (key in existingProperties) {
            value = existingProperties[key];
            if (newProperties[key] == null) newProperties[key] = value;
          }
          Wingman.localStorage.setItem(_this.key(model.get('id')), JSON.stringify(newProperties));
          return options != null ? typeof options.success === "function" ? options.success() : void 0 : void 0;
        }
      });
    };

    _Class.prototype.load = function(id, options) {
      var itemAsJson, itemAsString;
      itemAsString = Wingman.localStorage.getItem(this.key(id));
      itemAsJson = JSON.parse(itemAsString);
      return options.success(itemAsJson);
    };

    _Class.prototype.key = function(id) {
      return [this.options.namespace, id].join('.');
    };

    _Class.prototype.generateId = function() {
      return Math.round(Math.random() * 5000000);
    };

    _Class.prototype["delete"] = function(id) {
      return Wingman.localStorage.removeItem(this.key(id));
    };

    return _Class;

  })();

}).call(this);
}, "wingman/model/storage_adapters/rest": function(exports, require, module) {(function() {
  var Wingman,
    __slice = Array.prototype.slice;

  Wingman = require('../../../wingman');

  module.exports = (function() {

    function _Class(options) {
      this.options = options;
    }

    _Class.prototype.create = function(model, options) {
      if (options == null) options = {};
      return Wingman.request({
        type: 'POST',
        url: this.options.url,
        data: model.dirtyStaticProperties(),
        error: options.error,
        success: options.success
      });
    };

    _Class.prototype.update = function(model, options) {
      if (options == null) options = {};
      return Wingman.request({
        type: 'PUT',
        url: "" + this.options.url + "/" + (model.get('id')),
        data: model.dirtyStaticProperties(),
        error: options.error,
        success: options.success
      });
    };

    _Class.prototype.load = function() {
      var args, options;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 2) {
        options = args[1];
        options.url = [this.options.url, args[0]].join('/');
      } else {
        options = args[0];
        options.url = this.options.url;
      }
      options.type = 'GET';
      return Wingman.request(options);
    };

    _Class.prototype["delete"] = function(id) {
      return Wingman.request({
        url: [this.options.url, id].join('/'),
        type: 'DELETE'
      });
    };

    return _Class;

  })();

}).call(this);
}, "wingman/request": function(exports, require, module) {(function() {
  var Wingman, request,
    __slice = Array.prototype.slice;

  Wingman = require('../wingman');

  request = function() {
    var args, _base, _ref;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (((_ref = Wingman.Application.instance) != null ? _ref.host : void 0) != null) {
      args[0].url = ['http://', Wingman.Application.instance.host, args[0].url].join('');
    }
    (_base = args[0]).dataType || (_base.dataType = 'json');
    return request.realRequest.apply(request, args);
  };

  if (typeof jQuery !== "undefined" && jQuery !== null) {
    request.realRequest = jQuery.ajax;
  }

  module.exports = request;

}).call(this);
}, "wingman/shared/elementary": function(exports, require, module) {(function() {

  module.exports = {
    classCache: function() {
      return this._classCache || (this._classCache = {});
    },
    addClass: function(className) {
      var _base;
      (_base = this.classCache())[className] || (_base[className] = 0);
      this.classCache()[className]++;
      if (this.classCache()[className] === 1) {
        return this.el.className = this.el.className ? this.el.className.split(' ').concat(className).join(' ') : className;
      }
    },
    removeClass: function(className) {
      var reg;
      if (this.classCache()[className]) this.classCache()[className]--;
      if (this.classCache()[className] === 0) {
        reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
        return this.el.className = this.el.className.replace(reg, '');
      }
    },
    setStyle: function(key, value) {
      var keyCssNotation;
      keyCssNotation = this.convertCssPropertyFromDomToCssNotation(key);
      return this.el.style[keyCssNotation] = value;
    },
    setAttribute: function(key, value) {
      return this.el.setAttribute(key, value);
    },
    remove: function() {
      return this.el.parentNode.removeChild(this.el);
    },
    convertCssPropertyFromDomToCssNotation: function(propertyName) {
      return propertyName.replace(/(-[a-z]{1})/g, function(s) {
        return s[1].toUpperCase();
      });
    }
  };

}).call(this);
}, "wingman/shared/events": function(exports, require, module) {(function() {
  var __slice = Array.prototype.slice;

  module.exports = {
    bind: function(eventName, callback) {
      var _base;
      if (!callback) throw new Error('Callback must be set!');
      if (!this.hasOwnProperty('_callbacks')) this._callbacks = {};
      (_base = this._callbacks)[eventName] || (_base[eventName] = []);
      this._callbacks[eventName].push(callback);
      return this._callbacks;
    },
    unbind: function(eventName, callback) {
      var index, list;
      list = this.hasOwnProperty('_callbacks') && this._callbacks[eventName];
      if (!list) return false;
      index = list.indexOf(callback);
      return list.splice(index, 1);
    },
    trigger: function() {
      var args, callback, eventName, list, _i, _len, _ref, _results;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      eventName = args.shift();
      list = this.hasOwnProperty('_callbacks') && this._callbacks[eventName];
      if (!list) return;
      _ref = list.slice();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        _results.push(callback.apply(this, args));
      }
      return _results;
    }
  };

}).call(this);
}, "wingman/shared/module": function(exports, require, module) {(function() {

  module.exports = (function() {

    function _Class() {}

    _Class.include = function(obj) {
      var key, value;
      if (!obj) throw 'Module.include requires obj';
      for (key in obj) {
        value = obj[key];
        this.prototype[key] = value;
      }
      return typeof obj.included === "function" ? obj.included(this) : void 0;
    };

    _Class.extend = function(obj) {
      var key, value;
      if (!obj) throw 'Module.extend requires obj';
      for (key in obj) {
        value = obj[key];
        this[key] = value;
      }
      return typeof obj.extended === "function" ? obj.extended(this) : void 0;
    };

    return _Class;

  })();

}).call(this);
}, "wingman/shared/navigator": function(exports, require, module) {(function() {
  var Wingman;

  Wingman = require('../../wingman');

  module.exports = {
    navigate: function(location, options) {
      if (options == null) options = {};
      Wingman.window.history.pushState(options, '', "/" + location);
      if (Wingman.Application.instance) {
        Wingman.Application.instance.updateNavigationOptions(options);
        return Wingman.Application.instance.updatePath();
      }
    },
    back: function(times) {
      if (times == null) times = 1;
      return Wingman.window.history.go(-times);
    }
  };

}).call(this);
}, "wingman/shared/object": function(exports, require, module) {(function() {
  var Events, Module, WingmanObject, propertyDependencies,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __slice = Array.prototype.slice,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Module = require('./module');

  Events = require('./events');

  propertyDependencies = {};

  WingmanObject = WingmanObject = (function(_super) {

    __extends(WingmanObject, _super);

    WingmanObject.include(Events);

    WingmanObject.parentPropertyDependencies = function() {
      var _ref, _ref2;
      if ((_ref = this.__super__) != null ? (_ref2 = _ref.constructor) != null ? _ref2.propertyDependencies : void 0 : void 0) {
        return this.__super__.constructor.propertyDependencies();
      } else {
        return {};
      }
    };

    WingmanObject.buildPropertyDependencies = function() {
      var dependencies, key, value, _ref;
      dependencies = {};
      _ref = this.parentPropertyDependencies();
      for (key in _ref) {
        value = _ref[key];
        dependencies[key] = value;
      }
      return dependencies;
    };

    WingmanObject.propertyDependencies = function(hash) {
      if (hash) {
        return this.addPropertyDependencies(hash);
      } else {
        return propertyDependencies[this] || (propertyDependencies[this] = this.buildPropertyDependencies());
      }
    };

    WingmanObject.addPropertyDependencies = function(hash) {
      var config, key, value, _results;
      config = this.propertyDependencies();
      _results = [];
      for (key in hash) {
        value = hash[key];
        _results.push(config[key] = value);
      }
      return _results;
    };

    function WingmanObject() {
      if (this.constructor.propertyDependencies()) this.initPropertyDependencies();
    }

    WingmanObject.prototype.initPropertyDependencies = function() {
      var dependentPropertyKey, dependingPropertiesKeys, dependingPropertyKey, _ref, _results;
      _ref = this.constructor.propertyDependencies();
      _results = [];
      for (dependentPropertyKey in _ref) {
        dependingPropertiesKeys = _ref[dependentPropertyKey];
        if (!Array.isArray(dependingPropertiesKeys)) {
          dependingPropertiesKeys = [dependingPropertiesKeys];
        }
        _results.push((function() {
          var _i, _len, _results2;
          _results2 = [];
          for (_i = 0, _len = dependingPropertiesKeys.length; _i < _len; _i++) {
            dependingPropertyKey = dependingPropertiesKeys[_i];
            _results2.push(this.initPropertyDependency(dependentPropertyKey, dependingPropertyKey));
          }
          return _results2;
        }).call(this));
      }
      return _results;
    };

    WingmanObject.prototype.initPropertyDependency = function(dependentPropertyKey, dependingPropertyKey) {
      var observeArrayLike, trigger, unobserveArrayLike,
        _this = this;
      trigger = function() {
        return _this.triggerPropertyChange(dependentPropertyKey);
      };
      this.observe(dependingPropertyKey, function(newValue, oldValue) {
        trigger();
        if (!(oldValue != null ? oldValue.forEach : void 0) && (newValue != null ? newValue.forEach : void 0)) {
          return observeArrayLike();
        } else if (oldValue != null ? oldValue.forEach : void 0) {
          return unobserveArrayLike();
        }
      });
      observeArrayLike = function() {
        _this.observe(dependingPropertyKey, 'add', trigger);
        return _this.observe(dependingPropertyKey, 'remove', trigger);
      };
      return unobserveArrayLike = function() {
        _this.unobserve(dependingPropertyKey, 'add', trigger);
        return _this.unobserve(dependingPropertyKey, 'remove', trigger);
      };
    };

    WingmanObject.prototype.set = function(hash) {
      return this.setProperties(hash);
    };

    WingmanObject.prototype.setProperties = function(hash) {
      var propertyName, value, _results;
      _results = [];
      for (propertyName in hash) {
        value = hash[propertyName];
        _results.push(this.setProperty(propertyName, value));
      }
      return _results;
    };

    WingmanObject.prototype.triggerPropertyChange = function(propertyName) {
      var newValue;
      this.previousProperties || (this.previousProperties = {});
      newValue = this.get(propertyName);
      if (!this.previousProperties.hasOwnProperty(propertyName) || this.previousProperties[propertyName] !== newValue) {
        this.trigger("change:" + propertyName, newValue, this.previousProperties[propertyName]);
        return this.previousProperties[propertyName] = newValue;
      }
    };

    WingmanObject.prototype.observeOnce = function(chainAsString, callback) {
      var observer,
        _this = this;
      observer = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        callback.apply(null, args);
        return _this.unobserve(chainAsString, observer);
      };
      return this.observe(chainAsString, observer);
    };

    WingmanObject.prototype.observe = function() {
      var args, callback, chain, chainAsString, chainExceptFirst, chainExceptFirstAsString, getAndSendToCallback, nested, observeOnNested, observeType, property, type,
        _this = this;
      chainAsString = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      callback = args.pop();
      type = args.pop() || 'change';
      chain = chainAsString.split('.');
      chainExceptFirst = chain.slice(1, chain.length);
      chainExceptFirstAsString = chainExceptFirst.join('.');
      nested = chainExceptFirst.length !== 0;
      getAndSendToCallback = function(newValue, oldValue) {
        if (type === 'change') {
          return callback(newValue, oldValue);
        } else {
          return callback(newValue);
        }
      };
      property = this.get(chain[0]);
      observeOnNested = function(p) {
        return p.observe(chainExceptFirstAsString, type, function(newValue, oldValue) {
          return getAndSendToCallback(newValue, oldValue);
        });
      };
      if (nested && property) observeOnNested(property);
      observeType = nested ? 'change' : type;
      return this.observeProperty(chain[0], observeType, function(newValue, oldValue) {
        var ov;
        if (nested) {
          if (newValue) {
            ov = oldValue ? oldValue.get(chainExceptFirst.join('.')) : void 0;
            if (type === 'change') {
              getAndSendToCallback(newValue.get(chainExceptFirst.join('.')), ov);
            }
            observeOnNested(newValue);
          }
          if (oldValue) {
            return oldValue.unobserve(chainExceptFirstAsString, type, getAndSendToCallback);
          }
        } else {
          return getAndSendToCallback(newValue, oldValue);
        }
      });
    };

    WingmanObject.prototype.observeProperty = function(propertyName, type, callback) {
      return this.bind("" + type + ":" + propertyName, callback);
    };

    WingmanObject.prototype.unobserve = function() {
      var args, callback, propertyName, type;
      propertyName = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      callback = args.pop();
      type = args.pop() || 'change';
      return this.unbind("" + type + ":" + propertyName, callback);
    };

    WingmanObject.prototype.setProperty = function(propertyName, value) {
      var i, parent, _len, _ref;
      value = this.convertIfNecessary(value);
      this.registerPropertySet(propertyName);
      this[propertyName] = value;
      this.triggerPropertyChange(propertyName);
      parent = this;
      if (Array.isArray(this[propertyName])) {
        _ref = this[propertyName];
        for (i = 0, _len = _ref.length; i < _len; i++) {
          value = _ref[i];
          this[propertyName][i] = this.convertIfNecessary(value);
        }
        return this.addTriggersToArray(propertyName);
      }
    };

    WingmanObject.prototype.registerPropertySet = function(propertyName) {
      return this.setPropertyNames().push(propertyName);
    };

    WingmanObject.prototype.setPropertyNames = function() {
      return this._setPropertyNames || (this._setPropertyNames = []);
    };

    WingmanObject.prototype.get = function(chainAsString) {
      var chain, nestedProperty, nestedPropertyName;
      chain = chainAsString.split('.');
      if (chain.length === 1) {
        return this.getProperty(chain[0]);
      } else {
        nestedPropertyName = chain.shift();
        nestedProperty = this.getProperty(nestedPropertyName);
        if (nestedProperty) {
          return nestedProperty.get(chain.join('.'));
        } else {
          return;
        }
      }
    };

    WingmanObject.prototype.getProperty = function(propertyName) {
      if (typeof this[propertyName] === 'function') {
        return this[propertyName].apply(this);
      } else {
        return this[propertyName];
      }
    };

    WingmanObject.prototype.toJSON = function(options) {
      var json, propertyName, shouldBeIncluded, _i, _len, _ref;
      if (options == null) options = {};
      if (options.only && !Array.isArray(options.only)) {
        options.only = [options.only];
      }
      json = {};
      _ref = this.setPropertyNames();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        propertyName = _ref[_i];
        shouldBeIncluded = (!options.only || (__indexOf.call(options.only, propertyName) >= 0)) && this.serializable(this.get(propertyName));
        if (shouldBeIncluded) json[propertyName] = this.get(propertyName);
      }
      return json;
    };

    WingmanObject.prototype.serializable = function(value) {
      var _ref;
      return ((_ref = typeof value) === 'number' || _ref === 'string') || this.convertable(value);
    };

    WingmanObject.prototype.convertIfNecessary = function(value) {
      var wo;
      if (this.convertable(value)) {
        wo = new WingmanObject;
        wo.set(value);
        return wo;
      } else {
        return value;
      }
    };

    WingmanObject.prototype.convertable = function(value) {
      return typeof value === 'object' && ((value != null ? value.constructor : void 0) != null) && value.constructor.name === 'Object' && (!(value instanceof WingmanObject)) && !((value != null ? value._ownerDocument : void 0) != null);
    };

    WingmanObject.prototype.createSubContext = function() {
      return Object.create(this);
    };

    WingmanObject.prototype.addTriggersToArray = function(propertyName) {
      var array, parent;
      parent = this;
      array = this[propertyName];
      array.push = function() {
        Array.prototype.push.apply(this, arguments);
        return parent.trigger("add:" + propertyName, arguments['0']);
      };
      return array.remove = function(value) {
        var index;
        index = this.indexOf(value);
        if (index !== -1) {
          this.splice(index, 1);
          return parent.trigger("remove:" + propertyName, value);
        }
      };
    };

    return WingmanObject;

  })(Module);

  module.exports = WingmanObject;

}).call(this);
}, "wingman/store": function(exports, require, module) {(function() {
  var Collection, Store;

  Collection = require('./store/collection');

  module.exports = Store = (function() {

    function Store(options) {
      var _ref;
      this.options = options;
      this.collections = {};
      this.collectionClass = ((_ref = this.options) != null ? _ref.collectionClass : void 0) || Collection;
    }

    Store.prototype.collection = function(klass) {
      return this.collections[klass] || this.createCollection(klass);
    };

    Store.prototype.createCollection = function(klass) {
      return this.collections[klass] = new this.collectionClass(klass);
    };

    Store.prototype.flush = function() {
      var collection, klass, _ref, _results;
      _ref = this.collections;
      _results = [];
      for (klass in _ref) {
        collection = _ref[klass];
        _results.push(collection.flush());
      }
      return _results;
    };

    return Store;

  })();

}).call(this);
}, "wingman/store/collection": function(exports, require, module) {(function() {
  var Collection, Events, Module, Scope,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Module = require('./../shared/module');

  Events = require('./../shared/events');

  Scope = require('./scope');

  module.exports = Collection = (function(_super) {

    __extends(Collection, _super);

    Collection.include(Events);

    function Collection() {
      this.remove = __bind(this.remove, this);      this.models = {};
    }

    Collection.prototype.add = function(model) {
      if (!model.get('id')) throw new Error('Model must have ID to be stored.');
      if (this.exists(model)) {
        return this.update(this.models[model.get('id')], model);
      } else {
        return this.insert(model);
      }
    };

    Collection.prototype.insert = function(model) {
      this.models[model.get('id')] = model;
      this.trigger('add', model);
      return model.bind('flush', this.remove);
    };

    Collection.prototype.update = function(model, model2) {
      var key, value, _ref, _results;
      _ref = model2.toJSON();
      _results = [];
      for (key in _ref) {
        value = _ref[key];
        if (key !== 'id') {
          _results.push(model.setProperty(key, value));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Collection.prototype.find = function(id) {
      return this.models[id];
    };

    Collection.prototype.count = function() {
      return Object.keys(this.models).length;
    };

    Collection.prototype.remove = function(model) {
      delete this.models[model.get('id')];
      model.unbind(this.remove);
      return this.trigger('remove', model);
    };

    Collection.prototype.exists = function(model) {
      return !!this.models[model.get('id')];
    };

    Collection.prototype.forEach = function(callback) {
      var key, value, _ref, _results;
      _ref = this.models;
      _results = [];
      for (key in _ref) {
        value = _ref[key];
        _results.push(callback(value));
      }
      return _results;
    };

    Collection.prototype.scoped = function(params) {
      return new Scope(this, params);
    };

    Collection.prototype.flush = function() {
      return this.forEach(function(model) {
        return model.flush();
      });
    };

    return Collection;

  })(Module);

}).call(this);
}, "wingman/store/scope": function(exports, require, module) {(function() {
  var Events, Module, Scope,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Module = require('./../shared/module');

  Events = require('./../shared/events');

  module.exports = Scope = (function(_super) {

    __extends(Scope, _super);

    Scope.include(Events);

    function Scope(collection, params) {
      var _this = this;
      this.params = params;
      this.remove = __bind(this.remove, this);
      this.check = __bind(this.check, this);
      this.listen = __bind(this.listen, this);
      this.models = {};
      collection.forEach(function(model) {
        return _this.check(model);
      });
      collection.bind('add', this.listen);
    }

    Scope.prototype.listen = function(model) {
      var key, _i, _len, _ref, _results,
        _this = this;
      this.check(model);
      _ref = Object.keys(this.params);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        _results.push(model.observe(key, function() {
          return _this.check(model);
        }));
      }
      return _results;
    };

    Scope.prototype.check = function(model) {
      if (this.shouldBeAdded(model)) {
        return this.add(model);
      } else if (this.shouldBeRemoved(model)) {
        return this.remove(model);
      }
    };

    Scope.prototype.shouldBeAdded = function(model) {
      return this.matches(model) && !this.exists(model);
    };

    Scope.prototype.shouldBeRemoved = function(model) {
      return !this.matches(model) && this.exists(model);
    };

    Scope.prototype.add = function(model) {
      if (!model.get('id')) throw new Error('Model must have ID to be stored.');
      if (this.exists(model)) {
        throw new Error("" + model.constructor.name + " model with ID " + (model.get('id')) + " already in scope.");
      }
      this.models[model.get('id')] = model;
      this.trigger('add', model);
      return model.bind('destroy', this.remove);
    };

    Scope.prototype.matches = function(model) {
      var _this = this;
      return Object.keys(this.params).every(function(key) {
        return model.get(key) === _this.params[key];
      });
    };

    Scope.prototype.count = function() {
      return Object.keys(this.models).length;
    };

    Scope.prototype.find = function(id) {
      return this.models[id] || (function() {
        throw new Error('Model not found in scope.');
      })();
    };

    Scope.prototype.remove = function(model) {
      delete this.models[model.get('id')];
      model.unbind('destroy', this.remove);
      return this.trigger('remove', model);
    };

    Scope.prototype.exists = function(model) {
      return !!this.models[model.get('id')];
    };

    Scope.prototype.forEach = function(callback) {
      var key, value, _ref, _results;
      _ref = this.models;
      _results = [];
      for (key in _ref) {
        value = _ref[key];
        _results.push(callback(value));
      }
      return _results;
    };

    return Scope;

  })(Module);

}).call(this);
}, "wingman/template": function(exports, require, module) {(function() {
  var Fleck, HandlerFactory, Parser, Template;

  module.exports = Template = (function() {

    Template.compile = function(source) {
      var template;
      template = new this(source);
      return function(el, context) {
        return template.evaluate(el, context);
      };
    };

    function Template(source) {
      this.tree = Parser.parse(source);
    }

    Template.prototype.evaluate = function(el, context) {
      var key, options, value, _ref;
      options = {
        el: el,
        type: 'element'
      };
      _ref = this.tree;
      for (key in _ref) {
        value = _ref[key];
        options[key] = value;
      }
      return HandlerFactory.create(options, context);
    };

    return Template;

  })();

  Parser = require('./template/parser');

  HandlerFactory = require('./template/handler_factory');

  Fleck = require('fleck');

}).call(this);
}, "wingman/template/handler_factory": function(exports, require, module) {(function() {
  var ChildViewHandler, ConditionalHandler, ElementHandler, ForBlockHandler, MAP, TextHandler;

  ForBlockHandler = require('./handler_factory/for_block_handler');

  ChildViewHandler = require('./handler_factory/child_view_handler');

  ConditionalHandler = require('./handler_factory/conditional_handler');

  ElementHandler = require('./handler_factory/element_handler');

  TextHandler = require('./handler_factory/text_handler');

  MAP = {
    "for": ForBlockHandler,
    childView: ChildViewHandler,
    conditional: ConditionalHandler,
    element: ElementHandler,
    text: TextHandler
  };

  exports.create = function(options, context) {
    var klass;
    klass = MAP[options.type];
    if (klass) {
      delete options.type;
      return new klass(options, context);
    } else {
      throw new Error("Cannot create unknown node type (" + options.type + ")!");
    }
  };

}).call(this);
}, "wingman/template/handler_factory/child_view_handler": function(exports, require, module) {(function() {
  var ChildViewHandler, Wingman;

  Wingman = require('../../../wingman');

  module.exports = ChildViewHandler = (function() {

    function ChildViewHandler(options, context) {
      this.options = options;
      this.context = context;
      this.view = this.context.createChild(this.viewName(), this.viewOptions());
      this.options.scope.appendChild(this.view.el);
    }

    ChildViewHandler.prototype.viewOptions = function() {
      var options, properties;
      options = {
        render: true
      };
      if (properties = this.viewProperties()) options.properties = properties;
      return options;
    };

    ChildViewHandler.prototype.viewProperties = function() {
      var key, properties, _i, _len, _ref;
      properties = {};
      if (this.options.name && this.context.get(this.options.name)) {
        properties[this.options.name] = this.context.get(this.options.name);
      }
      if (this.options.properties) {
        _ref = this.options.properties;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          key = _ref[_i];
          properties[key] = this.context.get(key);
        }
      }
      return properties;
    };

    ChildViewHandler.prototype.remove = function() {
      return this.view.remove();
    };

    ChildViewHandler.prototype.viewName = function() {
      if (this.options.name) {
        return this.options.name;
      } else {
        return this.context.get(this.options.path);
      }
    };

    return ChildViewHandler;

  })();

}).call(this);
}, "wingman/template/handler_factory/conditional_handler": function(exports, require, module) {(function() {
  var ConditionalHandler, HandlerFactory,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  HandlerFactory = require('../handler_factory');

  module.exports = ConditionalHandler = (function() {

    function ConditionalHandler(options, context) {
      this.options = options;
      this.context = context;
      this.update = __bind(this.update, this);
      this.handlers = [];
      this.context.observe(this.options.source, this.update);
      this.update(this.context.get(this.options.source));
    }

    ConditionalHandler.prototype.add = function(currentValue) {
      var child, children, handler, key, options, value, _i, _len, _results;
      children = (currentValue && this.options.trueChildren) || this.options.falseChildren;
      if (children) {
        _results = [];
        for (_i = 0, _len = children.length; _i < _len; _i++) {
          child = children[_i];
          options = {
            scope: this.options.scope
          };
          for (key in child) {
            value = child[key];
            options[key] = value;
          }
          handler = HandlerFactory.create(options, this.context);
          _results.push(this.handlers.push(handler));
        }
        return _results;
      }
    };

    ConditionalHandler.prototype.remove = function() {
      var handler, _results;
      _results = [];
      while (handler = this.handlers.shift()) {
        _results.push(handler.remove());
      }
      return _results;
    };

    ConditionalHandler.prototype.update = function(currentValue) {
      this.remove();
      return this.add(currentValue);
    };

    return ConditionalHandler;

  })();

}).call(this);
}, "wingman/template/handler_factory/element_handler": function(exports, require, module) {(function() {
  var ElementHandler, Elementary, HandlerFactory, Module, Wingman,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Module = require('../../shared/module');

  Elementary = require('../../shared/elementary');

  module.exports = ElementHandler = (function(_super) {

    __extends(ElementHandler, _super);

    ElementHandler.include(Elementary);

    function ElementHandler(options, context) {
      this.options = options;
      this.context = context;
      this.setupDomElement();
      if (this.options.styles) this.setupStyles();
      if (this.options.classes) this.setupClasses();
      if (this.options.attributes) this.setupAttributes();
      if (this.options.source) {
        this.setupSource();
      } else if (this.options.children) {
        this.setupChildren();
      }
    }

    ElementHandler.prototype.setupDomElement = function() {
      var element;
      return this.el = this.options.el ? this.options.el : (element = Wingman.document.createElement(this.options.tag), this.options.scope.appendChild(element), element);
    };

    ElementHandler.prototype.setupClasses = function() {
      var klass, klassValue, _i, _len, _ref, _results;
      _ref = this.options.classes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        klass = _ref[_i];
        if (klass.isDynamic) {
          this.observeClass(klass);
          if (klassValue = this.context.get(klass.value)) {
            _results.push(this.addClass(klassValue));
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(this.addClass(klass.value));
        }
      }
      return _results;
    };

    ElementHandler.prototype.setupAttributes = function() {
      var attribute, key, _ref, _results;
      _ref = this.options.attributes;
      _results = [];
      for (key in _ref) {
        attribute = _ref[key];
        if (attribute.isDynamic) {
          this.observeAttribute(key, attribute);
          _results.push(this.setAttribute(key, this.context.get(attribute.value)));
        } else {
          _results.push(this.setAttribute(key, attribute.value));
        }
      }
      return _results;
    };

    ElementHandler.prototype.observeAttribute = function(key, attribute) {
      var _this = this;
      return this.context.observe(attribute.value, function(newValue) {
        return _this.setAttribute(key, newValue);
      });
    };

    ElementHandler.prototype.observeClass = function(klass) {
      var _this = this;
      return this.context.observe(klass.value, function(newClassName, oldClassName) {
        if (oldClassName) _this.removeClass(oldClassName);
        if (newClassName) return _this.addClass(newClassName);
      });
    };

    ElementHandler.prototype.setupStyles = function() {
      var key, style, _ref, _results;
      _ref = this.options.styles;
      _results = [];
      for (key in _ref) {
        style = _ref[key];
        if (style.isDynamic) {
          this.observeStyle(key, style);
          _results.push(this.setStyle(key, this.context.get(style.value)));
        } else {
          _results.push(this.setStyle(key, style.value));
        }
      }
      return _results;
    };

    ElementHandler.prototype.observeStyle = function(key, style) {
      var _this = this;
      return this.context.observe(style.value, function(newValue) {
        return _this.setStyle(key, newValue);
      });
    };

    ElementHandler.prototype.setupSource = function() {
      var _this = this;
      this.el.innerHTML = this.context.get(this.options.source);
      return this.context.observe(this.options.source, function(newValue, oldValue) {
        return _this.el.innerHTML = newValue;
      });
    };

    ElementHandler.prototype.setupChildren = function() {
      var child, key, options, value, _i, _len, _ref, _results;
      _ref = this.options.children;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        options = {
          scope: this.el
        };
        for (key in child) {
          value = child[key];
          options[key] = value;
        }
        _results.push(HandlerFactory.create(options, this.context));
      }
      return _results;
    };

    return ElementHandler;

  })(Module);

  Wingman = require('../../../wingman');

  HandlerFactory = require('../handler_factory');

}).call(this);
}, "wingman/template/handler_factory/for_block_handler": function(exports, require, module) {(function() {
  var Fleck, ForBlockHandler, HandlerFactory, WingmanObject,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  WingmanObject = require('../../shared/object');

  Fleck = require('fleck');

  HandlerFactory = require('../handler_factory');

  module.exports = ForBlockHandler = (function() {

    function ForBlockHandler(options, context) {
      this.options = options;
      this.context = context;
      this.rebuild = __bind(this.rebuild, this);
      this.remove = __bind(this.remove, this);
      this.add = __bind(this.add, this);
      this.handlers = {};
      if (this.source()) this.addAll();
      this.context.observe(this.options.source, this.rebuild);
      this.context.observe(this.options.source, 'add', this.add);
      this.context.observe(this.options.source, 'remove', this.remove);
    }

    ForBlockHandler.prototype.add = function(value) {
      var child, hash, key, newContext, _i, _len, _ref, _results;
      this.handlers[value] = [];
      newContext = this.context.createSubContext();
      key = Fleck.singularize(this.options.source.split('.').pop());
      hash = {};
      hash[key] = value;
      newContext.set(hash);
      _ref = this.options.children;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        _results.push(this.handlers[value].push(this.createHandler(child, newContext)));
      }
      return _results;
    };

    ForBlockHandler.prototype.createHandler = function(child, context) {
      var key, options, value;
      options = {
        scope: this.options.scope
      };
      for (key in child) {
        value = child[key];
        options[key] = value;
      }
      return HandlerFactory.create(options, context);
    };

    ForBlockHandler.prototype.remove = function(value) {
      var handler;
      while (this.handlers[value].length) {
        handler = this.handlers[value].pop();
        handler.remove();
      }
      return delete this.handlers[value];
    };

    ForBlockHandler.prototype.source = function() {
      return this.context.get(this.options.source);
    };

    ForBlockHandler.prototype.addAll = function() {
      var _this = this;
      return this.source().forEach(function(value) {
        return _this.add(value);
      });
    };

    ForBlockHandler.prototype.removeAll = function() {
      var element, value, _ref, _results;
      _ref = this.handlers;
      _results = [];
      for (value in _ref) {
        element = _ref[value];
        _results.push(this.remove(value));
      }
      return _results;
    };

    ForBlockHandler.prototype.rebuild = function() {
      this.removeAll();
      if (this.source()) return this.addAll();
    };

    return ForBlockHandler;

  })();

}).call(this);
}, "wingman/template/handler_factory/text_handler": function(exports, require, module) {(function() {
  var TextHandler, Wingman;

  Wingman = require('../../../wingman');

  module.exports = TextHandler = (function() {

    function TextHandler(options, context) {
      this.options = options;
      this.context = context;
      this.textNode = Wingman.document.createTextNode(this.options.value);
      this.options.scope.appendChild(this.textNode);
    }

    TextHandler.prototype.remove = function() {
      return this.textNode.parentNode.removeChild(this.textNode);
    };

    return TextHandler;

  })();

}).call(this);
}, "wingman/template/parser": function(exports, require, module) {(function() {
  var StringScanner, buildText, selfClosingTags;

  StringScanner = require("strscan").StringScanner;

  selfClosingTags = ['input', 'img', 'br', 'hr'];

  buildText = function(value) {
    var isDynamic, newNode;
    if (isDynamic = value.match(/^\{(.*?)\}$/)) {
      value = value.substring(1, value.length - 1);
    }
    return newNode = {
      type: 'text',
      value: value,
      isDynamic: isDynamic
    };
  };

  module.exports = (function() {

    _Class.parse = function(source) {
      var parser;
      parser = new this(source);
      parser.execute();
      return parser.tree;
    };

    _Class.trimSource = function(source) {
      var line, lines, _i, _len, _ref;
      lines = [];
      _ref = source.split("\n");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        lines.push(line.replace(/^ +/, ''));
      }
      return lines.join('').replace(/[\n\r\t]/g, '');
    };

    function _Class(source) {
      this.scanner = new StringScanner(this.constructor.trimSource(source));
      this.tree = {
        children: []
      };
      this.currentScope = this.tree;
    }

    _Class.prototype.execute = function() {
      var _results;
      _results = [];
      while (!this.done) {
        if (this.scanner.hasTerminated()) {
          _results.push(this.done = true);
        } else {
          _results.push(this.scan());
        }
      }
      return _results;
    };

    _Class.prototype.scan = function() {
      return this.scanForEndTag() || this.scanForStartTag() || this.scanForIfToken() || this.scanForElseToken() || this.scanForViewToken() || this.scanForForToken() || this.scanForEndToken() || this.scanForSource() || this.scanForText();
    };

    _Class.prototype.scanForEndTag = function() {
      var result;
      result = this.scanner.scan(/<\/(.*?)>/);
      if (result) this.currentScope = this.currentScope.parent;
      return result;
    };

    _Class.prototype.scanForStartTag = function() {
      var attributes, newNode, result;
      result = this.scanner.scan(/<([a-zA-Z0-9]+) *(.*?)>/);
      if (result) {
        newNode = {
          tag: this.scanner.getCapture(0),
          children: [],
          parent: this.currentScope,
          type: 'element'
        };
        if (this.scanner.getCapture(1)) {
          attributes = this.parseAttributes(this.scanner.getCapture(1));
          this.addAttributes(newNode, attributes);
        }
        this.currentScope.children.push(newNode);
        if (selfClosingTags.indexOf(newNode.tag) === -1) {
          this.currentScope = newNode;
        }
      }
      return result;
    };

    _Class.prototype.scanForForToken = function() {
      var newNode, result;
      result = this.scanner.scan(/\{for (.*?)\}/);
      if (result) {
        newNode = {
          source: this.scanner.getCapture(0),
          children: [],
          parent: this.currentScope,
          type: 'for'
        };
        this.currentScope.children.push(newNode);
        this.currentScope = newNode;
      }
      return result;
    };

    _Class.prototype.scanForViewToken = function() {
      var identifier, newNode, option, optionRegex, options, result;
      result = this.scanner.scan(/\{view ([a-zA-Z\.']+)(,{1} {1}(.*?))?\}/);
      if (result) {
        identifier = this.scanner.getCapture(0);
        options = this.scanner.getCapture(2);
        newNode = {
          parent: this.currentScope,
          type: 'childView'
        };
        if (options) {
          optionRegex = /(\w+): \[(.*?)\]/g;
          while (option = optionRegex.exec(options)) {
            if (option[1] === 'properties') {
              newNode.properties = option[2].replace(/\'| /g, '').split(',');
            }
          }
        }
        if (identifier[0] === "'") {
          newNode.name = identifier.replace(/\'/g, '');
        } else {
          newNode.path = identifier;
        }
        this.currentScope.children.push(newNode);
      }
      return result;
    };

    _Class.prototype.scanForIfToken = function() {
      var newNode, result;
      result = this.scanner.scan(/\{if (.*?)\}/);
      if (result) {
        newNode = {
          source: this.scanner.getCapture(0),
          parent: this.currentScope,
          type: 'conditional',
          children: []
        };
        newNode.trueChildren = newNode.children;
        this.currentScope.children.push(newNode);
        this.currentScope = newNode;
      }
      return result;
    };

    _Class.prototype.scanForElseToken = function() {
      var result;
      result = this.scanner.scan(/\{else\}/);
      if (result) {
        this.currentScope.children = this.currentScope.falseChildren = [];
      }
      return result;
    };

    _Class.prototype.scanForEndToken = function() {
      var result;
      result = this.scanner.scan(/\{end\}/);
      if (result) {
        if (this.currentScope.type === 'conditional') {
          delete this.currentScope.children;
        }
        this.currentScope = this.currentScope.parent;
      }
      return result;
    };

    _Class.prototype.scanForSource = function() {
      var result, value;
      result = this.scanner.scan(/\{[a-zA-Z\.]+\}\<\//);
      if (result) {
        value = result.substr(1, result.length - 4);
        this.currentScope.source = value;
        this.scanner.head -= 2;
      } else {
        result = this.scanner.scan(/\{[a-zA-Z\.]+\}$/);
        if (result) {
          value = result.substr(1, result.length - 2);
          this.currentScope.source = value;
        }
      }
      return result;
    };

    _Class.prototype.scanForText = function() {
      var newNode, result, value;
      result = this.scanner.scanUntil(/</);
      if (result) {
        value = result.substr(0, result.length - 1);
        newNode = buildText(value);
        this.currentScope.children.push(newNode);
        this.scanner.head -= 1;
      } else {
        value = this.scanner.scanUntil(/$/);
        newNode = buildText(value);
        this.currentScope.children.push(newNode);
      }
      return result;
    };

    _Class.prototype.parseAttributes = function(attributesAsString) {
      var attributes;
      attributes = {};
      attributesAsString.replace(new RegExp('([a-z]+)="(.*?)"', "g"), function($0, $1, $2) {
        return attributes[$1] = $2;
      });
      return attributes;
    };

    _Class.prototype.parseStyle = function(stylesAsString) {
      var re, split, styleAsString, styles, _i, _len, _ref;
      re = new RegExp(' ', 'g');
      styles = {};
      _ref = stylesAsString.replace(re, '').split(';');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        styleAsString = _ref[_i];
        split = styleAsString.split(':');
        styles[split[0]] = buildText(split[1]);
      }
      return styles;
    };

    _Class.prototype.parseClass = function(classesAsString) {
      var classes, klass, _i, _len, _ref;
      classes = [];
      _ref = classesAsString.split(' ');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        klass = _ref[_i];
        classes.push(buildText(klass));
      }
      return classes;
    };

    _Class.prototype.addAttributes = function(node, attributes) {
      var key, value, _results;
      if (attributes.style) {
        node.styles = this.parseStyle(attributes.style);
        delete attributes.style;
      }
      if (attributes["class"]) {
        node.classes = this.parseClass(attributes["class"]);
        delete attributes["class"];
      }
      if (Object.keys(attributes).length !== 0) {
        node.attributes = {};
        _results = [];
        for (key in attributes) {
          value = attributes[key];
          _results.push(node.attributes[key] = buildText(value));
        }
        return _results;
      }
    };

    return _Class;

  })();

}).call(this);
}, "wingman/view": function(exports, require, module) {(function() {
  var Elementary, Fleck, STYLE_NAMES, View, Wingman,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Wingman = require('../wingman');

  Elementary = require('./shared/elementary');

  Fleck = require('fleck');

  STYLE_NAMES = ['backgroundImage', 'backgroundColor', 'backgroundPosition', 'left', 'right', 'top', 'bottom', 'width', 'height'];

  module.exports = View = (function(_super) {

    __extends(View, _super);

    View.include(Elementary);

    View.parseEvents = function(eventsHash) {
      var key, trigger, _results;
      _results = [];
      for (key in eventsHash) {
        trigger = eventsHash[key];
        _results.push(this.parseEvent(key, trigger));
      }
      return _results;
    };

    View.parseEvent = function(key, trigger) {
      var type;
      type = key.split(' ')[0];
      return {
        selector: key.substring(type.length + 1),
        type: type,
        trigger: trigger
      };
    };

    function View(options) {
      if ((options != null ? options.parent : void 0) != null) {
        this.set({
          parent: options.parent
        });
      }
      if ((options != null ? options.app : void 0) != null) {
        this.set({
          app: options.app
        });
      }
      if ((options != null ? options.childClasses : void 0) != null) {
        this.set({
          childClasses: options.childClasses
        });
      }
      this.el = (options != null ? options.el : void 0) || Wingman.document.createElement(this.tag || 'div');
      this.set({
        children: []
      });
      View.__super__.constructor.call(this);
      if (options != null ? options.render : void 0) this.render();
    }

    View.prototype.name = function() {
      var withoutView;
      withoutView = this.constructor.name.replace(/View$/, '');
      return Fleck.camelize(Fleck.underscore(withoutView));
    };

    View.prototype.render = function() {
      var template, templateSource;
      templateSource = this.get('templateSource');
      if (templateSource) {
        template = Wingman.Template.compile(templateSource);
        template(this.el, this);
      }
      this.addClass(this.pathName());
      this.setupListeners();
      this.setupStyles();
      return typeof this.ready === "function" ? this.ready() : void 0;
    };

    View.prototype.childClasses = function() {
      return this.constructor;
    };

    View.prototype.createChild = function(name, options) {
      var child, className, klass,
        _this = this;
      className = Fleck.camelize(Fleck.underscore(name), true) + 'View';
      klass = this.get('childClasses')[className];
      child = new klass({
        parent: this,
        app: this.get('app')
      });
      if (options != null ? options.properties : void 0) {
        child.set(options.properties);
      }
      this.get('children').push(child);
      child.bind('remove', function() {
        return _this.get('children').remove(child);
      });
      child.bind('descendantCreated', function(child) {
        return _this.trigger('descendantCreated', child);
      });
      this.trigger('descendantCreated', child);
      if (options != null ? options.render : void 0) child.render();
      return child;
    };

    View.prototype.templateSource = function() {
      var name, templateSource;
      name = this.get('templateName');
      templateSource = this.constructor.templateSources[name];
      if (!templateSource) throw new Error("Template '" + name + "' not found.");
      return templateSource;
    };

    View.prototype.templateName = function() {
      return this.path();
    };

    View.prototype.setupListeners = function() {
      var _this = this;
      this.el.addEventListener('click', function(e) {
        if (_this.click) return _this.click(e);
      });
      if (this.events) return this.setupEvents();
    };

    View.prototype.setupEvents = function() {
      var event, _i, _len, _ref, _results;
      _ref = this.constructor.parseEvents(this.events);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        event = _ref[_i];
        _results.push(this.setupEvent(event));
      }
      return _results;
    };

    View.prototype.triggerWithCustomArguments = function(trigger) {
      var args, argumentsMethodName, customArguments;
      args = [trigger];
      argumentsMethodName = Fleck.camelize(trigger) + "Arguments";
      customArguments = typeof this[argumentsMethodName] === "function" ? this[argumentsMethodName]() : void 0;
      if (customArguments) args.push.apply(args, customArguments);
      return this.trigger.apply(this, args);
    };

    View.prototype.setupEvent = function(event) {
      var _this = this;
      return this.el.addEventListener(event.type, function(e) {
        var current, elm, match, _i, _len, _ref, _results;
        _ref = Array.prototype.slice.call(_this.el.querySelectorAll(event.selector), 0);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          elm = _ref[_i];
          current = e.target;
          while (current !== _this.el && !match) {
            match = elm === current;
            current = current.parentNode;
          }
          if (match) {
            _this.triggerWithCustomArguments(event.trigger);
            _results.push(e.preventDefault());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
    };

    View.prototype.pathName = function() {
      return Fleck.underscore(this.constructor.name.replace(/([A-Z])/g, ' $1').substring(1).split(' ').slice(0, -1).join(''));
    };

    View.prototype.append = function(view) {
      return this.el.appendChild(view.el);
    };

    View.prototype.pathKeys = function() {
      var pathKeys, _ref;
      if (this.isRoot()) return [];
      pathKeys = [this.pathName()];
      if (((_ref = this.get('parent')) != null ? _ref.pathKeys : void 0) != null) {
        pathKeys = this.get('parent').pathKeys().concat(pathKeys);
      }
      return pathKeys;
    };

    View.prototype.isRoot = function() {
      return this.get('parent') instanceof Wingman.Application;
    };

    View.prototype.path = function() {
      if (this.get('parent') instanceof Wingman.Application) {
        return 'root';
      } else {
        return this.pathKeys().join('.');
      }
    };

    View.prototype.remove = function() {
      if (this.el.parentNode) Elementary.remove.call(this);
      return this.trigger('remove');
    };

    View.prototype.setupStyles = function() {
      var name, property, _results;
      _results = [];
      for (name in this) {
        property = this[name];
        if (__indexOf.call(STYLE_NAMES, name) >= 0) {
          _results.push(this.setupStyle(name));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    View.prototype.setupStyle = function(name) {
      var _this = this;
      this.setStyle(name, this.get(name));
      return this.observe(name, function(newValue) {
        return _this.setStyle(name, newValue);
      });
    };

    View.prototype.createSubContext = function() {
      var context,
        _this = this;
      context = View.__super__.createSubContext.call(this);
      context.bind('descendantCreated', function(child) {
        return _this.trigger('descendantCreated', child);
      });
      return context;
    };

    return View;

  })(Wingman.Object);

}).call(this);
}, "strscan": function(exports, require, module) {(function() {
  var StringScanner;
  ((typeof exports !== "undefined" && exports !== null) ? exports : this).StringScanner = (function() {
    StringScanner = function(source) {
      this.source = source.toString();
      this.reset();
      return this;
    };
    StringScanner.prototype.scan = function(regexp) {
      var matches;
      return (matches = regexp.exec(this.getRemainder())) && matches.index === 0 ? this.setState(matches, {
        head: this.head + matches[0].length,
        last: this.head
      }) : this.setState([]);
    };
    StringScanner.prototype.scanUntil = function(regexp) {
      var matches;
      if (matches = regexp.exec(this.getRemainder())) {
        this.setState(matches, {
          head: this.head + matches.index + matches[0].length,
          last: this.head
        });
        return this.source.slice(this.last, this.head);
      } else {
        return this.setState([]);
      }
    };
    StringScanner.prototype.scanChar = function() {
      return this.scan(/[\s\S]/);
    };
    StringScanner.prototype.skip = function(regexp) {
      if (this.scan(regexp)) {
        return this.match.length;
      }
    };
    StringScanner.prototype.skipUntil = function(regexp) {
      if (this.scanUntil(regexp)) {
        return this.head - this.last;
      }
    };
    StringScanner.prototype.check = function(regexp) {
      var matches;
      return (matches = regexp.exec(this.getRemainder())) && matches.index === 0 ? this.setState(matches) : this.setState([]);
    };
    StringScanner.prototype.checkUntil = function(regexp) {
      var matches;
      if (matches = regexp.exec(this.getRemainder())) {
        this.setState(matches);
        return this.source.slice(this.head, this.head + matches.index + matches[0].length);
      } else {
        return this.setState([]);
      }
    };
    StringScanner.prototype.peek = function(length) {
      return this.source.substr(this.head, (typeof length !== "undefined" && length !== null) ? length : 1);
    };
    StringScanner.prototype.getSource = function() {
      return this.source;
    };
    StringScanner.prototype.getRemainder = function() {
      return this.source.slice(this.head);
    };
    StringScanner.prototype.getPosition = function() {
      return this.head;
    };
    StringScanner.prototype.hasTerminated = function() {
      return this.head === this.source.length;
    };
    StringScanner.prototype.getPreMatch = function() {
      if (this.match) {
        return this.source.slice(0, this.head - this.match.length);
      }
    };
    StringScanner.prototype.getMatch = function() {
      return this.match;
    };
    StringScanner.prototype.getPostMatch = function() {
      if (this.match) {
        return this.source.slice(this.head);
      }
    };
    StringScanner.prototype.getCapture = function(index) {
      return this.captures[index];
    };
    StringScanner.prototype.reset = function() {
      return this.setState([], {
        head: 0,
        last: 0
      });
    };
    StringScanner.prototype.terminate = function() {
      return this.setState([], {
        head: this.source.length,
        last: this.head
      });
    };
    StringScanner.prototype.concat = function(string) {
      return this.source += string;
    };
    StringScanner.prototype.unscan = function() {
      if (this.match) {
        return this.setState([], {
          head: this.last,
          last: 0
        });
      } else {
        throw "nothing to unscan";
      }
    };
    StringScanner.prototype.setState = function(matches, values) {
      var _a, _b;
      this.head = (typeof (_a = ((typeof values === "undefined" || values === null) ? undefined : values.head)) !== "undefined" && _a !== null) ? _a : this.head;
      this.last = (typeof (_b = ((typeof values === "undefined" || values === null) ? undefined : values.last)) !== "undefined" && _b !== null) ? _b : this.last;
      this.captures = matches.slice(1);
      return (this.match = matches[0]);
    };
    return StringScanner;
  })();
})();
}, "fleck": function(exports, require, module) {/*!
  * fleck - functional style string inflections
  * https://github.com/trek/fleck
  * copyright Trek Glowacki
  * MIT License
  */
  
!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()
}('fleck', function () {
  
  var lib = {
    // plural rules, singular rules, and starting uncountables
    // from http://code.google.com/p/inflection-js/
    // with corrections for ordering and spelling
    pluralRules: [
      [new RegExp('(m)an$', 'gi'),                 '$1en'],
      [new RegExp('(pe)rson$', 'gi'),              '$1ople'],
      [new RegExp('(child)$', 'gi'),               '$1ren'],
      [new RegExp('^(ox)$', 'gi'),                 '$1en'],
      [new RegExp('(ax|test)is$', 'gi'),           '$1es'],
      [new RegExp('(octop|vir)us$', 'gi'),         '$1i'],
      [new RegExp('(alias|status)$', 'gi'),        '$1es'],
      [new RegExp('(bu)s$', 'gi'),                 '$1ses'],
      [new RegExp('(buffal|tomat|potat)o$', 'gi'), '$1oes'],
      [new RegExp('([ti])um$', 'gi'),              '$1a'],
      [new RegExp('sis$', 'gi'),                   'ses'],
      [new RegExp('(?:([^f])fe|([lr])f)$', 'gi'),  '$1$2ves'],
      [new RegExp('(hive)$', 'gi'),                '$1s'],
      [new RegExp('([^aeiouy]|qu)y$', 'gi'),       '$1ies'],
      [new RegExp('(matr|vert|ind)ix|ex$', 'gi'),  '$1ices'],
      [new RegExp('(x|ch|ss|sh)$', 'gi'),          '$1es'],
      [new RegExp('([m|l])ouse$', 'gi'),           '$1ice'],
      [new RegExp('(quiz)$', 'gi'),                '$1zes'],
      [new RegExp('s$', 'gi'),                     's'],
      [new RegExp('$', 'gi'),                      's']
    ],
    singularRules: [
      [new RegExp('(m)en$', 'gi'),                                                       '$1an'],
      [new RegExp('(pe)ople$', 'gi'),                                                    '$1rson'],
      [new RegExp('(child)ren$', 'gi'),                                                  '$1'],
      [new RegExp('([ti])a$', 'gi'),                                                     '$1um'],
      [new RegExp('((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$','gi'), '$1$2sis'],
      [new RegExp('(hive)s$', 'gi'),                                                     '$1'],
      [new RegExp('(tive)s$', 'gi'),                                                     '$1'],
      [new RegExp('(curve)s$', 'gi'),                                                    '$1'],
      [new RegExp('([lr])ves$', 'gi'),                                                   '$1f'],
      [new RegExp('([^fo])ves$', 'gi'),                                                  '$1fe'],
      [new RegExp('([^aeiouy]|qu)ies$', 'gi'),                                           '$1y'],
      [new RegExp('(s)eries$', 'gi'),                                                    '$1eries'],
      [new RegExp('(m)ovies$', 'gi'),                                                    '$1ovie'],
      [new RegExp('(x|ch|ss|sh)es$', 'gi'),                                              '$1'],
      [new RegExp('([m|l])ice$', 'gi'),                                                  '$1ouse'],
      [new RegExp('(bus)es$', 'gi'),                                                     '$1'],
      [new RegExp('(o)es$', 'gi'),                                                       '$1'],
      [new RegExp('(shoe)s$', 'gi'),                                                     '$1'],
      [new RegExp('(cris|ax|test)es$', 'gi'),                                            '$1is'],
      [new RegExp('(octop|vir)i$', 'gi'),                                                '$1us'],
      [new RegExp('(alias|status)es$', 'gi'),                                            '$1'],
      [new RegExp('^(ox)en', 'gi'),                                                      '$1'],
      [new RegExp('(vert|ind)ices$', 'gi'),                                              '$1ex'],
      [new RegExp('(matr)ices$', 'gi'),                                                  '$1ix'],
      [new RegExp('(quiz)zes$', 'gi'),                                                   '$1'],
      [new RegExp('s$', 'gi'),                                                           '']
    ],
    uncountableWords: {
      'equipment': true,
      'information': true,
      'rice': true,
      'money': true,
      'species': true,
      'series':true,
      'fish':true,
      'sheep':true,
      'moose':true,
      'deer':true, 
      'news':true
    },
    // Chain multiple inflections into a signle call
    // Examples:
    //   lib.inflect('     posts', 'strip', 'singularize', 'capitalize') == 'Post'
    inflect: function(str){
      for (var i = 1, l = arguments.length; i < l; i++) {
        str = lib[arguments[i]](str);
      };

      return str;
    },
    // Uppercases the first letter and lowercases all other letters
    // Examples:
    //   lib.capitalize("message_properties") == "Message_properties"
    //   lib.capitalize("message properties") == "Message properties"
    capitalize: function(str) {
      return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
    },
    // lib.camelize("message_properties") == "messageProperties"
    // lib.camelize('-moz-border-radius') == 'mozBorderRadius'
    // lib.camelize("message_properties", true) == "MessageProperties"
    camelize: function(str, upper){
      if (upper) { return lib.upperCamelize(str) };
      return str.replace(/[-_]+(.)?/g, function(match, chr) {
        return chr ? chr.toUpperCase() : '';
      });
    },
    // lib.upperCamelize("message_properties") == "MessageProperties"
    upperCamelize: function(str){
      return lib.camelize(lib.capitalize(str));
    },
    // Replaces all spaces or underscores with dashes
    // Examples:
    //   lib.dasherize("message_properties") == "message-properties"
    //   lib.dasherize("Message properties") == "Message-properties"
    dasherize: function(str){
      return str.replace(/\s|_/g, '-');
    },
    // turns number or string formatted number into ordinalize version
    // Examples:
    //   lib.ordinalize(4) == "4th"
    //   lib.ordinalize("13") == "13th"
    //   lib.ordinalize("122") == "122nd"
    ordinalize: function(str){
      var isTeen, r, n;
      n = parseInt(str, 10) % 100;
      isTeen = { 11: true, 12: true, 13: true}[n];
      if(isTeen) {return str + 'th'};
      n = parseInt(str, 10) % 10
      switch(n) {
      case 1:
        r = str + 'st';
        break;
      case 2:
        r = str + 'nd';
        break;
      case 3:
        r = str + 'rd';
        break;
      default:
        r = str + 'th';
      }
      return r;
    },
    pluralize: function(str){
      var uncountable = lib.uncountableWords[str.toLowerCase()];
      if (uncountable) {
        return str;
      };
      var rules = lib.pluralRules;
      for(var i = 0, l = rules.length; i < l; i++){
        if (str.match(rules[i][0])) {
          str = str.replace(rules[i][0], rules[i][1]);
          break;
        };
      }

      return str;
    },
    singularize: function(str){
      var uncountable = lib.uncountableWords[str.toLowerCase()];
      if (uncountable) {
        return str;
      };
      var rules = lib.singularRules;
      for(var i = 0, l = rules.length; i < l; i++){
        if (str.match(rules[i][0])) {
          str = str.replace(rules[i][0], rules[i][1]);
          break;
        };
      }

      return str;
    },
    // Removes leading and trailing whitespace
    // Examples:
    //    lib.strip("    hello world!    ") == "hello world!"
    strip: function(str){
      // implementation from Prototype.js
      return str.replace(/^\s+/, '').replace(/\s+$/, '');
    },
    // Converts a camelized string into a series of words separated by an
    // underscore (`_`).
    // Examples
    //   lib.underscore('borderBottomWidth') == "border_bottom_width"
    //   lib.underscore('border-bottom-width') == "border_bottom_width"
    //   lib.underscore('Foo::Bar') == "foo_bar"
    underscore: function(str){
      // implementation from Prototype.js
      return str.replace(/::/g, '/')
                .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
                .replace(/([a-z\d])([A-Z])/g, '$1_$2')
                .replace(/-/g, '_')
                .toLowerCase();
    },
    
    // add an uncountable word
    // fleck.uncountable('ninja', 'tsumani');
    uncountable: function(){
      for(var i=0,l=arguments.length; i<l; i++){
        lib.uncountableWords[arguments[i]] = true;
      }
      return lib;
    }
  };
  
  return lib;
  
});
}});

  window.Wingman = require('wingman');
})(window);