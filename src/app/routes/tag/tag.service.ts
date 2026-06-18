import prisma from '../../../prisma/prisma-client';
import HttpException from '../../models/http-exception.model';
import { Tag } from './tag.model';

export const getTags = async (id?: number): Promise<string[]> => {
  const queries = [];
  queries.push({ demo: true });

  if (id) {
    queries.push({
      id: {
        equals: id,
      },
    });
  }

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
): Promise<{ name: string; articlesCount: number }> => {
  const name = tagName?.trim();

  if (!name) {
    throw new HttpException(422, { errors: { tag: ["can't be blank"] } });
  }

  const tag = await prisma.tag.findUnique({
    where: { name },
    select: {
      name: true,
      articles: {
        select: { id: true },
      },
    },
  });

  if (!tag) {
    throw new HttpException(404, { errors: { tag: ['not found'] } });
  }

  return {
    name: tag.name,
    articlesCount: tag.articles.length,
  };
};

export default getTags;
