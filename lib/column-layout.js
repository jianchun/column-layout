"use strict";
var wrap = require("word-wrap");
var s = require("string-tools");
var a = require("array-tools");
var o = require("object-tools");
var t = require("typical");

/**
@module column-layout
*/
module.exports = columnLayout;

/**
Returns JSON data formatted in columns.

@param {array} - input data
@param [options] {object} - optional settings
@param [options.viewWidth] {number} - maximum width of layout
@param [options.columns] {module:column-layout~columnOption} - array of column options
@returns {string}
@alias module:column-layout
@example
> columnFormat = require("column-format")
> jsonData = [{ 
    col1: "Some text you wish to read in column layout",
    col2: "And some more text in column two. "
}]
> columnFormat(jsonData, { viewWidth: 30 })
' Some text you  And some more \n wish to read   text in       \n in column      column two.   \n layout                       \n'
*/
function columnLayout(data, options){
    options = o.extend({
        viewWidth: 100,
        padding: {
            left: " ",
            right: " "
        }
    }, options);

    /* split input into data and options */
    if (!Array.isArray(data)){
        if (data.options && data.data){
            options = o.extend(data.options, options);
            data = data.data;
        } else {
            throw new Error("Invalid input data");
        }
    }

    if (!options.columns) options.columns = [];
    
    /* get rows which require column layout */
    var rows = a(data).where(function(row){
        return t.isObject(row);
    }).val();

    /* if no column options supplied, create them.. */
    var uniquePropertyNames = getUniquePropertyNames(rows);
    var columnsWithoutOptions = a(uniquePropertyNames).without(a.pluck(options.columns, "name")).val();
    columnsWithoutOptions.forEach(function(columnName){
        options.columns.push(createColumnOption(columnName));
    });

    /* for 'nowrap' columns, or columns with no specific width, set the width to the content width */
    options.columns.forEach(function(columnOption){
        if (typeof columnOption.width === "undefined" || columnOption.nowrap){
            columnOption = autosizeColumn(rows, columnOption, options);
        }
        return columnOption;
    });

    var totalContentWidth = sum(options.columns, "width");
    var widthDiff = totalContentWidth - options.viewWidth;

    /* make adjustments if the total width is above the available width */
    if (widthDiff > 0){
        autoSizeColumnWidths(options, rows)
    }

    var dataSplit = data.map(renderRow.bind(null, options));
    return dataSplit.reduce(function(output, row){
        output += mergeArrays(row).join("\n") + "\n";
        return output;
    }, "");
}

function getLongestItem(array){
    return array.reduce(function(longest, item){
        if (!Array.isArray(item)) item = String(item);
        if (item.length > longest) longest = item.length;
        return longest;
    }, 0);
}

function mergeArrays(arrays){
    return arrays.reduce(function(merged, array){
        if (merged === null){
            merged = array;
        } else {
            merged = merged.map(function(item, index){
                return item + array[index];
            });
        }
        return merged;
    }, null);
}

function getUniquePropertyNames(rows){
    return rows.reduce(function(keys, row){
        Object.keys(row).forEach(function(key){
            if (!a.contains(keys, key)) keys.push(key);
        });
        return keys;
    }, []);
}

/**
@param {array} - input array
@param [propertyName] {string} - if the input array is a recordset, sum values from this property
@private
*/
function sum(array, property){
    return array.reduce(function(total, item){
        return total + Number(property ? item[property] : item);
    }, 0);
}

function getWrappableColumns(rows, columnOptions){
    var wrappableColumns = columnsContaining(rows, /\s+/);
    return wrappableColumns.filter(function(wrappableCol){
        var columnOption = getColumnOption(columnOptions, wrappableCol);
        return !(columnOption.nowrap || !columnOption._auto);
    });
}

function getUnWrappableColumns(rows, columnOptions){
    return a(columnOptions)
        .pluck("name")
        .without(getWrappableColumns(rows, columnOptions))
        .val();
}

function getCellLines(options, row, column){
    var cellValue = row[column];
    var width = getColumnOption(options.columns, column).width;
    cellValue = String(typeof cellValue === "undefined" || cellValue === null ? "" : cellValue);
    cellValue = wrap(cellValue, { width: width - getPaddingWidth(options), trim: true, indent: "" });
    var cellLines = cellValue.split(/\n/).map(padCell.bind(null, options, width));
    return cellLines;
}

/**
converts a row (object) into an array of "cellLines" arrays, with an equal number of lines, each line padded to the specified column width
@private
*/
function renderRow(options, row){

    if (typeof row === "string"){
        return [ [ row ] ];
    } else {
        /* create a cellLines array for each column */
        var cellLinesRow = Object.keys(row).map(getCellLines.bind(null, options, row));

        /* ensure each cellLines array has the same amount of lines */
        if (cellLinesRow.length > 1){
            var mostLines = getLongestItem(cellLinesRow);
            cellLinesRow = cellLinesRow.map(function(cellLines, index){
                var width = getColumnOption(options.columns, Object.keys(row)[index]).width;
                for (var i = 0; i < mostLines; i++){
                    if (typeof cellLines[i] === "undefined") cellLines.push(padCell(options, width, ""));
                }
                return cellLines;
            });
        }
        return cellLinesRow;
    }
}

function padCell(options, width, value){
    return options.padding.left + s.padRight(value, width - getPaddingWidth(options)) + options.padding.right;
}

function autoSizeColumnWidths(options, data){
    var wrappableColumns = getWrappableColumns(data, options.columns);
    var unWrappableColumns = getUnWrappableColumns(data, options.columns);
    var totalWidthOfUnwrappableColumns = sum(
        a(options.columns).where(unWrappableColumns.map(function(colName){
            return { name: colName };
        })).val(),
        "width"
    );
    var remainingWidth = options.viewWidth - totalWidthOfUnwrappableColumns;
    var reductionShare = Math.floor(remainingWidth / wrappableColumns.length);
    wrappableColumns.forEach(function(columnName){
        getColumnOption(options.columns, columnName).width = reductionShare;
    });
}

function autosizeColumn(rows, columnOption, options){
    var columnValues = a.pluck(rows, columnOption.name);
    columnOption.width = getLongestItem(columnValues) + getPaddingWidth(options);
    columnOption._auto = true;
    return columnOption;
}

function getPaddingWidth(options){
    return options.padding.left.length + options.padding.right.length;
}

function createColumnOption(name){
    return { name: name };
}

function getColumnOption(columnOptions, columnName){
    var columnOption = a(columnOptions).findWhere({ name: columnName });
    if (!columnName) throw Error("Could not find column options for: " + columnName);
    return columnOption;
}

function columnsContaining(rows, test){
    return rows.reduce(function(columns, row){
        o.each(row, function(val, key){
            if (test.test(String(val).trim())){
                if (!a(columns).contains(key)) columns.push(key);
            }
        });
        return columns;
    }, []);
}

/**
@typedef module:column-layout~columnOption
@property [width] {number} - column width
@property [nowrap] {boolean} - disable wrapping for this column
@property [padding] {object} - padding options
@property [padding.left] {string} - a string to pad the left of each cell (default: `" "`)
@property [padding.right] {string} - a string to pad the right of each cell (default: `" "`)
*/