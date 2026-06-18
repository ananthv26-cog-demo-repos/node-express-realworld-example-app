import prisma from '../../../prisma/prisma-client';
import HttpException from '../../models/http-exception.model';
import { Tag } from './tag.model';

const buildAuthorVisibilityQueries = (id?: number) => {
  const queries = [];
  queries.push({ demo: true });

  if (id) {
    queries.push({
      id: {
        equals: id,
      },
    });
  }

  return queries;
};

export const getTags = async (id?: number): Promise<string[]> => {
  const queries = buildAuthorVisibilityQueries(id);

  const tags = await prisma.tag.findMany({
    where: {
      articles: {
        some: {
          author: {
            OR: queries,
          },
        },
      },
    },
    select: {
      name: true,
    },
    orderBy: {
      articles: {
        _count: 'desc',
      },
    },
    take: 10,
  });

  return tags.map((tag: Tag) => tag.name);
};

export const getTagByName = async (
  tagName: string,
  id?: number,
): Promise<{ name: string; articlesCount: number }> => {
  const name = tagName?.trim();

  if (!name) {
    throw new HttpException(422, { errors: { tag: ["can't be blank"] } });
  }

  const authorQueries = buildAuthorVisibilityQueries(id);

  const tag = await prisma.tag.findFirst({
    where: {
      name,
      articles: {
        some: {
          author: { OR: authorQueries },
        },
      },
    },
    select: { name: true },
  });

  if (!tag) {
    throw new HttpException(404, { errors: { tag: ['not found'] } });
  }

  const articlesCount = await prisma.article.count({
    where: {
      tagList: { some: { name } },
      author: { OR: authorQueries },
    },
  });

  return {
    name: tag.name,
    articlesCount,
  };
};

export default getTags;
