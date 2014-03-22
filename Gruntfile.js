module.exports = function (grunt) {
    'use strict';

    var pkg = grunt.file.readJSON('package.json');

    // Project configuration.
    grunt.initConfig({
        pkg: pkg,
        // Before generating new test files, remove any previously-created files.
        clean: {
            tests: ['tmp']
        },
        concat: {
            dest: {
                src: [
                    'src/Utils.js',
                    'src/QrCode/GeneratorPolynominal.js',
                    'src/QrCode/Config.js',
                    'src/QrCode/DataAnalyzer.js',
                    'src/QrCode/DataEncoder.js',
                    'src/QrCode/ErrorCorrection.js',
                    'src/QrCode/Matrix.js',
                    'src/QrCode/Tiler.js',
                    'src/QrCode/Mask.js',
                    'src/QrCode/Evaluation.js',
                    'src/QrCode/QrCode.js'
                ],
                dest: 'dist/qrcode.js'
            },
            ndest: {
                src: [
                    'src/Utils.js',
                    'src/QrCode/GeneratorPolynominal.js',
                    'src/QrCode/Config.js',
                    'src/QrCode/DataAnalyzer.js',
                    'src/QrCode/DataEncoder.js',
                    'src/QrCode/ErrorCorrection.js',
                    'src/QrCode/Matrix.js',
                    'src/QrCode/Tiler.js',
                    'src/QrCode/Mask.js',
                    'src/QrCode/Evaluation.js',
                    'src/QrCode/QrCode.js',
                    'src/nodejs-footer.js'
                ],
                dest: 'dist/nqrcode.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %>: <%= pkg.description %> <%= grunt.template.today("yyyy-mm-dd hh:MM") %> */\n'
            },
            build: {
                src: 'dist/qrcode.js',
                dest: 'dist/qrcode.min.js'
            }
        },
        compare_size: {
            files: [
                'dist/qrcode.js',
                'dist/qrcode.min.js'
            ]
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            files: [
                'Gruntfile.js',
                'src/QrCode/*.js',
                'src/*.js',
                '!dist/*.min.js'
            ]
        },
        qunit: {
            tests: [
                "qunit/*.html"
            ]
        },
        nodeunit: {
            tests: {
                src: [
                    'nodeunit/tests/*.js'
                ]
            }
        },
        shell: {
            nutap: {
                command: 'node ./node_modules/grunt-contrib-nodeunit/node_modules/nodeunit/bin/nodeunit --reporter tap ./nodeunit/tests/qrcode.js',
                options: {
                    stdout: true,
                    stderr: true,
                    failOnError: false,
                    warnOnError: true
                }
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js'
            }
        },
        watch: {
            scripts: {
                files: ['**/*.js'],
                tasks: ['jshint'],
                options: {
                    spawn: false
                }
            }
        },
        jsdoc: {
            dist: {
                src: ['src/*.js', 'README.md'],
                dest: 'doc'
            }
        }
    });

    // Load grunt plugins.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-compare-size');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-shell');

    // Build task.
    grunt.registerTask('build', [ 'concat', 'uglify', 'compare_size' ]);

    // Test tasks.
    grunt.registerTask('utest', [ 'clean', 'nodeunit' ]);
    grunt.registerTask('test', [ 'jshint', 'qunit' ]);

    // Default task.
    grunt.registerTask('default', [ 'build', 'test' ]);

    // All the tasks.
    grunt.registerTask('all', [ 'default', 'utest' ]);
};