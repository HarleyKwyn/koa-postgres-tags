// Dependencies
var expect = require('chai').expect;
var app = require('./../index');
var request = require('supertest').agent(app.listen());
var config = require('./../config.js')
var knex = require('knex')(config.database);
var seedDatabase = require('./../seeds/knex-test.seed.js').seed;
var _ = require('lodash');
var Promise = require('bluebird');

describe('/emails', function (){
  beforeEach(function(done){
    seedDatabase()
      .then(function(result){
        done();
      })
      .catch(function(err){
        console.error(err);
      })
  });


  describe('GET', function (){

    describe('with valid e-mail that has tags', function (){
      it('should return body with e-mail string and tags array',function (done){
        request.get('/emails/tagged@test.com')
          .expect(200)
          .end(function(error, res){
            expect(typeof res.body.email).to.equal('string');
            done();
          })
      });
      it('should return body with tags array with appropriate keys',function (done){
        request.get('/emails/tagged@test.com')
          .expect(200)
          .end(function(error, res){
            expect(Array.isArray(res.body.tags)).to.be.true;
            expect(res.body.tags).to.include('tag1');
            expect(res.body.tags).to.include('tag1');
            done();
          });
      });
    });

    describe('with valid e-mail that does not have tags', function (){
      it('should return body with e-mail string',function (done){
        request.get('/emails/untagged@test.com')
          .expect(200)
          .end(function(error, res){
            expect(typeof res.body.email).to.equal('string');
            done();
          })
      });
      it('should return body with and empty tags array',function (done){
        request.get('/emails/untagged@test.com')
          .expect(200)
          .end(function(error, res){
            expect(Array.isArray(res.body.tags)).to.be.true;
            expect(res.body.tags.length).to.equal(0);
            done();
          });
      });
    });

    describe('with invalid e-mail', function (){
      it('should return an 400 error with message', function (done) {
        request.get('/emails/arglbargl')
          .expect(400)
          .end(done);
      });
    });
  });


  describe('POST', function(){
    beforeEach(function(done){
      seedDatabase()
        .then(function(result){
          done();
        })
        .catch(function(err){
          console.error(err);
          throw err;
        })
    });

    describe('with valid e-mail and tags', function (){
      it('should return a 201', function (done){
        request
          .post('/emails')
          .send({
            email: 'test1@user.com'
          , tags: ['test1', 'test2']
          })
          .expect(201)
          .end(done);
      });
      it('should create record on email table', function (done){
        request
          .post('/emails')
          .send({
            email: 'test1@user.com',
            tags: ['test1', 'test2']
          })
          .end(function(err, res){
            knex('emails')
              .first('email')
              .where('email', 'test1@user.com')
              .then(function(result){
                expect(result.email).to.exist;
                done();
              })
              .catch(function(err){
                console.error('email table error', err);
                done();
              });
          })
      });
      it('should create records on tag table', function (done){
        request
          .post('/emails')
          .send({
            email: 'test1@user.com',
            tags: ['test1', 'test2']
          })
          .end(function(err, res){
            knex('tags')
              .select('tag_name')
              .whereIn('tag_name', ['test1', 'test2'])
              .then(function(results){
                var tags = _.pluck(results, 'tag_name');
                expect(tags).to.include.members(['test1', 'test2']);
                done();
              })
              .catch(function(err){
                console.error('tag table', err)
                expect(err).to.not.exist;
                done();
              });
          });
      });
      it('should create records on tag_map table', function (done){
        request
          .post('/emails')
          .send({
            email: 'test1@user.com',
            tags: ['test1', 'test2']
          })
          .end(function(err, res){
            var tag_ids, email_id;
            Promise.join(
                knex
                  .where('email', 'test1@user.com')
                  .select('email_id')
                  .from('emails')
              , knex
                  .whereIn('tag_name', ['test1', 'test2'])
                  .select('tag_id')
                  .from('tags')
              )
              .then(function(results){
                email_id = _.pluck(results[0], 'email_id');
                tag_ids = _.pluck(results[1], 'tag_id');
                expect(email_id.length).to.equal(1);
                email_id = email_id[0];
                return knex
                  .where('email_id', email_id)
                  .select('tag_id')
                  .from('tag_map')
                  .then(function(results){
                    var ids = _.pluck(results, 'tag_id');
                    console.log('results', results, ids)
                    expect(ids).to.include.members(tag_ids);
                    done();
                  })
              })
              .catch(function(err){
                console.error('tag_map table', err)
                expect(err).to.not.exist;
                done();
              });
          });
      });
    });

    describe('with email that exists already', function(){
      it('should return a 201', function (done){
        request
          .post('/emails')
          .send({
            email: 'tagged@user.com',
            tags: ['test1', 'test2']
          })
          .expect(201)
          .end(done)
      })
    })
    xdescribe('with valid e-mail and multiple tags', function(){
      it('should return a 201', function (done){

      });
      it('should create record on tag table', function (done){

      });
      it('should create record on join table', function (done){

      });
    })
    xdescribe('with invalid e-mail', function (){
      it('should return an error with message', function (done) {
        request.get('/')
          .expect(501)
          .end(done);
      });
    });
    xdescribe('with existing email address', function (){
      it('should return with resource updated status code', function (done){

      });
    });
  });

  xdescribe('DELETE', function(){
    describe('with valid e-mail', function(){
      it('should remove e-mail record from e-mail table', function(){

      });
      it('should remove records in join table.', function(){

      });
      it('should remove records in join table.', function(){

      });
    });
    describe('with invalid e-mail', function(){
      it('should return an error with message', function (done){

      });
    });
    describe('with non-existent e-mail', function(){
      it('should return an error with message', function (done){

      });
    });
  });

});
