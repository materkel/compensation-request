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
  let compensation = compensationLib();
  /********* End Preparation Code **********/

	it('should be added to the database', done => {
    compensation
      .add('compensationid', { method: 'POST', uri: `${appUrl}/test` })
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
      .add('compensationIdxyz', { method: 'POST', uri: `${appUrl}/test` })
      .then(() => done())
      .catch(err => done());
  });

  it('should return a promise when called', done => {
    compensation
      .run('compensationIdxyz')
      .then(res => done())
      .catch(err => done(err));
  });

  it('should return a promise when removed', done => {
    compensation
      .remove('compensationIdxyz')
      .then(() => done())
      .catch(err => done());
  });

	it('should be called', done => {
    compensation
      .add('compensationId3', { method: 'POST', uri: `${appUrl}/test` })
      .then(res => {
        compensation
          .run('compensationId3')
          .then(res => done())
          .catch(err => done(err));
      });
  });
});

after('Clear up database', (done) => clearUpDatabase(done));
