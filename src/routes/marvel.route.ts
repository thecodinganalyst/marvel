import { Routes } from '@interfaces/routes.interface';
import { Router } from 'express';
import MarvelController from '@controllers/marvel.controller';

class MarvelRoute implements Routes {
  public path = '/characters';
  public router = Router();
  public marvelController = new MarvelController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/:id(\\d+)`, this.marvelController.getCharacterById);
    this.router.get(`${this.path}`, this.marvelController.getCharacterIdList);
  }
}

export default MarvelRoute;
