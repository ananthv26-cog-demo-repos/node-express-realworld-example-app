import prismaMock from '../prisma-mock';
import {
  getArticles,
  getFeed,
  createArticle,
  getArticle,
  updateArticle,
  deleteArticle,
  getCommentsByArticle,
  addComment,
} from '../../app/routes/article/article.service';

const mockArticle = {
  id: 1,
  slug: 'test-article-1',
  title: 'Test Article',
  description: 'desc',
  body: 'body',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  authorId: 1,
  tagList: [{ name: 'test' }],
  author: { username: 'testuser', bio: null, image: null, followedBy: [] },
  favoritedBy: [],
  _count: { favoritedBy: 0 },
};

describe('ArticleService', () => {
  describe('getArticles', () => {
    test('should return articles with empty query', async () => {
      // Given
      // @ts-expect-error Prisma circular type
      prismaMock.article.count.mockResolvedValue(1);
      prismaMock.article.findMany.mockResolvedValue([mockArticle]);

      // When
      const result = await getArticles({});

      // Then
      expect(result.articlesCount).toBe(1);
      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].slug).toBe('test-article-1');
      expect(result.articles[0].title).toBe('Test Article');
      expect(result.articles[0].tagList).toEqual(['test']);
    });

    test('should filter articles by tag', async () => {
      // Given
      prismaMock.article.count.mockResolvedValue(1);
      prismaMock.article.findMany.mockResolvedValue([mockArticle]);

      // When
      const result = await getArticles({ tag: 'test' });

      // Then
      expect(result.articlesCount).toBe(1);
      expect(result.articles).toHaveLength(1);
    });

    test('should filter articles by author', async () => {
      // Given
      prismaMock.article.count.mockResolvedValue(1);
      prismaMock.article.findMany.mockResolvedValue([mockArticle]);

      // When
      const result = await getArticles({ author: 'testuser' });

      // Then
      expect(result.articlesCount).toBe(1);
      expect(result.articles).toHaveLength(1);
    });

    test('should filter articles by favorited', async () => {
      // Given
      prismaMock.article.count.mockResolvedValue(1);
      prismaMock.article.findMany.mockResolvedValue([mockArticle]);

      // When
      const result = await getArticles({ favorited: 'testuser' });

      // Then
      expect(result.articlesCount).toBe(1);
      expect(result.articles).toHaveLength(1);
    });
  });

  describe('getFeed', () => {
    test('should return feed articles for a user', async () => {
      // Given
      prismaMock.article.count.mockResolvedValue(1);
      prismaMock.article.findMany.mockResolvedValue([mockArticle]);

      // When
      const result = await getFeed(0, 10, 1);

      // Then
      expect(result.articlesCount).toBe(1);
      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].slug).toBe('test-article-1');
    });
  });

  describe('createArticle', () => {
    test('should create an article successfully', async () => {
      // Given
      const articleInput = {
        title: 'Test Article',
        description: 'desc',
        body: 'body',
        tagList: ['test'],
      };
      prismaMock.article.findUnique.mockResolvedValue(null);
      prismaMock.article.create.mockResolvedValue(mockArticle);

      // When
      const result = await createArticle(articleInput, 1);

      // Then
      expect(result.slug).toBe('test-article-1');
      expect(result.title).toBe('Test Article');
      expect(result.tagList).toEqual(['test']);
    });

    test('should throw 422 if title is missing', async () => {
      // Given
      const articleInput = { title: '', description: 'desc', body: 'body' };

      // When / Then
      await expect(createArticle(articleInput, 1)).rejects.toThrowError();
    });

    test('should throw 422 if description is missing', async () => {
      // Given
      const articleInput = { title: 'Test', description: '', body: 'body' };

      // When / Then
      await expect(createArticle(articleInput, 1)).rejects.toThrowError();
    });

    test('should throw 422 if body is missing', async () => {
      // Given
      const articleInput = { title: 'Test', description: 'desc', body: '' };

      // When / Then
      await expect(createArticle(articleInput, 1)).rejects.toThrowError();
    });

    test('should throw 422 if slug already exists', async () => {
      // Given
      const articleInput = {
        title: 'Test Article',
        description: 'desc',
        body: 'body',
        tagList: ['test'],
      };
      prismaMock.article.findUnique.mockResolvedValue({ slug: 'Test-Article-1' } as any);

      // When / Then
      await expect(createArticle(articleInput, 1)).rejects.toThrowError();
    });
  });

  describe('getArticle', () => {
    test('should return an article by slug', async () => {
      // Given
      prismaMock.article.findUnique.mockResolvedValue(mockArticle);

      // When
      const result = await getArticle('test-article-1', 1);

      // Then
      expect(result.slug).toBe('test-article-1');
      expect(result.title).toBe('Test Article');
    });

    test('should throw 404 if article not found', async () => {
      // Given
      prismaMock.article.findUnique.mockResolvedValue(null);

      // When / Then
      await expect(getArticle('non-existent')).rejects.toThrowError();
    });
  });

  describe('updateArticle', () => {
    test('should update an article successfully', async () => {
      // Given
      const updateData = { title: 'Updated Title', body: 'Updated body' };
      prismaMock.article.findFirst.mockResolvedValueOnce({
        author: { id: 1, username: 'testuser' },
      } as any);
      prismaMock.article.findFirst.mockResolvedValueOnce(null);
      prismaMock.article.update.mockResolvedValueOnce({} as any);
      prismaMock.article.update.mockResolvedValueOnce({
        ...mockArticle,
        title: 'Updated Title',
        body: 'Updated body',
        slug: 'Updated-Title-1',
      } as any);

      // When
      const result = await updateArticle(updateData, 'test-article-1', 1);

      // Then
      expect(result.title).toBe('Updated Title');
      expect(result.body).toBe('Updated body');
    });

    test('should throw 404 if article not found', async () => {
      // Given
      prismaMock.article.findFirst.mockResolvedValue(null);

      // When / Then
      await expect(
        updateArticle({ title: 'New' }, 'non-existent', 1),
      ).rejects.toThrowError();
    });

    test('should throw 403 if user is not the author', async () => {
      // Given
      prismaMock.article.findFirst.mockResolvedValue({
        author: { id: 2, username: 'otheruser' },
      } as any);

      // When / Then
      await expect(
        updateArticle({ title: 'New' }, 'test-article-1', 1),
      ).rejects.toThrowError();
    });

    test('should throw 422 if new title slug already exists', async () => {
      // Given
      prismaMock.article.findFirst.mockResolvedValueOnce({
        author: { id: 1, username: 'testuser' },
      } as any);
      prismaMock.article.findFirst.mockResolvedValueOnce({ slug: 'Duplicate-Title-1' } as any);

      // When / Then
      await expect(
        updateArticle({ title: 'Duplicate Title' }, 'test-article-1', 1),
      ).rejects.toThrowError();
    });
  });

  describe('deleteArticle', () => {
    test('should delete an article successfully', async () => {
      // Given
      prismaMock.article.findFirst.mockResolvedValue({
        author: { id: 1, username: 'testuser' },
      } as any);
      prismaMock.article.delete.mockResolvedValue({} as any);

      // When / Then
      await expect(deleteArticle('test-article-1', 1)).resolves.not.toThrow();
    });

    test('should throw 404 if article not found', async () => {
      // Given
      prismaMock.article.findFirst.mockResolvedValue(null);

      // When / Then
      await expect(deleteArticle('non-existent', 1)).rejects.toThrowError();
    });

    test('should throw 403 if user is not the author', async () => {
      // Given
      prismaMock.article.findFirst.mockResolvedValue({
        author: { id: 2, username: 'otheruser' },
      } as any);

      // When / Then
      await expect(deleteArticle('test-article-1', 1)).rejects.toThrowError();
    });
  });

  describe('getCommentsByArticle', () => {
    test('should return comments for an article', async () => {
      // Given
      prismaMock.article.findUnique.mockResolvedValue({
        comments: [
          {
            id: 1,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            body: 'Great article!',
            author: { username: 'commenter', bio: null, image: null, followedBy: [] },
          },
        ],
      } as any);

      // When
      const result = await getCommentsByArticle('test-article-1');

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].body).toBe('Great article!');
      expect(result![0].author.username).toBe('commenter');
      expect(result![0].author.following).toBe(false);
    });

    test('should return comments with following status when user id provided', async () => {
      // Given
      prismaMock.article.findUnique.mockResolvedValue({
        comments: [
          {
            id: 1,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            body: 'Great article!',
            author: { username: 'commenter', bio: null, image: null, followedBy: [{ id: 1 }] },
          },
        ],
      } as any);

      // When
      const result = await getCommentsByArticle('test-article-1', 1);

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].author.following).toBe(true);
    });
  });

  describe('addComment', () => {
    test('should add a comment successfully', async () => {
      // Given
      prismaMock.article.findUnique.mockResolvedValue({ id: 1 } as any);
      // @ts-expect-error Prisma circular type
      prismaMock.comment.create.mockResolvedValue({
        id: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        body: 'Nice post!',
        author: { username: 'testuser', bio: null, image: null, followedBy: [] },
      } as any);

      // When
      const result = await addComment('Nice post!', 'test-article-1', 1);

      // Then
      expect(result.body).toBe('Nice post!');
      expect(result.author.username).toBe('testuser');
      expect(result.author.following).toBe(false);
    });

    test('should throw 422 if body is empty', async () => {
      // Given / When / Then
      await expect(addComment('', 'test-article-1', 1)).rejects.toThrowError();
    });
  });
});
