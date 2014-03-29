var Matrix = function (version, eclevel) {
    'use strict';

    this.config = new Config();

    if (typeof version === 'undefined' || isNaN(parseInt(version))) {
        throw 'Invalid version number.';
    }

    this.DATA_UNDEFINED_MODULE = 7;
    this.DATA_LIGHT_MODULE = 0;
    this.DATA_DARK_MODULE = 1;

    this.MASK_UNDEFINED_MODULE = 15;
    this.MASK_POSITION_DETECTION_PATTERN = 101;
    this.MASK_SEPARATOR = 102;
    this.MASK_TOP_TIMER = 103;
    this.MASK_LEFT_TIMER = 104;
    this.MASK_ALIGNMENT_PATTERN = 105;
    this.MASK_FIXED_DARK_MODULE = 106;

    this.MASK_FORMAT_INFORMATION = 201;
    this.MASK_VERSION_INFORMATION_NE = 202;
    this.MASK_VERSION_INFORMATION_SW = 222;
    this.MASK_DATA = 255;

    this.version = parseInt(version);
    this.eclevel = eclevel;
    this.size = (((this.version - 1) * 4) + 21);
    this.data = this.allocate(this.size, this.DATA_UNDEFINED_MODULE);
    this.mask = this.allocate(this.size, this.MASK_UNDEFINED_MODULE);
};

Matrix.prototype.constructor = Matrix;

/**
 * Main stream logic methods
 */

Matrix.prototype.setStaticAreas = function () {
    'use strict';

    this.setPositionDetectionPatterns();
    this.setSeparators();
    this.setTimingPatterns();
    this.setFixedDarkModule();
    this.setAlignmentPatterns();
};

Matrix.prototype.setFixedDarkModule = function () {
    'use strict';

    var x = 8;
    var y = (4 * this.version) + 9;

    this.setDarkModule(x, y, this.MASK_FIXED_DARK_MODULE);
};

Matrix.prototype.setPositionDetectionPatterns = function () {
    'use strict';

    this.setPositionDetectionPattern(0, 0);
    this.setPositionDetectionPattern(this.getSize() - 7, 0);
    this.setPositionDetectionPattern(0, this.getSize() - 7);
};

Matrix.prototype.setSeparators = function () {
    'use strict';

    var i;
    var x = 0, y = 0;
    var offset = this.getSize() - 7;
    var aoffset = 0;
    var boffset = 7;

    // LEFT-TOP:
    i = 7;
    while (i > 0) {
        i -= 1;
        this.setLightModule(x + boffset, y + aoffset + i, this.MASK_SEPARATOR);
        this.setLightModule(x + aoffset + i, y + boffset, this.MASK_SEPARATOR);
    }

    aoffset = boffset;
    boffset = aoffset;
    this.setLightModule(x + aoffset, y + boffset, this.MASK_SEPARATOR);

    // RIGHT-TOP:
    i = 7;
    while (i > 0) {
        i -= 1;
        aoffset = offset;
        boffset = 7;
        this.setLightModule(x + aoffset + i, y + boffset, this.MASK_SEPARATOR);
        aoffset = offset - 1;
        boffset = 0;
        this.setLightModule(x + aoffset, y + boffset + i, this.MASK_SEPARATOR);
    }

    aoffset = offset - 1;
    boffset = 7;

    this.setLightModule(x + aoffset, y + boffset, this.MASK_SEPARATOR);

    // LEFT BOTTOM:
    i = 7;
    while (i > 0) {
        i -= 1;
        aoffset = 7;
        boffset = offset;
        this.setLightModule(x + aoffset, y + boffset + i, this.MASK_SEPARATOR);
        aoffset = 0;
        boffset = offset - 1;
        this.setLightModule(x + aoffset + i, y + boffset, this.MASK_SEPARATOR);
    }

    aoffset = offset - 1;
    boffset = 7;
    this.setLightModule(x + boffset, y + aoffset, this.MASK_SEPARATOR);
};

Matrix.prototype.setTimingPatterns = function () {
    'use strict';

    var limit = this.getSize() - 7;

    for (var c = 8; c < limit - 1; c += 1) {
        if (c % 2 === 0) {
            this.setDarkModule(c, 6, this.MASK_TOP_TIMER);
            this.setDarkModule(6, c, this.MASK_LEFT_TIMER);
        } else {
            this.setLightModule(c, 6, this.MASK_TOP_TIMER);
            this.setLightModule(6, c, this.MASK_LEFT_TIMER);
        }
    }
};

