import redis from 'redis';
import request from 'request-promise';

module.exports = (options = {}) => {
  let client = redis.createClient(options);

  function add(key, serviceKey = null, requestOptions = {}) {
    return new Promise((resolve, reject) => {
      if (serviceKey) {
        client.hset(key, serviceKey, JSON.stringify(requestOptions), (err, res) => {
          if (!err) {
            resolve(res);
          } else {
            reject(err);
          }
        });
      } else {
        client.set(key, JSON.stringify(requestOptions), (err, res) => {
          if (!err) {
            resolve(res);
          } else {
            reject(err);
          }
        });
      }
    });
  }

  function remove(key, serviceKey = null) {
    return new Promise((resolve, reject) => {
      if (serviceKey) {
        client.hdel(key, serviceKey, (err, res) => {
          if (!err) {
            resolve(res);
          } else {
            reject(err);
          }
        });
      } else {
        client.del(key, (err, res) => {
          if (!err) {
            resolve(res);
          } else {
            reject(err);
          }
        });
      }
    });
  }

  function run(key, serviceKey = null) {
    return new Promise((resolve, reject) => {
      if (serviceKey) {
        client.hget(key, serviceKey, (err, data) => {
          if (!err) {
            // Call compensating action request
            request(JSON.parse(compensation))
              .then(res => resolve(res))
              .catch(err => reject(err));
          } else {
            reject(err);
          }
        });
      } else {
        client.get(key, (err, compensation) => {
          if (!err) {
            // Call compensating action request
            request(JSON.parse(compensation))
              .then(res => {
                // Remove key on compensation success
                remove(key)
                  // Return result of compensation
                  .then(_res => {
                    resolve(res);
                  });
              })
              .catch(err => reject(err));
          } else {
            reject(err);
          }
        });
      }
    });
  }

  function runAll(key) {
    return new Promise((resolve, reject) => {
      client.hgetall(key, (err, data) => {
        if (!err) {
          let promises = [];
          // Call compensating action requests
          data.forEach(compensation => {
            promises.push(request(JSON.parse(compensation)));
          });
          resolve(Promise.all(promises));
        } else {
          reject(err);
        }
      });
    });
  }

  return {
    client,
    add,
    remove,
    run,
    runAll
  }
};
