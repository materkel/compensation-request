import chai from 'chai';
import express from 'express';
import compensationLib from '../index';
import redis from 'redis';

const db = redis.createClient();
const expect = chai.expect;
const app = express();
const appUrl = 'http://localhost:3000';

app.post('/test', (req, res) => {
  res.status(200).end();
});
app.put('/test', (req, res) => {
  res.status(200).end();
});

app.listen(3000);

function clearUpDatabase(done) {
  db.flushdb((err, res) => {
    if (!err) {
      done();
    }
  });
}

before('Clear up database', (done) => clearUpDatabase(done));

describe('The compensation library', () => {
  /********* Start Preparation Code **********/
	const compensation = compensationLib();
  /********* End Preparation Code **********/

	it('should be initialized', () => {
		expect(compensation).to.be.an('object');
	});

	it('should have the desired properties', () => {
    expect(compensation).to.have.property('client');
		expect(compensation).to.have.property('add');
		expect(compensation).to.have.property('run');
	});
});

describe('A compensation', () => {
  /********* Start Preparation Code **********/
  const compensation = compensationLib();
  /********* End Preparation Code **********/

	it('should be added to the database', done => {
    compensation
      .add('compensationid', null, { method: 'POST', uri: `${appUrl}/test` })
      .then(res => {
        db.get('compensationid', (err, res) => {
          if (!err) {
            expect(res).to.be.defined;
            res = JSON.parse(res);
            expect(res).to.be.an('object');
            let { method, uri } = res;
            expect(method).to.be.defined;
            expect(uri).to.be.defined;
            done();
          } else {
            done(err);
          }
        });
      });
	});

  it('should be removed from the database', done => {
    compensation
      .remove('compensationid')
      .then(res => {
        db.get('compensationid', (err, res) => {
          if (!err) {
            expect(res).to.be.defined;
            done();
          } else {
            done(err);
          }
        });
      });
  });

  it('should return a promise when added', done => {
    compensation
      .add('compensationIdxyz', null, { method: 'POST', uri: `${appUrl}/test` })
      .then(() => done())
      .catch(err => done());
  });

  it('should return a promise when called', done => {
    compensation
      .run('compensationIdxyz')
      .then(res => done())
      .catch(err => done(err));
  });

	it('should be called', done => {
    compensation
      .add('compensationId3', null, { method: 'POST', uri: `${appUrl}/test` })
      .then(res => compensation.run('compensationId3'))
      .then(res => done())
      .catch(err => done(err))
  });
});

describe('A compensation with service key', () => {
  /********* Start Preparation Code **********/
  const compensation = compensationLib();
  /********* End Preparation Code **********/

  it('should be added to the database', done => {
    compensation
      .add('compensationid', 'serviceKey', { method: 'POST', uri: `${appUrl}/test` })
      .then(res => {
        db.hget('compensationid', 'serviceKey', (err, res) => {
          if (!err) {
            expect(res).to.be.defined;
            res = JSON.parse(res);
            expect(res).to.be.an('object');
            let { method, uri } = res;
            expect(method).to.be.defined;
            expect(uri).to.be.defined;
            done();
          } else {
            done(err);
          }
        });
      });
  });

  it('should be removed from the database', done => {
    compensation
      .remove('compensationid', 'serviceKey')
      .then(res => {
        db.get('compensationid', (err, res) => {
          if (!err) {
            expect(res).to.be.defined;
            done();
          } else {
            done(err);
          }
        });
      });
  });

  it('should return a promise when added', done => {
    compensation
      .add('compensationIdxyz', null, { method: 'POST', uri: `${appUrl}/test` })
      .then(() => done())
      .catch(err => done());
  });

  it('should return a promise when called', done => {
    compensation
      .run('compensationIdxyz')
      .then(res => done())
      .catch(err => done(err));
  });

  it('should be called with serviceKey', done => {
    compensation
      .add('compensationId4', 'serviceKey', { method: 'POST', uri: `${appUrl}/test` })
      .then(res => compensation.run('compensationId4', 'serviceKey'))
      .then(res => done())
      .catch(err => done(err));
  });
});

describe('Multiple compensations', () => {
  /********* Start Preparation Code **********/
  const compensation = compensationLib();
  /********* End Preparation Code **********/

  it('should be added to the database', done => {
    let promises = [];
    promises.push(compensation.add('compensationid', 'service1', { method: 'POST', uri: `${appUrl}/test` }));
    promises.push(compensation.add('compensationid', 'service2', { method: 'PUT', uri: `${appUrl}/test` }));
    Promise
      .all(promises)
      .then(res => {
        db.hgetall('compensationid', (err, res) => {
          if (!err) {
            expect(res).to.be.an('object');
            for (let serviceKey in res) {
              let compensation = res[serviceKey];
              expect(compensation).to.be.defined;
              compensation = JSON.parse(compensation);
              expect(compensation).to.be.an('object');
              let { method, uri } = compensation;
              expect(method).to.be.defined;
              expect(uri).to.be.defined;
            }
            done();
          } else {
            done(err);
          }
        });
      });
  });

  it('should be removed from the database', done => {
    compensation
      .remove('compensationid')
      .then(res => {
        db.get('compensationid', (err, res) => {
          if (!err) {
            expect(res).to.be.defined;
            done();
          } else {
            done(err);
          }
        });
      });
  });

  it('should be called', done => {
    let promises = [];
    promises.push(compensation.add('compensationid', 'service1', { method: 'POST', uri: `${appUrl}/test` }));
    promises.push(compensation.add('compensationid', 'service2', { method: 'PUT', uri: `${appUrl}/test` }));
    Promise
      .all(promises)
      .then(res => compensation.runAll('compensationid'))
      .then(res => done())
      .catch(err => done(err));
  });
});

after('Clear up database', (done) => clearUpDatabase(done));
