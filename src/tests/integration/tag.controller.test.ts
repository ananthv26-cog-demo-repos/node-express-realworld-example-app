import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import prismaMock from '../prisma-mock';
import createApp from './test-app';

const app = createApp();

const JWT_SECRET = process.env.JWT_SECRET || 'superSecret';

const generateToken = (userId: number = 1) =>
  jwt.sign({ user: { id: userId } }, JWT_SECRET, { algorithm: 'HS256' });

describe('Tag Controller', () => {
  describe('GET /api/tags', () => {
    test('should return a list of tags', async () => {
      // @ts-expect-error Prisma circular type
      prismaMock.tag.findMany.mockResolvedValue([
        { id: 1, name: 'javascript' },
        { id: 2, name: 'typescript' },
        { id: 3, name: 'nodejs' },
      ]);

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        tags: ['javascript', 'typescript', 'nodejs'],
      });
      expect(prismaMock.tag.findMany).toHaveBeenCalledTimes(1);
    });

    test('should return an empty list when no tags exist', async () => {
      prismaMock.tag.findMany.mockResolvedValue([] as any);

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ tags: [] });
    });

    test('should return tags when authenticated', async () => {
      const token = generateToken(1);

      prismaMock.tag.findMany.mockResolvedValue([
        { id: 4, name: 'react' },
        { id: 5, name: 'vue' },
      ]);

      const response = await request(app)
        .get('/api/tags')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        tags: ['react', 'vue'],
      });
      expect(prismaMock.tag.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/tags/:tag', () => {
    test('should return a tag with articles count when found', async () => {
      prismaMock.tag.findFirst.mockResolvedValue({ id: 1, name: 'javascript' });
      // @ts-expect-error Prisma circular type
      prismaMock.article.count.mockResolvedValue(5);

      const response = await request(app).get('/api/tags/javascript');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        tag: { name: 'javascript', articlesCount: 5 },
      });
      expect(prismaMock.tag.findFirst).toHaveBeenCalledTimes(1);
      expect(prismaMock.article.count).toHaveBeenCalledTimes(1);
    });

    test('should return 404 when tag is not found', async () => {
      prismaMock.tag.findFirst.mockResolvedValue(null as any);

      const response = await request(app).get('/api/tags/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        errors: { tag: ['not found'] },
      });
    });

    test('should return a tag with articles count when authenticated', async () => {
      const token = generateToken(1);

      prismaMock.tag.findFirst.mockResolvedValue({ id: 2, name: 'typescript' });
      prismaMock.article.count.mockResolvedValue(3);

      const response = await request(app)
        .get('/api/tags/typescript')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        tag: { name: 'typescript', articlesCount: 3 },
      });
    });
  });
});
