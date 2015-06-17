/**
 *  Copyright 2015 Zachary Michael - Squishmedia
 *
 *  This file is part of BIDS-Validator.
 *
 *  BIDS-Validator is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  BIDS-Validator is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with BIDS-Validator.  If not, see <http://www.gnu.org/licenses/>
 **/

// dependencies ------------------------------------------------------

var async  = require('async');
var utils  = require('../utils');

var TSV    = require('./tsv');
var JSON   = require('./json');
var BIDS   = require('./bids');

// public api --------------------------------------------------------

var validate = {
	BIDS: BIDS,
	BIDSPath: BIDSPath,
	JSON: JSON,
	TSV: TSV
};

// implementations ---------------------------------------------------


function BIDSPath (path, callback) {
    utils.readDir(path, function (files) {
        BIDS(files, function (errors) {
            callback(errors);
        });
    });
}



// exports -----------------------------------------------------------

module.exports = validate;