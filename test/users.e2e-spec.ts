import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Verification } from 'src/users/entities/verification.entity';

const GRAPHQL_ENDPOINT = '/graphql';
const testUser = {
  email: 'e2etest@test.com',
  password: '12345',
};

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;
  let jwtToken: string;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest()
      .set('x-jwt', jwtToken)
      .send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  });

  describe('createAccount', () => {
    it('should create account', () => {
      return publicTest(`
          mutation{
            createAccount(input:{
              email:"${testUser.email}",
              password:"${testUser.password}",
              role:client
            }
            )
            {ok
            error}
          }
        `)
        .expect(200)
        .expect(res => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });
    it(`should fail if account already exists`, () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation{
            createAccount(input:{
              email:"${testUser.email}",
              password:"${testUser.password}",
              role:client
            }
            )
            {ok
            error}
          }
        `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data.createAccount.ok).toBe(false);
          expect(res.body.data.createAccount.error).toEqual(
            `There is a user with that email ${testUser.email} already`,
          );
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            mutation{
              login(input:{
                email:"${testUser.email}",
                password:"${testUser.password}"
              })
            {
              ok
              error
              token
            }
          }
        `,
        })
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;

          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });
    it('should not be able to login with wrong email', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            mutation{
              login(input:{
                email:"wrong@email.com",
                password:"${testUser.password}",
              })
            {
              ok
              error
              token
            }
          }
        `,
        })
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;

          expect(login.ok).toBe(false);
          expect(login.error).toEqual(`User  not found`);
          expect(login.token).toBe(null);
        });
    });
    it('should not be able to login with wrong password', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            mutation{
              login(input:{
                email:"${testUser.email}",
                password:"wrongPassword",
              })
            {
              ok
              error
              token
            }
          }
        `,
        })
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;

          expect(login.ok).toBe(false);
          expect(login.error).toEqual('wrong password');
          expect(login.token).toBe(null);
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });
    it('should see users profile', () => {
      return privateTest(`
          {
            userProfile(userId:${userId}) {
              ok
              error
              user {
                id
              }
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                userProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;

          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });
    it('should not find a profile', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('x-jwt', jwtToken)
        .send({
          query: `
          {
            userProfile(userId:666) {
              ok
              error
              user {
                id
              }
            }
          }
        `,
        })
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toEqual('User not Found');
          expect(user).toBe(null);
        });
    });
  });

  describe('me', () => {
    it('should find my profile', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('x-jwt', jwtToken)
        .send({
          query: `
          {
            me {
              email
            }
          }
          `,
        })
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(testUser.email);
        });
    });
    it('should not allow logged out user', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          {
            me {
              email
            }
          }
          `,
        })
        .expect(200)
        .expect(res => {
          const {
            body: { errors },
          } = res;
          const [error] = errors;
          expect(error.message).toBe('Forbidden resource');
        });
    });
  });

  describe('editProfile', () => {
    it('should change email', () => {
      const NEW_EMAIL = 'changed@changed.com';
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('x-jwt', jwtToken)
        .send({
          query: `
          mutation {
            editProfile(input: { 
              email: "${NEW_EMAIL}" 
            }) {
              ok
              error
            }
          }
          `,
        })
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        })
        .then(() => {
          return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .set('x-jwt', jwtToken)
            .send({
              query: `
          {
            me {
              email
            }
          }
          `,
            })
            .expect(200)
            .expect(res => {
              const {
                body: {
                  data: {
                    me: { email },
                  },
                },
              } = res;
              expect(email).toBe(NEW_EMAIL);
            });
        });
    });
    it('should change password', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('x-jwt', jwtToken)
        .send({
          query: `
          mutation {
            editProfile(input: { 
              password: "changepassword" 
            }) {
              ok
              error
            }
          }
          `,
        })
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
  });

  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationRepository.find();
      verificationCode = verification.code;
    });
    it('should verify email', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
        mutation {
          verifyEmail(input: { code: "${verificationCode}" }) {
            ok
            error
          }
        }
        
        `,
        })
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
    it('should fail on wrong verification code', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
        mutation {
          verifyEmail(input: { code: "wrongVerificaton" }) {
            ok
            error
          }
        }
        
        `,
        })
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toEqual('Verification not found.');
        });
    });
  });
});
