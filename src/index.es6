import redis from 'redis';
import request from 'request-promise';

module.exports = (options = {}) => {
  let client = redis.createClient(options);
  return {
    client,
    add: (id, requestOptions = {}) => {
      const key = id.toString();
      return new Promise((resolve, reject) => {
        client.set(key, JSON.stringify(requestOptions), (err, res) => {
          if (!err) {
            resolve(res);
          } else {
            reject(err);
          }
        });
      });
    },
    remove: id => {
      const key = id.toString();
      return new Promise((resolve, reject) => {
        client.del(key, (err, res) => {
          if (!err) {
            resolve(res);
          } else {
            reject(err);
          }
        });
      });
    },
    run: id => {
      const key = id.toString();
      return new Promise((resolve, reject) => {
        client.get(key, (err, data) => {
          if (!err) {
            const requestOptions = JSON.parse(data);
            // Call compensating action request
            request(requestOptions)
              .then(res => resolve(res))
              .catch(err => reject(err));
          } else {
            reject(err);
          }
        });
      });
    }
  }
};
