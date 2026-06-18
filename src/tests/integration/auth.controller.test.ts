import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prismaMock from '../prisma-mock';
import createApp from './test-app';

jest.mock('bcryptjs', () => ({
  ...jest.requireActual('bcryptjs'),
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

const app = createApp();

const jwtSecret = process.env.JWT_SECRET || 'superSecret';

const generateToken = (id: number) =>
  jwt.sign({ user: { id } }, jwtSecret, { algorithm: 'HS256' });

describe('Auth Controller', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/users', () => {
    test('should register a new user successfully', async () => {
      // Given
      const newUser = { username: 'testuser', email: 'test@example.com', password: 'password123' };
      const mockedUser = { id: 1, username: 'testuser', email: 'test@example.com', bio: null, image: null };

      // @ts-expect-error Prisma circular type
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockedUser as any);

      // When
      const response = await request(app).post('/api/users').send({ user: newUser });

      // Then
      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.username).toBe('testuser');
    });

    test('should return 422 when email is blank', async () => {
      // Given
      const newUser = { username: 'testuser', email: '', password: 'password123' };

      // When
      const response = await request(app).post('/api/users').send({ user: newUser });

      // Then
      expect(response.status).toBe(422);
      expect(response.body.errors.email).toContain("can't be blank");
    });

    test('should return 422 when username is blank', async () => {
      // Given
      const newUser = { username: '', email: 'test@example.com', password: 'password123' };

      // When
      const response = await request(app).post('/api/users').send({ user: newUser });

      // Then
      expect(response.status).toBe(422);
      expect(response.body.errors.username).toContain("can't be blank");
    });

    test('should return 422 when password is blank', async () => {
      // Given
      const newUser = { username: 'testuser', email: 'test@example.com', password: '' };

      // When
      const response = await request(app).post('/api/users').send({ user: newUser });

      // Then
      expect(response.status).toBe(422);
      expect(response.body.errors.password).toContain("can't be blank");
    });

    test('should return 422 when email is already taken', async () => {
      // Given
      const newUser = { username: 'testuser', email: 'test@example.com', password: 'password123' };

      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 1 } as any)
        .mockResolvedValueOnce(null);

      // When
      const response = await request(app).post('/api/users').send({ user: newUser });

      // Then
      expect(response.status).toBe(422);
      expect(response.body.errors.email).toContain('has already been taken');
    });
  });

  describe('POST /api/users/login', () => {
    test('should login successfully with valid credentials', async () => {
      // Given
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockedUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        bio: null,
        image: null,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockedUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // When
      const response = await request(app).post('/api/users/login').send({ user: credentials });

      // Then
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.username).toBe('testuser');
    });

    test('should return 403 with invalid password', async () => {
      // Given
      const credentials = { email: 'test@example.com', password: 'wrongpassword' };
      const mockedUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        bio: null,
        image: null,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockedUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // When
      const response = await request(app).post('/api/users/login').send({ user: credentials });

      // Then
      expect(response.status).toBe(403);
      expect(response.body.errors['email or password']).toContain('is invalid');
    });

    test('should return 403 when user is not found', async () => {
      // Given
      const credentials = { email: 'nonexistent@example.com', password: 'password123' };

      prismaMock.user.findUnique.mockResolvedValue(null);

      // When
      const response = await request(app).post('/api/users/login').send({ user: credentials });

      // Then
      expect(response.status).toBe(403);
      expect(response.body.errors['email or password']).toContain('is invalid');
    });

    test('should return 422 when email is blank', async () => {
      // Given
      const credentials = { email: '', password: 'password123' };

      // When
      const response = await request(app).post('/api/users/login').send({ user: credentials });

      // Then
      expect(response.status).toBe(422);
      expect(response.body.errors.email).toContain("can't be blank");
    });

    test('should return 422 when password is blank', async () => {
      // Given
      const credentials = { email: 'test@example.com', password: '' };

      // When
      const response = await request(app).post('/api/users/login').send({ user: credentials });

      // Then
      expect(response.status).toBe(422);
      expect(response.body.errors.password).toContain("can't be blank");
    });
  });

  describe('GET /api/user', () => {
    test('should return current user when authenticated', async () => {
      // Given
      const token = generateToken(1);
      const mockedUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        bio: 'A bio',
        image: 'https://example.com/image.jpg',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockedUser as any);

      // When
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${token}`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.bio).toBe('A bio');
      expect(response.body.user.image).toBe('https://example.com/image.jpg');
    });

    test('should return 401 when not authenticated', async () => {
      // When
      const response = await request(app).get('/api/user');

      // Then
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('missing authorization credentials');
    });
  });

  describe('PUT /api/user', () => {
    test('should update user when authenticated', async () => {
      // Given
      const token = generateToken(1);
      const updateData = { username: 'updateduser', email: 'updated@example.com', bio: 'Updated bio' };
      const mockedUser = {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com',
        bio: 'Updated bio',
        image: null,
      };

      prismaMock.user.update.mockResolvedValue(mockedUser as any);

      // When
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({ user: updateData });

      // Then
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('token');
      expect(response.body.user.username).toBe('updateduser');
      expect(response.body.user.email).toBe('updated@example.com');
      expect(response.body.user.bio).toBe('Updated bio');
    });

    test('should return 401 when not authenticated', async () => {
      // Given
      const updateData = { username: 'updateduser' };

      // When
      const response = await request(app)
        .put('/api/user')
        .send({ user: updateData });

      // Then
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('missing authorization credentials');
    });
  });
});