Matrix.prototype.setAlignmentPatterns = function () {
    'use strict';

    var table = this.config.alignmentPatternLocations[this.version];

    for (var x = 0; x < table.length; x += 1) {
        for (var y = 0; y < table.length; y += 1) {

            if (x === 0 && y === 0 || x === 0 && y === table.length - 1 || x === table.length - 1 && y === 0) {
                continue;
            }

            this.setAlignmentPattern(table[x], table[y]);
        }
    }
};

Matrix.prototype.setReservedAreas = function () {
    'use strict';

    this.setFormatInformationArea();
    this.setVersionInformationArea();
};

Matrix.prototype.setFormatInformationArea = function (formatInformationString, data) {
    'use strict';

    /**
     * If no format information string is given, reserve area (fill with light modules)
     * @type {*|string}
     */
    formatInformationString = formatInformationString || '000000000000000';

    data = data || this.data;

    var formatInformation = formatInformationString.split('').map(function (e) {
        return parseInt(e);
    });

    var bits = [
        [],
        []
    ];

    var val = 0;
    var x, y;

    while (formatInformation.length > 0) {
        val = formatInformation.shift();
        bits[0].push(val);
        bits[1].push(val);
    }

    // Next to the NW Position Detection Pattern
    x = 8;
    y = 0;
    for (; y < 8; y += 1) {
        if (y !== 6) {
            if (bits[0].pop() === 1) {
                this.setDarkModule(x, y, this.MASK_FORMAT_INFORMATION, data);
            }
            else {
                this.setLightModule(x, y, this.MASK_FORMAT_INFORMATION, data);
            }
        }
    }

    // Below the NW Position Detection Pattern
    x = 8;
    y = 8;
    for (; x >= 0; x -= 1) {
        if (x !== 6) {
            if (bits[0].pop() === 1) {
                this.setDarkModule(x, y, this.MASK_FORMAT_INFORMATION, data);
            }
            else {
                this.setLightModule(x, y, this.MASK_FORMAT_INFORMATION, data);
            }
        }
    }

    // Below the NE Position Detection Pattern
    x = this.size - 1;
    y = 8;
    for (; x >= this.size - 8; x -= 1) {
        if (bits[1].pop() === 1) {
            this.setDarkModule(x, y, this.MASK_FORMAT_INFORMATION, data);
        }
        else {
            this.setLightModule(x, y, this.MASK_FORMAT_INFORMATION, data);
        }
    }

    // Next to the SW Position Detection Pattern
    x = 8;
    y = (4 * this.version) + 9 + 1;
    for (; y < this.size; y += 1) {
        if (bits[1].pop() === 1) {
            this.setDarkModule(x, y, this.MASK_FORMAT_INFORMATION, data);
        }
        else {
            this.setLightModule(x, y, this.MASK_FORMAT_INFORMATION, data);
        }
    }
};

Matrix.prototype.setVersionInformationArea = function (versionInformationString, data) {
    'use strict';

    if(this.version < 7) {
        return false;
    }

    /**
     * If no version information string is given, reserve area (fill with light modules)
     * @type {*|string}
     */
    versionInformationString = versionInformationString || '000000000000000000';

    data = data || this.data;

    var temp = versionInformationString.split('').map(function (e) {
        return parseInt(e);
    });

    var bits = [
        [],
        []
    ];

    var val, x, y, i;

    while (temp.length > 0) {
        val = temp.shift();
        bits[0].push(val);
        bits[1].push(val);
    }

    // NE
    y = 0;
    x = this.size - 11;

    for (; y < 6; y += 1) {
        for (i = 0; i < 3; i += 1) {
            if (bits[0].pop() === 1) {
                this.setDarkModule(x + i, y, this.MASK_VERSION_INFORMATION_NE, data);
            }
            else {
                this.setLightModule(x + i, y, this.MASK_VERSION_INFORMATION_NE, data);
            }
        }
    }

    // SW
    y = this.size - 11;
    x = 0;

    for (; x < 6; x += 1) {
        for (i = 0; i < 3; i += 1) {
            if (bits[1].pop() === 1) {
                this.setDarkModule(x, y + i, this.MASK_VERSION_INFORMATION_SW, data);
            }
            else {
                this.setLightModule(x, y + i, this.MASK_VERSION_INFORMATION_SW, data);
            }
        }
    }

    return true;
};

/**
 * Helpers
 */

Matrix.prototype.allocate = function (size, module) {
    'use strict';

    var r, c;

    var data = [];

    for (r = 0; r < size; r += 1) {
        var row = [];
        for (c = 0; c < size; c += 1) {
            row[c] = module;
        }
        data.push(row);
    }

    return data;
};

