'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var t = require('typical');

var Columns = (function (_Array) {
  _inherits(Columns, _Array);

  function Columns(columns) {
    _classCallCheck(this, Columns);

    _get(Object.getPrototypeOf(Columns.prototype), 'constructor', this).call(this);
    this.load(columns);
  }

  _createClass(Columns, [{
    key: 'totalWidth',
    value: function totalWidth() {
      return this.map(function (col) {
        return col.generatedWidth;
      }).reduce(function (a, b) {
        return a + b;
      });
    }
  }, {
    key: 'totalFixedWidth',
    value: function totalFixedWidth() {
      return this.getFixed().map(function (col) {
        return col.generatedWidth;
      }).reduce(function (a, b) {
        return a + b;
      }, 0);
    }
  }, {
    key: 'get',
    value: function get(columnName) {
      return this.find(function (column) {
        return column.name === columnName;
      });
    }
  }, {
    key: 'getResizable',
    value: function getResizable() {
      return this.filter(function (column) {
        return column.isResizable();
      });
    }
  }, {
    key: 'getFixed',
    value: function getFixed() {
      return this.filter(function (column) {
        return column.isFixed();
      });
    }
  }, {
    key: 'load',
    value: function load(columns) {
      var _this = this;

      if (columns) {
        columns.forEach(function (column) {
          _this.push(column);
        });
      }
    }
  }, {
    key: 'add',
    value: function add(column) {
      var col = new Column(column);
      this.push(col);
      return col;
    }
  }, {
    key: 'autoSize',
    value: function autoSize(viewWidth) {
      var _this2 = this;

      this.forEach(function (column) {
        column.generatedWidth = column.width || column.contentWidth + column.padding.length();
      });

      var width = {
        total: this.totalWidth(),
        view: viewWidth,
        diff: this.totalWidth() - viewWidth,
        totalFixed: this.totalFixedWidth(),
        totalResizable: viewWidth - this.totalFixedWidth()
      };

      if (width.diff) {
        (function () {
          var resizableColumns = _this2.getResizable();
          resizableColumns.forEach(function (column) {
            column.generatedWidth = Math.floor(width.totalResizable / resizableColumns.length);
          });
        })();
      }

      this.forEach(function (column) {
        if (t.isDefined(column.maxWidth) && column.generatedWidth > column.maxWidth) {
          column.generatedWidth = column.maxWidth;
        }
      });
    }
  }]);

  return Columns;
})(Array);

var Column = (function () {
  function Column(column) {
    _classCallCheck(this, Column);

    for (var prop in column) {
      this[prop] = column[prop];
    }
  }

  _createClass(Column, [{
    key: 'isResizable',
    value: function isResizable() {
      return !this.isFixed();
    }
  }, {
    key: 'isFixed',
    value: function isFixed() {
      return t.isDefined(this.width) || this.nowrap || !this.contentWrappable;
    }
  }]);

  return Column;
})();

module.exports = Columns;