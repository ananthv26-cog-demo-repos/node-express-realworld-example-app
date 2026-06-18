import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import prismaMock from '../prisma-mock';
import createApp from './test-app';

const app = createApp();

const jwtSecret = process.env.JWT_SECRET || 'superSecret';

const generateToken = (id: number) =>
  jwt.sign({ user: { id } }, jwtSecret, { algorithm: 'HS256' });

const mockProfileUser = {
  id: 2,
  username: 'profileuser',
  email: 'profile@test.com',
  password: 'hashed',
  bio: 'A bio',
  image: 'https://example.com/img.jpg',
  demo: false,
  followedBy: [{ id: 1 }],
};

describe('Profile Controller', () => {
  describe('GET /api/profiles/:username', () => {
    test('should return a profile without auth', async () => {
      // @ts-expect-error Prisma circular type
      prismaMock.user.findUnique.mockResolvedValue(mockProfileUser as any);

      const response = await request(app).get('/api/profiles/profileuser');

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'profileuser',
        bio: 'A bio',
        image: 'https://example.com/img.jpg',
        following: false,
      });
    });

    test('should return 404 when user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/profiles/nonexistent');

      expect(response.status).toBe(404);
    });

    test('should return following true when authenticated user follows the profile', async () => {
      const token = generateToken(1);

      prismaMock.user.findUnique.mockResolvedValue(mockProfileUser as any);

      const response = await request(app)
        .get('/api/profiles/profileuser')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'profileuser',
        bio: 'A bio',
        image: 'https://example.com/img.jpg',
        following: true,
      });
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    test('should follow a user when authenticated', async () => {
      const token = generateToken(1);

      prismaMock.user.update.mockResolvedValue(mockProfileUser as any);

      const response = await request(app)
        .post('/api/profiles/profileuser/follow')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'profileuser',
        bio: 'A bio',
        image: 'https://example.com/img.jpg',
        following: true,
      });
    });

    test('should return 401 when not authenticated', async () => {
      const response = await request(app).post('/api/profiles/profileuser/follow');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    test('should unfollow a user when authenticated', async () => {
      const token = generateToken(1);

      const unfollowedUser = {
        ...mockProfileUser,
        followedBy: [],
      };

      prismaMock.user.update.mockResolvedValue(unfollowedUser as any);

      const response = await request(app)
        .delete('/api/profiles/profileuser/follow')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'profileuser',
        bio: 'A bio',
        image: 'https://example.com/img.jpg',
        following: false,
      });
    });

    test('should return 401 when not authenticated', async () => {
      const response = await request(app).delete('/api/profiles/profileuser/follow');

      expect(response.status).toBe(401);
    });
  });
});