Matrix.prototype.getSize = function () {
    'use strict';

    return this.size;
};

Matrix.prototype.getData = function () {
    'use strict';

    return this.data;
};

Matrix.prototype.getMask = function () {
    'use strict';

    return this.mask;
};

Matrix.prototype.setAlignmentPattern = function (cx, cy) {
    'use strict';

    var x, y, i, offset;

    // CENTER:
    this.setDarkModule(cx, cy, this.MASK_ALIGNMENT_PATTERN);

    offset = 1;

    for (x = cx - offset; x <= cx + offset; x += 1) {
        y = cy - offset;
        this.setLightModule(x, y, this.MASK_ALIGNMENT_PATTERN);
        y = cy + offset;
        this.setLightModule(x, y, this.MASK_ALIGNMENT_PATTERN);
    }

    for (i = cy - offset; i <= cy + offset; i += 1) {
        y = i;
        x = cx - offset;
        this.setLightModule(x, y, this.MASK_ALIGNMENT_PATTERN);
        x = cx + offset;
        this.setLightModule(x, y, this.MASK_ALIGNMENT_PATTERN);
    }

    offset = 2;

    for (i = cx - offset; i <= cx + offset; i += 1) {
        x = i;
        y = cy - offset;
        this.setDarkModule(x, y, this.MASK_ALIGNMENT_PATTERN);
        y = cy + offset;
        this.setDarkModule(x, y, this.MASK_ALIGNMENT_PATTERN);
    }

    for (i = cy - offset; i <= cy + offset; i += 1) {
        y = i;
        x = cx - offset;
        this.setDarkModule(x, y, this.MASK_ALIGNMENT_PATTERN);
        x = cx + offset;
        this.setDarkModule(x, y, this.MASK_ALIGNMENT_PATTERN);
    }
};

Matrix.prototype.setPositionDetectionPattern = function (top, left) {
    'use strict';

    var x, y;

    // TOP/BOTTOM:
    for (x = 0; x < 7; x += 1) {
        y = 0;
        this.setDarkModule((left + x), (top + y), this.MASK_POSITION_DETECTION_PATTERN);
        y = 6;
        this.setDarkModule((left + x), (top + y), this.MASK_POSITION_DETECTION_PATTERN);
    }

    // INNER SEPARATOR TOP/BOTTOM:
    for (x = 1; x < 6; x += 1) {
        y = 1;
        this.setLightModule((left + x), (top + y), this.MASK_POSITION_DETECTION_PATTERN);
        y = 5;
        this.setLightModule((left + x), (top + y), this.MASK_POSITION_DETECTION_PATTERN);
    }

    // RIGHT/LEFT:
    for (y = 1; y < 6; y += 1) {
        x = 0;
        this.setDarkModule((left + x), (top + y), this.MASK_POSITION_DETECTION_PATTERN);
        x = 6;
        this.setDarkModule((left + x), (top + y), this.MASK_POSITION_DETECTION_PATTERN);
    }

    // INNER SEPARATOR RIGHT/LEFT:
    for (y = 1; y < 6; y += 1) {
        x = 1;
        this.setLightModule((left + x), (top + y), this.MASK_POSITION_DETECTION_PATTERN);
        x = 5;
        this.setLightModule((left + x), (top + y), this.MASK_POSITION_DETECTION_PATTERN);
    }

    // CENTER:
    for (x = 2; x < 5; x += 1) {
        for (y = 2; y < 5; y += 1) {
            this.setDarkModule((left + x), (top + y), this.MASK_POSITION_DETECTION_PATTERN);
        }
    }
};

Matrix.prototype.isModuleUndefined = function (x, y, data) {
    'use strict';
    data = data || this.data;
    return data[y][x] === this.DATA_UNDEFINED_MODULE;
};

Matrix.prototype.setModule = function (x, y, value, maskValue, data) {
    'use strict';

    data = data || this.data;
    data[y][x] = value;
    this.mask[y][x] = maskValue;
};

Matrix.prototype.setDarkModule = function (x, y, maskValue, data) {
    'use strict';

    data = data || this.data;
    this.setModule(x, y, this.DATA_DARK_MODULE, maskValue, data);
};

Matrix.prototype.setLightModule = function (x, y, maskValue, data) {
    'use strict';

    data = data || this.data;
    this.setModule(x, y, this.DATA_LIGHT_MODULE, maskValue, data);
};
