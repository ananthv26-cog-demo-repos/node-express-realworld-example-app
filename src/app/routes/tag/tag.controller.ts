import { NextFunction, Request, Response, Router } from 'express';
import auth from '../auth/auth';
import getTags, { getTagByName } from './tag.service';

const router = Router();

/**
 * Get top 10 popular tags
 * @auth optional
 * @route {GET} /api/tags
 * @returns tags list of tag names
 */
router.get('/tags', auth.optional, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await getTags(req.auth?.user?.id);
    res.json({ tags });
  } catch (error) {
    next(error);
  }
});

/**
 * Get a single tag by name
 * @auth optional
 * @route {GET} /api/tags/:tag
 * @param tag name of the tag
 * @returns tag object with name and articlesCount
 */
router.get('/tags/:tag', auth.optional, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tag = await getTagByName(req.params.tag);
    res.json({ tag });
  } catch (error) {
    next(error);
  }
});

export default router;
