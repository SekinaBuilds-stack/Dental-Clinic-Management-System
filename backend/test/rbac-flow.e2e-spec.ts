import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from './../src/app.module';

// The whole sign-up -> approval -> role -> access story, with the REAL guards and database.
describe('Sign-up, approval and role-based access (FR-CORE-001/002/003)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  const stamp = Date.now();
  const email = `cashier.${stamp}@clinic.test`;
  const password = 'Sup3rSecret!';
  let adminToken: string;
  let userId: string;
  let userToken: string;

  const api = (p: string) => `/api/v1${p}`;
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    const mod: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
    http = request(app.getHttpServer());

    const res = await http.post(api('/auth/login')).send({ email: 'admin@dcms.com', password: 'Password123!' });
    expect(res.status).toBe(200);
    adminToken = res.body.accessToken;
  });
  afterAll(async () => {
    await app.close();
  });

  it('the seeded administrator carries every permission', async () => {
    const me = await http.get(api('/auth/me')).set(auth(adminToken));
    expect(me.status).toBe(200);
    expect(me.body.role).toBe('Clinic Manager / Admin');
    expect(me.body.permissions).toContain('admin:users');
  });

  it('lets anyone sign up, but the account starts pending', async () => {
    const res = await http.post(api('/auth/register')).send({ fullName: 'Test Cashier', email, password });
    expect(res.status).toBe(201);
    const dup = await http.post(api('/auth/register')).send({ fullName: 'Test Cashier', email, password });
    expect(dup.status).toBe(409);
    const weak = await http.post(api('/auth/register')).send({ fullName: 'X Y', email: `w${stamp}@c.test`, password: '123' });
    expect(weak.status).toBe(400);
  });

  it('a pending user cannot sign in', async () => {
    const res = await http.post(api('/auth/login')).send({ email, password });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/waiting for approval/);
  });

  it('a wrong password is a 401', async () => {
    const res = await http.post(api('/auth/login')).send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('only an administrator can see or approve users', async () => {
    expect((await http.get(api('/users'))).status).toBe(401);
    const list = await http.get(api('/users?status=PENDING')).set(auth(adminToken));
    expect(list.status).toBe(200);
    const found = list.body.find((u: any) => u.email === email);
    expect(found).toBeDefined();
    expect(found.passwordHash).toBeUndefined();
    userId = found.id;
  });

  it('rejects an unknown role', async () => {
    const res = await http.patch(api(`/users/${userId}/approve`)).set(auth(adminToken)).send({ role: 'Wizard' });
    expect(res.status).toBe(400);
  });

  it('approving assigns the role and lets the user sign in', async () => {
    const approve = await http.patch(api(`/users/${userId}/approve`)).set(auth(adminToken)).send({ role: 'Cashier / Billing Officer' });
    expect(approve.status).toBe(200);
    expect(approve.body).toMatchObject({ status: 'ACTIVE', role: 'Cashier / Billing Officer' });

    const login = await http.post(api('/auth/login')).send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.user.permissions).toContain('payments:write');
    userToken = login.body.accessToken;
  });

  it('the cashier can reach payments but not user management, clinical records or the audit log', async () => {
    expect((await http.get(api('/payments/ledger')).set(auth(userToken))).status).toBe(200);
    expect((await http.get(api('/users')).set(auth(userToken))).status).toBe(403);
    expect((await http.get(api('/emr/clinical-notes/some-patient')).set(auth(userToken))).status).toBe(403);
    expect((await http.get(api('/audit-logs')).set(auth(userToken))).status).toBe(403);
  });

  it('changing the role takes effect immediately on the SAME token', async () => {
    const res = await http.patch(api(`/users/${userId}/role`)).set(auth(adminToken)).send({ role: 'Lab Coordinator' });
    expect(res.status).toBe(200);
    expect((await http.get(api('/payments/ledger')).set(auth(userToken))).status).toBe(403);
    expect((await http.get(api('/auth/me')).set(auth(userToken))).body.role).toBe('Lab Coordinator');
  });

  it('deactivating blocks the token and the login', async () => {
    const res = await http.patch(api(`/users/${userId}/status`)).set(auth(adminToken)).send({ status: 'DEACTIVATED' });
    expect(res.status).toBe(200);
    expect((await http.get(api('/auth/me')).set(auth(userToken))).status).toBe(401);
    expect((await http.post(api('/auth/login')).send({ email, password })).status).toBe(403);
  });

  it('the administrator cannot deactivate themselves', async () => {
    const me = await http.get(api('/auth/me')).set(auth(adminToken));
    const res = await http.patch(api(`/users/${me.body.userId}/status`)).set(auth(adminToken)).send({ status: 'DEACTIVATED' });
    expect(res.status).toBe(400);
  });

  it('an old-style token with a numeric id is rejected, not a 500', async () => {
    const old = app.get(JwtService).sign({ sub: 1, email: 'admin@dcms.com' });
    expect((await http.get(api('/auth/me')).set(auth(old))).status).toBe(401);
  });
});
