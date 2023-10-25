import { Router } from 'express';
import { singInPost, singInPostGithub } from '@/controllers';
import { validateBody } from '@/middlewares';
import { signInSchema } from '@/schemas';

const authenticationRouter = Router();

authenticationRouter.post('/sign-in', validateBody(signInSchema), singInPost).post('/github/sign-in', singInPostGithub);

export { authenticationRouter };
