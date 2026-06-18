import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import prismaMock from '../prisma-mock';
import createApp from './test-app';

const app = createApp();
const jwtSecret = process.env.JWT_SECRET || 'superSecret';
const token = jwt.sign({ user: { id: 1 } }, jwtSecret, { algorithm: 'HS256' });

const mockedArticle = {
  id: 1,
  slug: 'test-article-1',
  title: 'Test Article',
  description: 'Test desc',
  body: 'Test body',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  authorId: 1,
  tagList: [{ name: 'test' }],
  author: { username: 'testuser', bio: null, image: null, followedBy: [] },
  favoritedBy: [],
  _count: { favoritedBy: 0 },
};

const expectedArticle = {
  slug: 'test-article-1',
  title: 'Test Article',
  description: 'Test desc',
  body: 'Test body',
  tagList: ['test'],
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
  favorited: false,
  favoritesCount: 0,
  author: {
    username: 'testuser',
    bio: null,
    image: null,
    following: false,
  },
};

describe('Article Controller', () => {
  // 1. GET /api/articles
  describe('GET /api/articles', () => {
    test('should return a list of articles', async () => {
      // @ts-expect-error Prisma circular type
      prismaMock.article.count.mockResolvedValue(1);
      prismaMock.article.findMany.mockResolvedValue([mockedArticle] as any);

      const res = await request(app).get('/api/articles');

      expect(res.status).toBe(200);
      expect(res.body.articles).toHaveLength(1);
      expect(res.body.articlesCount).toBe(1);
      expect(res.body.articles[0]).toEqual(expectedArticle);
    });

    test('should return empty list when no articles', async () => {
      prismaMock.article.count.mockResolvedValue(0);
      prismaMock.article.findMany.mockResolvedValue([] as any);

      const res = await request(app).get('/api/articles');

      expect(res.status).toBe(200);
      expect(res.body.articles).toHaveLength(0);
      expect(res.body.articlesCount).toBe(0);
    });
  });

  // 2. GET /api/articles/feed
  describe('GET /api/articles/feed', () => {
    test('should return feed articles when authenticated', async () => {
      prismaMock.article.count.mockResolvedValue(1);
      prismaMock.article.findMany.mockResolvedValue([mockedArticle] as any);

      const res = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.articles).toHaveLength(1);
      expect(res.body.articlesCount).toBe(1);
    });

    test('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/articles/feed');

      expect(res.status).toBe(401);
    });
  });

  // 3. POST /api/articles
  describe('POST /api/articles', () => {
    test('should create an article successfully', async () => {
      prismaMock.article.findUnique.mockResolvedValue(null as any);
      prismaMock.article.create.mockResolvedValue(mockedArticle as any);

      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Test Article',
            description: 'Test desc',
            body: 'Test body',
            tagList: ['test'],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.article).toEqual(expectedArticle);
    });

    test('should return 422 when title is missing', async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            description: 'Test desc',
            body: 'Test body',
          },
        });

      expect(res.status).toBe(422);
      expect(res.body.errors.title).toBeDefined();
    });

    test('should return 422 when description is missing', async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Test Article',
            body: 'Test body',
          },
        });

      expect(res.status).toBe(422);
      expect(res.body.errors.description).toBeDefined();
    });

    test('should return 422 when body is missing', async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Test Article',
            description: 'Test desc',
          },
        });

      expect(res.status).toBe(422);
      expect(res.body.errors.body).toBeDefined();
    });

    test('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/articles')
        .send({
          article: {
            title: 'Test Article',
            description: 'Test desc',
            body: 'Test body',
          },
        });

      expect(res.status).toBe(401);
    });
  });

  // 4. GET /api/articles/:slug
  describe('GET /api/articles/:slug', () => {
    test('should return an article when found', async () => {
      prismaMock.article.findUnique.mockResolvedValue(mockedArticle as any);

      const res = await request(app).get('/api/articles/test-article-1');

      expect(res.status).toBe(200);
      expect(res.body.article).toEqual(expectedArticle);
    });

    test('should return 404 when article not found', async () => {
      prismaMock.article.findUnique.mockResolvedValue(null as any);

      const res = await request(app).get('/api/articles/non-existent');

      expect(res.status).toBe(404);
    });
  });

  // 5. PUT /api/articles/:slug
  describe('PUT /api/articles/:slug', () => {
    test('should update an article successfully', async () => {
      prismaMock.article.findFirst.mockResolvedValueOnce({ author: { id: 1, username: 'testuser' } } as any).mockResolvedValueOnce(null as any);
      prismaMock.article.update.mockResolvedValueOnce({} as any).mockResolvedValueOnce(mockedArticle as any);

      const res = await request(app)
        .put('/api/articles/test-article-1')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Updated Title',
            description: 'Updated desc',
            body: 'Updated body',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.article).toBeDefined();
      expect(res.body.article.author).toBeDefined();
    });

    test('should return 404 when article not found', async () => {
      prismaMock.article.findFirst.mockResolvedValue(null as any);

      const res = await request(app)
        .put('/api/articles/non-existent')
        .set('Authorization', `Token ${token}`)
        .send({
          article: { title: 'Updated Title' },
        });

      expect(res.status).toBe(404);
    });

    test('should return 403 when user is not the author', async () => {
      prismaMock.article.findFirst.mockResolvedValue({ author: { id: 999, username: 'otheruser' } } as any);

      const res = await request(app)
        .put('/api/articles/test-article-1')
        .set('Authorization', `Token ${token}`)
        .send({
          article: { title: 'Updated Title' },
        });

      expect(res.status).toBe(403);
    });

    test('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .put('/api/articles/test-article-1')
        .send({
          article: { title: 'Updated Title' },
        });

      expect(res.status).toBe(401);
    });
  });

  // 6. DELETE /api/articles/:slug
  describe('DELETE /api/articles/:slug', () => {
    test('should delete an article successfully', async () => {
      prismaMock.article.findFirst.mockResolvedValue({ author: { id: 1, username: 'testuser' } } as any);
      prismaMock.article.delete.mockResolvedValue(mockedArticle as any);

      const res = await request(app)
        .delete('/api/articles/test-article-1')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(204);
    });

    test('should return 404 when article not found', async () => {
      prismaMock.article.findFirst.mockResolvedValue(null as any);

      const res = await request(app)
        .delete('/api/articles/non-existent')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(404);
    });

    test('should return 403 when user is not the author', async () => {
      prismaMock.article.findFirst.mockResolvedValue({ author: { id: 999, username: 'otheruser' } } as any);

      const res = await request(app)
        .delete('/api/articles/test-article-1')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(403);
    });

    test('should return 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/articles/test-article-1');

      expect(res.status).toBe(401);
    });
  });

  // 7. GET /api/articles/:slug/comments
  describe('GET /api/articles/:slug/comments', () => {
    test('should return comments for an article', async () => {
      prismaMock.article.findUnique.mockResolvedValue({
        comments: [
          {
            id: 1,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            body: 'Test comment',
            author: {
              username: 'testuser',
              bio: null,
              image: null,
              followedBy: [],
            },
          },
        ],
      } as any);

      const res = await request(app).get('/api/articles/test-article-1/comments');

      expect(res.status).toBe(200);
      expect(res.body.comments).toHaveLength(1);
      expect(res.body.comments[0].body).toBe('Test comment');
      expect(res.body.comments[0].author.username).toBe('testuser');
      expect(res.body.comments[0].author.following).toBe(false);
    });
  });

  // 8. POST /api/articles/:slug/comments
  describe('POST /api/articles/:slug/comments', () => {
    test('should add a comment to an article', async () => {
      prismaMock.article.findUnique.mockResolvedValue({ id: 1 } as any);
      // @ts-expect-error Prisma circular type
      prismaMock.comment.create.mockResolvedValue({
        id: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        body: 'Great article!',
        author: {
          username: 'testuser',
          bio: null,
          image: null,
          followedBy: [],
        },
      } as any);

      const res = await request(app)
        .post('/api/articles/test-article-1/comments')
        .set('Authorization', `Token ${token}`)
        .send({ comment: { body: 'Great article!' } });

      expect(res.status).toBe(200);
      expect(res.body.comment.body).toBe('Great article!');
      expect(res.body.comment.author.username).toBe('testuser');
      expect(res.body.comment.author.following).toBe(false);
    });

    test('should return 422 when comment body is missing', async () => {
      const res = await request(app)
        .post('/api/articles/test-article-1/comments')
        .set('Authorization', `Token ${token}`)
        .send({ comment: {} });

      expect(res.status).toBe(422);
    });

    test('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/articles/test-article-1/comments')
        .send({ comment: { body: 'Great article!' } });

      expect(res.status).toBe(401);
    });
  });

  // 9. DELETE /api/articles/:slug/comments/:id
  describe('DELETE /api/articles/:slug/comments/:id', () => {
    test('should delete a comment successfully', async () => {
      prismaMock.comment.findFirst.mockResolvedValue({ author: { id: 1, username: 'testuser' } } as any);
      prismaMock.comment.delete.mockResolvedValue({} as any);

      const res = await request(app)
        .delete('/api/articles/test-article-1/comments/1')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({});
    });

    test('should return 404 when comment not found', async () => {
      prismaMock.comment.findFirst.mockResolvedValue(null as any);

      const res = await request(app)
        .delete('/api/articles/test-article-1/comments/999')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(404);
    });

    test('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .delete('/api/articles/test-article-1/comments/1');

      expect(res.status).toBe(401);
    });
  });

  // 10. POST /api/articles/:slug/favorite
  describe('POST /api/articles/:slug/favorite', () => {
    test('should favorite an article', async () => {
      const favoritedArticle = {
        ...mockedArticle,
        favoritedBy: [{ id: 1 }],
        _count: { favoritedBy: 1 },
      };
      prismaMock.article.update.mockResolvedValue(favoritedArticle as any);

      const res = await request(app)
        .post('/api/articles/test-article-1/favorite')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.article.favorited).toBe(true);
      expect(res.body.article.favoritesCount).toBe(1);
      expect(res.body.article.slug).toBe('test-article-1');
    });

    test('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/articles/test-article-1/favorite');

      expect(res.status).toBe(401);
    });
  });

  // 11. DELETE /api/articles/:slug/favorite
  describe('DELETE /api/articles/:slug/favorite', () => {
    test('should unfavorite an article', async () => {
      const unfavoritedArticle = {
        ...mockedArticle,
        favoritedBy: [],
        _count: { favoritedBy: 0 },
      };
      prismaMock.article.update.mockResolvedValue(unfavoritedArticle as any);

      const res = await request(app)
        .delete('/api/articles/test-article-1/favorite')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.article.favorited).toBe(false);
      expect(res.body.article.favoritesCount).toBe(0);
      expect(res.body.article.slug).toBe('test-article-1');
    });

    test('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .delete('/api/articles/test-article-1/favorite');

      expect(res.status).toBe(401);
    });
  });
});
