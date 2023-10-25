import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { authenticationService, SignInParams } from '@/services';

export async function singInPost(req: Request, res: Response) {
  const { email, password } = req.body as SignInParams;

  const result = await authenticationService.signIn({ email, password });

  return res.status(httpStatus.OK).send(result);
}

export async function singInPostGithub(req: Request, res: Response) {
  const { code } = req.body;

  const result = await authenticationService.signInGithub(code);

  return res.status(httpStatus.OK).send(result);
}
