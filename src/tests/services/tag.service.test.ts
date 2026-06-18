import prismaMock from '../prisma-mock';
import { getTags, getTagByName } from '../../app/routes/tag/tag.service';

describe('TagService', () => {
  describe('getTags', () => {
    test('should return a list of tag names', async () => {
      // Given
      const mockedResponse = [
        { name: 'reactjs' },
        { name: 'angularjs' },
        { name: 'dragons' },
      ];

      // When
      // @ts-expect-error findMany mock returns partial type
      prismaMock.tag.findMany.mockResolvedValue(mockedResponse);

      // Then
      const result = await getTags();
      expect(result).toEqual(['reactjs', 'angularjs', 'dragons']);
    });

    test('should return an empty list when no tags exist', async () => {
      // When
      prismaMock.tag.findMany.mockResolvedValue([]);

      // Then
      const result = await getTags();
      expect(result).toEqual([]);
    });

    test('should include user-specific tags when id is provided', async () => {
      // Given
      const mockedResponse = [{ name: 'reactjs' }, { name: 'personal' }];

      // When
      // @ts-expect-error findMany mock returns partial type
      prismaMock.tag.findMany.mockResolvedValue(mockedResponse);

      // Then
      const result = await getTags(123);
      expect(result).toEqual(['reactjs', 'personal']);
    });
  });

  describe('getTagByName', () => {
    test('should return the tag with articles count', async () => {
      // Given
      const mockedTagResponse = { name: 'reactjs' };

      // When
      // @ts-expect-error findFirst mock returns partial type
      prismaMock.tag.findFirst.mockResolvedValue(mockedTagResponse);
      // @ts-expect-error count mock has circular type refs
      prismaMock.article.count.mockResolvedValue(3);

      // Then
      const result = await getTagByName('reactjs');
      expect(result).toEqual({ name: 'reactjs', articlesCount: 3 });
    });

    test('should return zero articles count for a tag with no visible articles', async () => {
      // Given
      const mockedTagResponse = { name: 'emptytag' };

      // When
      // @ts-expect-error findFirst mock returns partial type
      prismaMock.tag.findFirst.mockResolvedValue(mockedTagResponse);
      prismaMock.article.count.mockResolvedValue(0);

      // Then
      const result = await getTagByName('emptytag');
      expect(result).toEqual({ name: 'emptytag', articlesCount: 0 });
    });

    test('should throw an error when the tag name is blank', async () => {
      // Then
      await expect(getTagByName('  ')).rejects.toThrowError();
    });

    test('should throw an error when the tag name is empty', async () => {
      // Then
      await expect(getTagByName('')).rejects.toThrowError();
    });

    test('should throw an error when the tag is not found', async () => {
      // When
      prismaMock.tag.findFirst.mockResolvedValue(null);

      // Then
      await expect(getTagByName('nonexistent')).rejects.toThrowError();
    });

    test('should accept an optional user id for visibility scoping', async () => {
      // Given
      const mockedTagResponse = { name: 'private-tag' };

      // When
      // @ts-expect-error findFirst mock returns partial type
      prismaMock.tag.findFirst.mockResolvedValue(mockedTagResponse);
      prismaMock.article.count.mockResolvedValue(5);

      // Then
      const result = await getTagByName('private-tag', 456);
      expect(result).toEqual({ name: 'private-tag', articlesCount: 5 });
    });
  });
});
