/*
 * grunt-php-config
 * https://github.com/mothepro/grunt-php-config
 *
 * Copyright (c) 2015 Maurice Prosper
 * Licensed under the MIT license.
 */

'use strict';
Array.prototype.clone = function() {
    return this.slice(0);
};

module.exports = function(grunt) {

    var constants = [];

    function makeConst(consts, parent, raw, allCaps) {
        var k, kk, val, _raw, _allCaps, _parent;

        for(k in consts) {
            if(!consts.hasOwnProperty(k)) continue;

            // props
            val         = consts[k].value || consts[k]; // for shorthand
            _raw        = consts[k].raw || raw; // override
            _allCaps    = consts[k].allCaps || allCaps; // override

            // add the constant
            if(grunt.util.kindOf(val) === 'string')
                constants.push({
                    name: k,
                    value: val,
                    parent: parent,
                    raw: _raw,
                    allCaps: _allCaps
                });

            // loop through children
            if(grunt.util.kindOf(consts[k]) === 'object') {
                var hasMore = false;
                _parent = parent.clone();
                _parent.push(k);

                for (kk in consts[k]) {
                    if (!consts[k].hasOwnProperty(kk)) continue;
                    if (['value', 'raw', 'allCaps'].indexOf(kk) >= 0) continue;
                    hasMore = true;
                    break;
                }

                if(hasMore)
                    makeConst(consts[k], _parent, _raw, _allCaps);
            }
        }
    }

    function write(type) {
        var data, name, value;

        switch(type) {
            case 'php':
                data = '<?php // Generated on ' + grunt.template.today('mmmm dS yyyy @ h:MM:ss TT') + '\n';

                constants.forEach(function(v) {
                    name = v.name;
                    value = v.value;

                    name = v.parent.join('\\') + '\\' + name;
                    if(v.parent.length) // add to prefix first namespace
                        name = '\\' + name;

                    if(!v.raw)
                        value = "'"+ grunt.config.escape(value) + "'";

                    if(v.allCaps)
                        name = name.toUpperCase();

                    data += 'define(\''+ name +'\', '+ value +');\n';
                });

                break;

            default:
                grunt.fail.fatal('Unknown type '+ type);
        }

        return data;
    }

    grunt.registerMultiTask('php_config', 'Builds a PHP config and constants file', function() {
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            type: 'php',
            allCaps: true,
            raw: false,

            constants: null
        }), out = '';

        if (typeof options.constants === 'object') {
            constants = [];
            makeConst(options.constants, [], options.raw, options.allCaps);
            out = write(options.type);

            // all good?
            if (!this.errorCount)
                this.files.forEach(function (f) {
                    grunt.file.write(f.dest, out);
                });

            grunt.log.ok(constants.length + ' constants saved in ' + options.type + ' file: ' + options.dest);
        }

        return !this.errorCount;
    });
};