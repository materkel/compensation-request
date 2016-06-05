'use strict';

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function () {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var client = _redis2.default.createClient(options);
  return {
    client: client,
    add: function add(id) {
      var requestOptions = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var key = id.toString();
      return new Promise(function (resolve, reject) {
        client.set(key, JSON.stringify(requestOptions), function (err, res) {
          if (!err) {
            resolve(res);
          } else {
            reject(err);
          }
        });
      });
    },
    remove: function remove(id) {
      var key = id.toString();
      return new Promise(function (resolve, reject) {
        client.del(key, function (err, res) {
          if (!err) {
            resolve(res);
          } else {
            reject(err);
          }
        });
      });
    },
    run: function run(id) {
      var key = id.toString();
      return new Promise(function (resolve, reject) {
        client.get(key, function (err, data) {
          if (!err) {
            var requestOptions = JSON.parse(data);
            // Call compensating action request
            (0, _requestPromise2.default)(requestOptions).then(function (res) {
              return resolve(res);
            }).catch(function (err) {
              return reject(err);
            });
          } else {
            reject(err);
          }
        });
      });
    }
  };
};