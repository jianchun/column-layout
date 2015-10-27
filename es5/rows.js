'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Columns = require('./columns');
var ansi = require('./ansi');
var arrayify = require('array-back');

var Rows = (function (_Array) {
  _inherits(Rows, _Array);

  function Rows(rows) {
    _classCallCheck(this, Rows);

    _get(Object.getPrototypeOf(Rows.prototype), 'constructor', this).call(this);
    this.load(rows);
  }

  _createClass(Rows, [{
    key: 'load',
    value: function load(rows) {
      var _this = this;

      arrayify(rows).forEach(function (row) {
        return _this.push(row);
      });
    }
  }, {
    key: 'getColumns',
    value: function getColumns() {
      var columns = new Columns();
      this.forEach(function (row) {
        var _loop = function (columnName) {
          var column = columns.find(function (column) {
            return column.name === columnName;
          });
          if (!column) {
            column = columns.add({ name: columnName, contentWidth: 0, minContentWidth: 0 });
          }
          var cellValue = row[columnName];
          if (cellValue === undefined) {
            cellValue = '';
          } else if (ansi.has(cellValue)) {
            cellValue = ansi.remove(cellValue);
          } else {
            cellValue = String(cellValue);
          }
          if (cellValue.length > column.contentWidth) column.contentWidth = cellValue.length;

          var longestWord = getLongestWord(cellValue);
          if (longestWord > column.minContentWidth) {
            column.minContentWidth = longestWord;
          }

          if (!column.contentWrappable) column.contentWrappable = /\s+/.test(cellValue);
        };

        for (var columnName in row) {
          _loop(columnName);
        }
      });
      return columns;
    }
  }]);

  return Rows;
})(Array);

function getLongestWord(line) {
  var words = line.match(/(\S+|\r\n?|\n)/g) || [];
  return words.reduce(function (max, word) {
    return Math.max(word.length, max);
  }, 0);
}

module.exports = Rows;